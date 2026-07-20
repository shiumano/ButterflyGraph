import { Container, ContainerNode } from "./container.js";

/**
 * @import { ContainerOptions, ContainerNodeOptions } from "@core/Graphics/Containers/container.js"
 * @typedef {ContainerOptions & {
 *   follow?: "all" | "scale" | "none"
 *   resolutionScale?: number
 *   imageSmoothing?: boolean
 *   supersize?: boolean
 *   redrawRainbow?: boolean
 * }} BufferedContainerOptions
 * @typedef {ContainerNodeOptions & {
 *   follow: "all" | "scale" | "none"
 *   resolutionScale: number
 *   imageSmoothing: boolean
 *   supersize: boolean
 *   redrawRainbow: boolean
 * }} BufferedContainerNodeOptions
 */

// 実験した範囲で一番でかかった誤差は 1.7877678004651898e-7
// ということで一応 1e-6としている 現実的に1.000001倍のスケールに気づける人間など居ない
const SCALE_DIFF_EPSILON = 0.000001;

/**
 * 描画内容をOffscreenCanvasに描画して、それを表示するContainer
 * 想定している使い方は、globalCompositeOperationを変更するなどして破壊的描画をする際のサンドボックスにすること
 *
 * パフォーマンスはCanvas APIのdrawImageが非常に低速なため、内部のオブジェクトが数十個を超えないと軽量化としての意味はない
 * また、内容が変化しまくるものをBufferedContainerに入れるべきではない
 *
 * 念押しで言うが、これはパフォーマンスのためのものじゃない。表現のためのものだ。
 * 使うときは慎重に、使わなきゃいけないときにだけ使うこと
 * @extends Container<BufferedContainerNode>
 */
export class BufferedContainer extends Container {
    #supersize;
    #follow;
    #resolutionScale;
    #imageSmoothing;
    #redrawRainbow;

    /**
     * @param {BufferedContainerOptions} options
     */
    constructor({
        supersize = false,
        follow = "scale",  // PERF: follow = scale、見た目の割にめっちゃ軽い 0.5pxの位置のズレなんてわからん
        resolutionScale = 1,
        imageSmoothing = true,
        redrawRainbow = false,
        ...options
    } = {}) {
        super(options);

        this.#supersize = supersize;
        this.#follow = follow;
        this.#resolutionScale = resolutionScale;
        this.#imageSmoothing = imageSmoothing;
        this.#redrawRainbow = redrawRainbow;
    }

    /**
     * childrenの描画範囲の計算をしていないため、supersizeでない場合強制的にクリップされる
     */
    get clip() { return super.clip || !this.supersize; }
    set clip(value) { super.clip = value; }

    /**
     * 実際のキャンバスのサイズをコピーするか否か
     * trueの場合、followの値は無視される
     *
     * めっちゃ重いので最終手段
     */
    get supersize() { return this.#supersize; }
    set supersize(value) {
        if (this.#supersize === value) return;

        this.#supersize = value;
        this.requestRecreate(this, "object");
    }

    /**
     * 更新する条件
     *
     * "all": 位置とスケール
     * "scale": スケールのみ
     * "none": 最初に描画されたまま
     */
    get follow() { return this.#follow; }
    set follow(value) {
        if (this.#follow === value) return;

        this.#follow = value;
        this.requestRecreate(this, "object");
    }

    get redrawRainbow() { return this.#redrawRainbow; }
    set redrawRainbow(value) {
        if (this.#redrawRainbow === value) return;

        this.#redrawRainbow = value;
        this.requestRecreate(this, "object");
    }

    get resolutionScale() { return this.#resolutionScale; }
    set resolutionScale(value) {
        if (this.#resolutionScale === value) return;

        this.#resolutionScale = value;
        this.requestRecreate(this, "object");
    }

    get imageSmoothing() { return this.#imageSmoothing; }
    set imageSmoothing(value) {
        if (this.#imageSmoothing === value) return;

        this.#imageSmoothing = value;
        this.requestRecreate(this, "object");
    }

    /**
     * @param {number} t
     * @returns {BufferedContainerNodeOptions}
     */
    calculateOptions(t) {
        const baseOptions = super.calculateOptions(t);

        const options = Object.assign(baseOptions, {
            objectChanged: this.objectChanged,
            supersize: this.supersize && !this.clip,
            follow: this.follow,
            resolutionScale: this.resolutionScale,
            imageSmoothing: this.imageSmoothing,
            redrawRainbow: this.redrawRainbow
        });

        return options;
    }

    /**
     * @param {number} t
     */
    updateNode(t) {
        this._updateChildren(t);

        const cachedNode = this.cachedNode ?? new BufferedContainerNode();
        cachedNode.read(this);

        return cachedNode;
    }

    isPerfectlyOptimized() { return this.constructor === BufferedContainer; }
}

// WARN: お前ごときがGCになるのか？
/** @type {WeakMap<ImageBitmap, number>} */
const bitmapRefCount = new WeakMap();
/** @type {FinalizationRegistry<ImageBitmap?>} */
const registry = new FinalizationRegistry((bmp) => deRef(bmp));

let bitmapCount = 0;

/**
 * @param {ImageBitmap?} bmp
 */
function incRef(bmp) {
    if (bmp === null) return;  // 虚無に参照など無い
    const refs = bitmapRefCount.get(bmp) ?? 0;
    if (refs === 0) bitmapCount++;
    bitmapRefCount.set(bmp, refs + 1);
}
/**
 * @param {ImageBitmap?} bmp
 */
function deRef(bmp) {
    if (bmp === null) return 0;  // 虚無に参照など無い

    const refs = bitmapRefCount.get(bmp) ?? 0;
    if (refs > 1) {
        bitmapRefCount.set(bmp, refs - 1);
    }
    else {
        bitmapRefCount.delete(bmp);
        try { bmp.close(); } catch { }
        bitmapCount--;
    }
    return refs - 1;
}

// setInterval(() => console.log(`Bitmap count: ${bitmapCount}`), 1000);

/**
 * @extends {ContainerNode<BufferedContainerNodeOptions>}
 */
class BufferedContainerNode extends ContainerNode {
    #buffer = new OffscreenCanvas(1, 1);
    // HACK: キャストしてます 互換性は若干ありません
    #bufferCtx =  /** @type {CanvasRenderingContext2D | null} */ (/** @type {any} */ this.#buffer.getContext("2d"));
    #bufferWidth = 1;
    #bufferHeight = 1;
    #supersize = false;
    #follow = "scale";
    #resolutionScale = 1;
    #imageSmoothing = true;

    #fullTrackPos = false;

    // デバッグ用!! でもおもろいから残した!!!!!!!!
    #redrawRainbow = false;

    // PERF: DRY原則とかそんなことを言ってられる余裕はない
    #width = 0;
    #height = 0;

    /** @type {ImageBitmap?} */
    #bitmap = null;
    /** @type {DOMMatrix2DInit?} */
    #oldTrasnform = null;

    #drawWidth = 0;
    #drawHeight = 0;

    #drawOffsetX = 0;
    #drawOffsetY = 0;

    #oldScale = 0;
    #oldCanvasWidth = 0;
    #oldCanvasHeight = 0;

    /**
     * @returns {BufferedContainerNodeOptions}
     */
    createDefaultOptions() {
        return Object.assign(super.createDefaultOptions(), {
            /** @type {BufferedContainerNodeOptions["follow"]} */
            follow: "scale",
            resolutionScale: 1,
            imageSmoothing: true,
            supersize: false,
            redrawRainbow: true
        });
    }

    /**
     * @param {Readonly<BufferedContainerNodeOptions>} options
     */
    read(options) {
        if (options.objectChanged) {
            const {
                width, height,
                follow, resolutionScale, imageSmoothing, supersize, redrawRainbow
            } = options;

            this.#width = width;
            this.#height = height;

            this.#follow = follow;

            const fullTrackPos = follow === "all" || supersize;
            this.#fullTrackPos = fullTrackPos;

            // スケールを合わせるなら1倍超えのレンダリングスケールに意味はない
            // そしてsuppersize * resolutionScale = 100なんてやろうものならいとも容易く爆散する
            this.#resolutionScale = (fullTrackPos || follow === "scale") ? Math.min(resolutionScale, 1) : resolutionScale;

            this.#supersize = supersize;
            this.#redrawRainbow = redrawRainbow;

            // 1:1であればimageSmoothingは不要
            const pixelJust = fullTrackPos && resolutionScale >= 1;
            this.#imageSmoothing = !pixelJust && imageSmoothing;

            // 内容が変化したので、描画済みビットマップを破棄
            deRef(this.#bitmap);
            this.#bitmap = null;

            const tOpt = this.options;
            tOpt.follow = follow;
            tOpt.resolutionScale = resolutionScale;
            tOpt.imageSmoothing = imageSmoothing;
            tOpt.supersize = supersize;
            tOpt.redrawRainbow = redrawRainbow;
        }

        super.read(options);
    }

    /**
     * @param {DOMMatrix2DInit} transform
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     */
    renderBuffer(transform, canvasWidth, canvasHeight) {
        const canvas = this.#buffer;
        const ctx = this.#bufferCtx;
        const { a = 1, b = 0, c = 0, d = 1, e = 0, f = 0 } = transform;

        if (ctx === null) return;

        const width = this.#width;
        const height = this.#height;

        const resolutionScale = this.#resolutionScale;

        if (resolutionScale === 0) return;  // 何pxで描けば良いって言うんですか？

        const rScale = 1 / resolutionScale;

        ctx.reset();
        if (this.#supersize) {
            this.#setupSupersizeContext(
                a, b, c, d, e, f,
                canvasWidth, canvasHeight,
                canvas, ctx, resolutionScale
            );
        } else {
            if (width === 0 || height === 0) return;  // 強制的にクリップされるので描くものがない

            if (this.#follow === "all") {
                this.#setupAllFollowContext(
                    a, b, c, d, e, f,
                    canvas, ctx, width, height, resolutionScale, rScale
                );
            } else {
                this.#setupAllowDriftContext(
                    a, b, c, d,
                    canvas, ctx, width, height, resolutionScale
                );
            }
        }

        if (this.#redrawRainbow) {
            ctx.save();
            ctx.resetTransform();
            ctx.fillStyle = `hsl(${performance.now() / 1000 % 1}turn 100% 50% / 0.5)`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }

        super.draw(ctx);

        registry.unregister(this);
        deRef(this.#bitmap);  // もういらないよ！
        this.#bitmap = this.#buffer.transferToImageBitmap();
        incRef(this.#bitmap);  // これ使うよ！
        registry.register(this, this.#bitmap);

        this.#oldTrasnform = transform;
    }

    /**
     * @param {number} a @param {number} b @param {number} c @param {number} d @param {number} e @param {number} f
     * @param {number} canvasWidth @param {number} canvasHeight
     * @param {OffscreenCanvas} canvas @param {CanvasRenderingContext2D} ctx @param {number} resolutionScale
     */
    #setupSupersizeContext(
        a, b, c, d, e, f,
        canvasWidth, canvasHeight,
        canvas, ctx, resolutionScale
    ) {
        // number | 0 → 雑floor なにが雑って符号付き32bit整数でオーバーフローする
        // ただし今回の相手はCanvas、2147483Kディスプレイなんて使ったら死ぬ
        const bufferWidth = canvasWidth * resolutionScale | 0 + 1;
        const bufferHeight = canvasHeight * resolutionScale | 0 + 1;

        if (this.#bufferWidth !== bufferWidth) {
            this.#oldCanvasWidth = canvasWidth;
            canvas.width = this.#bufferWidth = bufferWidth;
        }
        if (this.#bufferHeight !== bufferHeight) {
            this.#oldCanvasHeight = canvasHeight;
            canvas.height = this.#bufferHeight = bufferHeight;
        }

        this.#drawOffsetX = e;
        this.#drawOffsetY = f;

        this.#drawWidth = bufferWidth / resolutionScale;
        this.#drawHeight = bufferHeight / resolutionScale;

        ctx.setTransform(
            a * resolutionScale,
            b * resolutionScale,
            c * resolutionScale,
            d * resolutionScale,
            e * resolutionScale,
            f * resolutionScale
        );
    }

    /**
     * @param {number} a @param {number} b @param {number} c @param {number} d @param {number} e @param {number} f
     * @param {OffscreenCanvas} canvas @param {CanvasRenderingContext2D} ctx
     * @param {number} width @param {number} height  @param {number} resolutionScale @param {number} rScale
     */
    #setupAllFollowContext(
        a, b, c, d, e, f,
        canvas, ctx, width, height, resolutionScale, rScale
    ) {
        const topLeftX = 0, topLeftY = 0;
        const topRightX = width * a, topRightY = width * b;
        const bottomLeftX = height * c, bottomLeftY = height * d;
        const bottomRightX = topRightX + bottomLeftX, bottomRightY = topRightY + bottomLeftY;

        const top = Math.min(topLeftY, topRightY, bottomLeftY, bottomRightY);
        const bottom = Math.max(topLeftY, topRightY, bottomLeftY, bottomRightY);
        const left = Math.min(topLeftX, topRightX, bottomLeftX, bottomRightX);
        const right = Math.max(topLeftX, topRightX, bottomLeftX, bottomRightX);

        const bufferWidth = ((right - left) * resolutionScale | 0) + 5;
        const bufferHeight = ((bottom - top) * resolutionScale | 0) + 5;

        if (this.#bufferWidth !== bufferWidth) {
            canvas.width = this.#bufferWidth = bufferWidth;
        }
        if (this.#bufferHeight !== bufferHeight) {
            canvas.height = this.#bufferHeight = bufferHeight;
        }

        const misalignmentX = e % (rScale);
        const misalignmentY = f % (rScale);

        const alignedLeft = (left * resolutionScale | 0) / resolutionScale;
        const alignedTop = (top * resolutionScale | 0) / resolutionScale;

        const offsetX = -alignedLeft + 2 * rScale + misalignmentX;
        const offsetY = -alignedTop + 2 * rScale + misalignmentY;

        this.#drawOffsetX = offsetX;
        this.#drawOffsetY = offsetY;

        this.#drawWidth = bufferWidth / resolutionScale;
        this.#drawHeight = bufferHeight / resolutionScale;

        ctx.setTransform(
            a * resolutionScale,
            b * resolutionScale,
            c * resolutionScale,
            d * resolutionScale,
            offsetX * resolutionScale,
            offsetY * resolutionScale
        );
    }

    /**
     * @param {number} a @param {number} b @param {number} c @param {number} d
     * @param {OffscreenCanvas} canvas @param {CanvasRenderingContext2D} ctx
     * @param {number} width @param {number} height  @param {number} resolutionScale
     */
    #setupAllowDriftContext(
        a, b, c, d,
        canvas, ctx, width, height, resolutionScale
    ) {
        const transformScale = this.#follow === "scale"
            ? Math.max(Math.hypot(a, b), Math.hypot(c, d))  // XとYのスケールで、より大きい方を選ぶ
            : 1;  // follow === "none"、tansformは無視

        const bufferWidth = (Math.abs(width * resolutionScale * transformScale) | 0) + 3;
        const bufferHeight = (Math.abs(height * resolutionScale * transformScale) | 0) + 3;

        if (this.#bufferWidth !== bufferWidth) {
            canvas.width = this.#bufferWidth = bufferWidth;
        }
        if (this.#bufferHeight !== bufferHeight) {
            canvas.height = this.#bufferHeight = bufferHeight;
        }

        this.#oldScale = transformScale;

        ctx.setTransform(
            resolutionScale * transformScale,
            0, 0,
            resolutionScale * transformScale,
            1, 1
        );
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        const transform = ctx.getTransform();
        const { width: canvasWidth, height: canvasHeight } = ctx.canvas;

        const resolutionScale = this.#resolutionScale;
        if (this.#oldTrasnform === null
            || this.#bitmap === null
            || this.#follow === "scale" && !scaleEquals(transform, this.#oldScale)
            || this.#follow === "all" && !matEquals(transform, this.#oldTrasnform)
            || this.#supersize && (
                this.#oldCanvasWidth !== canvasWidth
                || this.#oldCanvasHeight !== canvasHeight
                || !matEquals(transform, this.#oldTrasnform))
        ) {
            this.renderBuffer(transform, canvasWidth, canvasHeight);
        }

        if (this.#bitmap === null) return;

        ctx.imageSmoothingEnabled = this.#imageSmoothing;

        if (this.#fullTrackPos) {
            ctx.resetTransform();
            ctx.drawImage(this.#bitmap,
                0, 0,
                this.#bufferWidth, this.#bufferHeight,
                transform.e - this.#drawOffsetX, transform.f - this.#drawOffsetY,
                this.#drawWidth, this.#drawHeight
            );
        } else {
            const drawScale = 1 / resolutionScale / this.#oldScale;
            ctx.scale(drawScale, drawScale);
            ctx.drawImage(this.#bitmap, -1, -1);
        }
    }
}

/**
 * @param {DOMMatrix2DInit} a
 * @param {DOMMatrix2DInit} b
 */
function matEquals(a, b) {
    return (
        a.a === b.a &&
        a.b === b.b &&
        a.c === b.c &&
        a.d === b.d &&
        a.e === b.e &&
        a.f === b.f
    );
}

/**
 * @param {DOMMatrix} matrix
 * @param {number} scale
 */
function scaleEquals(matrix, scale) {
    const diff = Math.max(
        Math.hypot(matrix.a, matrix.b),
        Math.hypot(matrix.c, matrix.d)
    ) - scale;

    return -SCALE_DIFF_EPSILON < diff && diff < SCALE_DIFF_EPSILON;
}

import { Container, ContainerNode } from "./container.js";

/**
 * @import { ContainerOptions, ContainerNodeOptions } from "@core/Graphics/Containers/container.js"
 * @typedef {ContainerOptions & {
 *   follow?: "all" | "scale" | "none"
 *   resolutionScale?: number
 *   supersize?: boolean
 *   redrawRainbow?: boolean
 * }} BufferedContainerOptions
 * @typedef {ContainerNodeOptions & {
 *   objectChanged?: boolean
 *   follow: "all" | "scale" | "none"
 *   resolutionScale: number
 *   supersize: boolean
 *   redrawRainbow?: boolean
 * }} BufferedContainerNodeOptions
 */

/**
 * 描画内容をOffscreenCanvasに描画して、それを表示するContainer
 * 想定している使い方は、globalCompositeOperationを変更するなどして破壊的描画をする際のサンドボックスにすること
 *
 * パフォーマンスはCanvas APIのdrawImageが非常に低速なため、内部のオブジェクトが数十個を超えないと軽量化としての意味はない
 * また、内容が変化しまくるものをBufferedContainerに入れるべきではない
 *
 * 使うときは慎重に、使わなきゃいけないときにだけ使うこと
 * @extends Container<BufferedContainerNode>
 */
export class BufferedContainer extends Container {
    #supersize;
    #follow;
    #resolutionScale;
    #redrawRainbow = false;

    /**
     * @param {BufferedContainerOptions} options
     */
    constructor(options = {}) {
        super(options);

        this.#supersize = options.supersize ?? false;
        this.#follow = options.follow ?? "scale";  // PERF: follow = scale、見た目の割にめっちゃ軽い 0.5pxの位置のズレなんてわからん
        this.#resolutionScale = options.resolutionScale ?? 1;
        this.#redrawRainbow = options.redrawRainbow ?? false;
    }

    // FIXME: childrenの描画範囲の計算をしていないため、supersizeでない場合強制的にクリップされる
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
        this.requestRecreate("object");
    }

    /**
     * 更新する条件
     * "all": 位置とスケール
     * "scale": スケールのみ
     * "none": 最初に描画されたまま
     */
    get follow() { return this.#follow; }
    set follow(value) {
        if (this.#follow === value) return;

        this.#follow = value;
        this.requestRecreate("object");
    }

    get redrawRainbow() { return this.#redrawRainbow; }
    set redrawRainbow(value) {
        if (this.#redrawRainbow === value) return;

        this.#redrawRainbow = value;
        this.requestRecreate("object");
    }

    get resolutionScale() { return this.#resolutionScale; }
    set resolutionScale(value) {
        if (this.#resolutionScale === value) return;

        this.#resolutionScale = value;
        this.requestRecreate("object");
    }

    /**
     * @param {number} t
     */
    calculateOptions(t) {
        const options = super.calculateOptions(t);

        return {
            ...options,
            objectChanged: this.objectChanged,
            supersize: this.supersize && !this.clip,
            follow: this.follow,
            resolutionScale: this.resolutionScale,
            redrawRainbow: this.#redrawRainbow
        };
    }

    /**
     * @param {number} t
     */
    createSnapshot(t) {
        const options = this.calculateOptions(t);
        return this.cachedNode?.with(options) ?? new BufferedContainerNode(options);
    }

    get perfectlyOptimized() { return this.constructor === BufferedContainer && this.childrenPerfectlyOptimized; }
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
    /** @type {OffscreenCanvas?} */
    #buffer;
    /** @type {CanvasRenderingContext2D?} */
    #bufferCtx;
    #bufferWidth = 1;
    #bufferHeight = 1;
    #supersize;
    #follow;
    #resolutionScale;
    /** @type {boolean} */
    #incompletePosition;
    #drawOffsetX = 0;
    #drawOffsetY = 0;
    #drawScaleX = 1;
    #drawScaleY = 1;
    /** @type {ImageBitmap?} */
    #bitmap = null;
    /** @type {DOMMatrix?} */
    #oldTrasnform = null;
    #oldScaleX = 1;
    #oldScaleY = 1;

    // デバッグ用!! でもおもろいから残した!!!!!!!!
    #redrawRainbow;

    /**
     * @param {BufferedContainerNodeOptions} options
     * @param {BufferedContainerNode?} oldNode
     */
    constructor(options, oldNode = null) {
        super(options, oldNode);

        this.#redrawRainbow = options.redrawRainbow ?? false;

        this.#supersize = options.supersize;
        this.#follow = options.follow;
        this.#resolutionScale = options.resolutionScale;

        // 複雑な条件は事前に固定
        this.#incompletePosition = !options.supersize && options.follow !== "all" || options.resolutionScale !== 1;
        if (oldNode instanceof BufferedContainerNode) {
            // バッファの所有権を移譲
            this.#buffer = oldNode.#buffer;
            this.#bufferCtx = oldNode.#bufferCtx;

            oldNode.#buffer = null;
            oldNode.#bufferCtx = null;

            // バッファに設定済みの値を引き継ぎ
            this.#drawOffsetX = oldNode.#drawOffsetX;
            this.#drawOffsetY = oldNode.#drawOffsetY;
            this.#drawScaleX = oldNode.#drawScaleX;
            this.#drawScaleY = oldNode.#drawScaleY;

            this.#oldTrasnform = oldNode.#oldTrasnform;
            this.#oldScaleX = oldNode.#oldScaleX;
            this.#oldScaleY = oldNode.#oldScaleY;

            if (options.objectChanged === false) {
                // 描画内容も引き継ぎ
                this.#bitmap = oldNode.#bitmap;
                incRef(this.#bitmap);  // 使ってる人が増えたよ！
                registry.register(this, this.#bitmap);
            }
        } else {
            this.#buffer = new OffscreenCanvas(1, 1);
            // HACK: キャストしてます 互換性は若干ありません
            this.#bufferCtx = /** @type {CanvasRenderingContext2D | null} */ /** @type {any} */ (this.#buffer.getContext("2d"));
        }
    }

    /**
     * @param {Partial<BufferedContainerNodeOptions>} options
     */
    with(options) {
        if (this.constructor !== BufferedContainerNode)
            throw new Error(`The ${this.constructor.name}.with(options) is not implemented.`);

        return new BufferedContainerNode({...this.options, ...options}, this)
    }

    /**
     * @param {DOMMatrix} transform
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     */
    renderBuffer(transform, canvasWidth, canvasHeight) {
        if (this.#buffer === null) {
            this.#buffer = new OffscreenCanvas(1, 1);
            this.#bufferCtx = /** @type {CanvasRenderingContext2D | null} */ /** @type {any} */ (this.#buffer.getContext("2d"));
        }
        if (this.#bufferCtx === null) return;
        this.#bufferCtx.reset();

        const transformX = transform.e;
        const transformY = transform.f;
        const scaleX = (this.#follow !== "none" ? Math.hypot(transform.a, transform.b) : 1) * this.#resolutionScale;  // HACK: 神の行になりつつある
        const scaleY = (this.#follow !== "none" ? Math.hypot(transform.c, transform.d) : 1) * this.#resolutionScale;  // HACK: 神の行になりつつある
        // FIXME: follow = "all"でも回転するとぼやける
        // TODO: AABBだるいからあとでやる 休ませてくれ……
        // const transformRotation = Math.atan2(transform.b, transform.a);

        if (scaleX == 0 || scaleY == 0) return;  // 描画するものは何もない
        // FIXME: scaleXまたはscaleYが負の値だとバグる
        // TODO: 一旦逃げるが、左右or上下が反転したものが描画できるようにいつか直す
        if (scaleX < 0 || scaleY < 0) return;

        let width;
        let height;

        let drawOffsetX = 0;
        let drawOffsetY = 0;

        if (this.#supersize) {
            width = canvasWidth;
            height = canvasHeight;
            drawOffsetX = transformX;
            drawOffsetY = transformY;
        } else {
            width = this.width * scaleX + 3;  // 正確にはceil(width*scaleX) + 2
            height = this.height * scaleY + 3;

            if (this.#follow === "all") {
                drawOffsetX = transformX % 1 + 1;
                drawOffsetY = transformY % 1 + 1;
            } else if (this.#follow === "scale") {
                drawOffsetX = 1;
                drawOffsetY = 1;
            }
        }

        this.#bufferWidth = width;
        this.#bufferHeight = height;
        this.#oldTrasnform = transform;
        this.#oldScaleX = scaleX;
        this.#oldScaleY = scaleY;
        this.#drawOffsetX = drawOffsetX;
        this.#drawOffsetY = drawOffsetY;
        this.#drawScaleX = 1 / scaleX;
        this.#drawScaleY = 1 / scaleY;

        this.#buffer.width = width;
        this.#buffer.height = height;
        if (this.#redrawRainbow) {
            this.#bufferCtx.fillStyle = `hsl(${performance.now() / 1000 % 1}turn 100% 50% / 0.5)`
            this.#bufferCtx.fillRect(0, 0, width, height);
        }

        if (drawOffsetX !== 0 || drawOffsetY !== 0)
            this.#bufferCtx.translate(drawOffsetX, drawOffsetY);

        if (scaleX !== 1 || scaleY !== 1)
            this.#bufferCtx.scale(scaleX, scaleY);

        super.draw(this.#bufferCtx);

        deRef(this.#bitmap);  // もういらないよ！
        registry.unregister(this);
        const bitmap = this.#buffer.transferToImageBitmap();
        this.#bitmap = bitmap;
        incRef(bitmap);  // これ使うよ！
        registry.register(this, this.#bitmap);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        const transform = ctx.getTransform();
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
        if (this.#oldTrasnform === null
            || this.#bitmap === null
            || this.#supersize && (
                this.#bufferWidth != canvasWidth
                || this.#bufferHeight != canvasHeight)
            || this.#follow === "all" && !matEquals(transform, this.#oldTrasnform)
            || this.#follow === "scale" && !scaleEquals(transform, this.#oldScaleX, this.#oldScaleY)
        ) {
            this.renderBuffer(transform, canvasWidth, canvasHeight);
        }

        if (this.#bitmap === null) return;

        if (this.#drawScaleX !== 1 || this.#drawScaleY !== 1)
            ctx.scale(this.#drawScaleX, this.#drawScaleY);

        ctx.imageSmoothingEnabled = this.#incompletePosition;
        ctx.drawImage(
            this.#bitmap,
            -this.#drawOffsetX,
            -this.#drawOffsetY,
        );
    }
}

/**
 * @param {DOMMatrix} a
 * @param {DOMMatrix} b
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
 * @param {number} scaleX
 * @param {number} scaleY
 */
function scaleEquals(matrix, scaleX, scaleY) {
    return (
        Math.hypot(matrix.a, matrix.b) === scaleX &&
        Math.hypot(matrix.c, matrix.d) === scaleY
    );
}

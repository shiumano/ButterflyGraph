import { Anchor } from "./anchor.js";
import { Gradient, GradientBuilder } from "./Gradients/gradient.js";

/**
 * @import { Vector2 } from "./vector2"
 * @typedef {{
 *   x: number
 *   y: number
 *   rotation: number
 *   width: number
 *   height: number
 *   scaleX: number
 *   scaleY: number
 *   anchor: Readonly<Vector2>
 *   origin: Readonly<Vector2>
 *   originOffsetX: number
 *   originOffsetY: number
 *   parentWidth: number
 *   parentHeight: number
 *   alpha: number
 *   zIndex: number
 *   fillStyle: string | CanvasGradient | CanvasPattern | Gradient | GradientBuilder | undefined
 *   strokeStyle: string | CanvasGradient | CanvasPattern | Gradient | GradientBuilder | undefined
 *   visible: boolean
 *   showBounds: boolean
 *   transformChanged: boolean
 *   objectChanged: boolean
 * }} DrawNodeOptions
 * @typedef {DrawNode<DrawNodeOptions>} GenericDrawNode
 */

/**
 * @template T
 * @typedef {T extends DrawNode<infer U> ? U : never} NodeOptions
 */

// しょうがない: ……そろそろCanvasRenderingContext2Dの再実装になってきたね でも互換レイヤーだから仕方ない
/**
 * x, yを起点として、オブジェクトを描画するためのクラス。
 * イミュータブルとし、変更があった場合は再作成する。
 * @template {DrawNodeOptions} T
 */
export class DrawNode {
    // しょうがない: これはもう、うっかりやらかしてたら爆死するしか無い
    #options = /** @type {Partial<T>} */(this.createDefaultOptions());

    #width = 0;
    #height = 0;
    #alpha = 1;
    #zIndex = 0;
    /** @type {string | CanvasGradient | CanvasPattern | undefined} */
    #fillStyle = undefined;
    /** @type {Gradient | GradientBuilder | undefined} */
    #fillGradient = undefined;
    /** @type {string | CanvasGradient | CanvasPattern | undefined} */
    #strokeStyle = undefined;
    /** @type {Gradient | GradientBuilder | undefined} */
    #strokeGradient = undefined;
    #visible = true;
    #showBounds = false;

    /**
     * @type {[number, number, number, number, number, number]}
     */
    #transformMatrix = [0, 0, 0, 0, 0, 0];
    #hasTransform = false;

    constructor() {
        if (this.constructor === DrawNode) {
            console.warn("Constructing abstract class!");
        }
    }

    get options() { return this.#options; }

    get width() { return this.#width; }
    get height() { return this.#height; }

    get zIndex() { return this.#zIndex; }

    /**
     * 初期状態のoptionsの生成
     * @returns {DrawNodeOptions}
     */
    createDefaultOptions() {
        const options = {
            x: 0,
            y: 0,
            rotation: 0,
            width: 0,
            height: 0,
            scaleX: 0,
            scaleY: 0,
            anchor: Anchor.topLeft,
            origin: Anchor.topLeft,
            originOffsetX: 0,
            originOffsetY: 0,
            parentWidth: 0,
            parentHeight: 0,
            alpha: 1,
            zIndex: 0,
            fillStyle: undefined,
            strokeStyle: undefined,
            visible: true,
            showBounds: false,
            transformChanged: true,
            objectChanged: true,
        };

        return options;
    }

    /**
     * @param {Readonly<T>} options
     */
    read(options) {
        const {
            x, y, rotation,
            width, height,
            scaleX, scaleY,
            anchor, origin,
            originOffsetX, originOffsetY,
            parentWidth, parentHeight,
            alpha, zIndex,
            fillStyle, strokeStyle,
            visible, showBounds,
            transformChanged, objectChanged
        } = options;

        this.#width = width;
        this.#height = height;
        this.#alpha = alpha;
        this.#zIndex = zIndex;

        // type判定は先にやっておく、drawではnullチェックのみとする
        if (fillStyle instanceof GradientBuilder
            || fillStyle instanceof Gradient
        ) {
            this.#fillGradient = fillStyle;
        }
        else {
            this.#fillStyle = fillStyle;
        }

        if (strokeStyle instanceof GradientBuilder
            || strokeStyle instanceof Gradient
        ) {
            this.#strokeGradient = strokeStyle;
        }
        else {
            this.#strokeStyle = strokeStyle;
        }

        this.#visible = visible;
        this.#showBounds = showBounds ?? false;

        const drawX = x - originOffsetX + parentWidth * anchor.x;
        const drawY = y - originOffsetY + parentHeight * anchor.y;

        if (options.transformChanged) {
            const hasTransform = drawX !== 0 || drawY !== 0 || rotation !== 0 || scaleX !== 1 || scaleY !== 1;
            this.#hasTransform = hasTransform;
            if (hasTransform) {
                const transformMatrix = this.#transformMatrix;
                // 回転のサイン・コサインを計算
                const rCos = Math.cos(rotation);
                const rSin = Math.sin(rotation);

                // 行列の各成分を計算
                transformMatrix[0] = scaleX * rCos;
                transformMatrix[1] = scaleX * rSin;
                transformMatrix[2] = -scaleY * rSin;
                transformMatrix[3] = scaleY * rCos;
                transformMatrix[4] = drawX + originOffsetX - originOffsetX * rCos + originOffsetY * rSin;
                transformMatrix[5] = drawY + originOffsetY - originOffsetX * rSin - originOffsetY * rCos;
                // クソややこしいね！translateとrotateとscaleが恋しいよ
            }
        }

        // options状態をコピー
        const tOpt = this.options;
        tOpt.x = x; tOpt.y = y; tOpt.rotation = rotation;
        tOpt.width = width; tOpt.height = height;
        tOpt.scaleX = scaleX; tOpt.scaleY = scaleY;
        tOpt.anchor = anchor; tOpt.origin = origin;
        tOpt.originOffsetX = originOffsetX; tOpt.originOffsetY = originOffsetY;
        tOpt.parentWidth = parentWidth; tOpt.parentHeight = parentHeight;
        tOpt.alpha = alpha; tOpt.zIndex = zIndex;
        tOpt.fillStyle = fillStyle; tOpt.strokeStyle = strokeStyle;
        tOpt.visible = visible; tOpt.showBounds = showBounds;
        tOpt.transformChanged = transformChanged; tOpt.objectChanged = objectChanged;
    }

    /**
     * ctxにtransform を適用し、自身と子を描画
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
        if (!this.#visible || this.#alpha === 0) return;

        ctx.save();

        if (this.#hasTransform) {
            // PERF: ここスプレッドつかってるけど全引数をインデックスアクセスで出してもそんな改善しなかった
            //     : 毎フレーム1000回やるエグいケースでも差がないので問題ないと言っていいでしょう
            //     : そもそもそんな複雑なものCanvas APIで描こうと思うな WebGLでやれ
            ctx.transform(...this.#transformMatrix);
        }

        if (this.#alpha !== 1) {
            ctx.globalAlpha *= this.#alpha;
        }

        if (this.#showBounds) {
            ctx.save();
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = "#fdd";
            ctx.fillRect(0, 0, this.#width, this.#height);
            ctx.restore();
        }

        if (this.#fillStyle !== undefined) {
            ctx.fillStyle = this.#fillStyle;
        }
        else if (this.#fillGradient !== undefined) {
            ctx.fillStyle = this.#fillGradient.getGradient(ctx);
        }

        if (this.#strokeStyle !== undefined) {
            ctx.strokeStyle = this.#strokeStyle;
        }
        else if (this.#strokeGradient !== undefined) {
            ctx.strokeStyle = this.#strokeGradient.getGradient(ctx);
        }

        this.draw(ctx);

        ctx.restore();
    }

    /**
     * 派生クラスで実装
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) { }

    // スーパー簡易グローバルID
    static #globalCreatedCount = 0;
    #globalId = DrawNode.#globalCreatedCount++;
    get globalId() { return this.#globalId; }
}

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
    #options;
    #width;
    #height;
    #alpha;
    #zIndex;
    #fillStyle;
    #fillGradient;
    #strokeStyle;
    #strokeGradient;
    #visible;
    #showBounds;

    /**
     * @type {[number, number, number, number, number, number]}
     */
    #transformMatrix = [0, 0, 0, 0, 0, 0];
    #hasTransform = false;

    /**
     * @param {T} options
     * @param {DrawNode<T>?} oldNode
     */
    constructor(options, oldNode = null) {
        if (this.constructor === DrawNode) {
            console.warn("Constructing abstract class!");
        }

        this.#options = options;

        this.#width = options.width;
        this.#height = options.height;
        this.#alpha = options.alpha;
        this.#zIndex = options.zIndex;

        // type判定は先にやっておく、drawではnullチェックのみとする
        if (options.fillStyle instanceof GradientBuilder
            || options.fillStyle instanceof Gradient
        ) {
            this.#fillGradient = options.fillStyle;
        }
        else {
            this.#fillStyle = options.fillStyle;
        }

        if (options.strokeStyle instanceof GradientBuilder
            || options.strokeStyle instanceof Gradient
        ) {
            this.#strokeGradient = options.strokeStyle;
        }
        else {
            this.#strokeStyle = options.strokeStyle;
        }

        this.#visible = options.visible;

        this.#showBounds = options.showBounds ?? false;

        const { x, y, anchor, originOffsetX, originOffsetY, parentWidth, parentHeight, rotation, scaleX, scaleY } = options;
        const drawX = x - originOffsetX + parentWidth * anchor.x;
        const drawY = y - originOffsetY + parentHeight * anchor.y;

        if (!options.transformChanged && oldNode !== null) {
            this.#transformMatrix = oldNode.#transformMatrix;
        } else {
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
    }

    /** @type {Readonly<T>} */
    get options() { return this.#options; }

    get width() { return this.#width; }
    get height() { return this.#height; }

    get zIndex() { return this.#zIndex; }

    /**
     * @param {T} options
     */
    read(options) {
        this.#options = options;

        this.#width = options.width;
        this.#height = options.height;
        this.#alpha = options.alpha;
        this.#zIndex = options.zIndex;

        // type判定は先にやっておく、drawではnullチェックのみとする
        if (options.fillStyle instanceof GradientBuilder
            || options.fillStyle instanceof Gradient
        ) {
            this.#fillGradient = options.fillStyle;
        }
        else {
            this.#fillStyle = options.fillStyle;
        }

        if (options.strokeStyle instanceof GradientBuilder
            || options.strokeStyle instanceof Gradient
        ) {
            this.#strokeGradient = options.strokeStyle;
        }
        else {
            this.#strokeStyle = options.strokeStyle;
        }

        this.#visible = options.visible;

        this.#showBounds = options.showBounds ?? false;


        const { x, y, anchor, originOffsetX, originOffsetY, parentWidth, parentHeight, rotation, scaleX, scaleY } = options;
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

import { Anchor } from "./anchor.js";
import { Gradient } from "./Gradients/gradient.js";
import { classOf } from "../Utils/metaPrg.js";

/**
 * @import { Pos } from "./vector2"
 * @typedef {{
 *   x: number
 *   y: number
 *   rotation: number
 *   width: number
 *   height: number
 *   scaleX: number
 *   scaleY: number
 *   anchor: Readonly<Pos>
 *   origin: Readonly<Pos>
 *   originOffsetX: number
 *   originOffsetY: number
 *   parentWidth: number
 *   parentHeight: number
 *   alpha: number
 *   fillStyle: string | CanvasGradient | CanvasPattern | Gradient | undefined
 *   strokeStyle: string | CanvasGradient | CanvasPattern | Gradient | undefined
 *   visible: boolean
 *   showBounds: boolean
 *   transformChanged: boolean
 *   objectChanged: boolean
 * }} DrawNodeOptions
 */

// しょうがない: ……そろそろCanvasRenderingContext2Dの再実装になってきたね でも互換レイヤーだから仕方ない
/**
 * x, yを起点として、オブジェクトを描画するためのクラス。
 * @template {DrawNodeOptions} [T=DrawNodeOptions]
 */
export class DrawNode {
    // しょうがない: これはもう、うっかりやらかしてたら爆死するしか無い
    #options = /** @type {Partial<T>} */(this.createDefaultOptions());

    #width = 0;
    #height = 0;
    #alpha = 1;
    /** @type {string | CanvasGradient | CanvasPattern | undefined} */
    #fillStyle = undefined;
    /** @type {Gradient | undefined} */
    #fillGradient = undefined;
    /** @type {string | CanvasGradient | CanvasPattern | undefined} */
    #strokeStyle = undefined;
    /** @type {Gradient | undefined} */
    #strokeGradient = undefined;
    #visible = true;
    #showBounds = false;

    #t_a = 1; #t_b = 0; #t_c = 0;
    #t_d = 1; #t_e = 0; #t_f = 0;

    #hasTransform = false;

    constructor() {
        if (classOf(this) === DrawNode) {
            console.warn("Constructing abstract class!");
        }
    }

    get options() { return this.#options; }

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
        const { transformChanged, objectChanged } = options;

        const tOpt = this.options;

        if (objectChanged) {
            const { width, height, fillStyle, strokeStyle, showBounds } = options;
            this.#width = width;
            this.#height = height;

            // type判定は先にやっておく、drawではnullチェックのみとする
            if (fillStyle instanceof Gradient) {
                this.#fillStyle = undefined;
                this.#fillGradient = fillStyle;
            } else {
                this.#fillStyle = fillStyle;
                this.#fillGradient = undefined;
            }

            if (strokeStyle instanceof Gradient) {
                this.#strokeGradient = strokeStyle;
            } else {
                this.#strokeStyle = strokeStyle;
            }

            this.#showBounds = showBounds ?? false;

            // options状態をコピー
            tOpt.width = width; tOpt.height = height;
            tOpt.fillStyle = fillStyle; tOpt.strokeStyle = strokeStyle;
            tOpt.showBounds = showBounds;
        }

        if (transformChanged) {
            const {
                x, y, rotation,
                scaleX, scaleY,
                anchor, origin,
                originOffsetX, originOffsetY,
                parentWidth, parentHeight,
                alpha, visible,
            } = options;

            this.#alpha = alpha;
            this.#visible = visible;
            const drawX = x - originOffsetX + parentWidth * anchor.x;
            const drawY = y - originOffsetY + parentHeight * anchor.y;

            const hasTransform = drawX !== 0 || drawY !== 0 || rotation !== 0 || scaleX !== 1 || scaleY !== 1;
            this.#hasTransform = hasTransform;
            if (hasTransform) {
                // 回転のサイン・コサインを計算
                const rCos = Math.cos(rotation);
                const rSin = Math.sin(rotation);

                this.#t_a = scaleX * rCos;
                this.#t_b = scaleX * rSin;
                this.#t_c = -scaleY * rSin;
                this.#t_d = scaleY * rCos;
                this.#t_e = drawX + originOffsetX - originOffsetX * rCos + originOffsetY * rSin;
                this.#t_f = drawY + originOffsetY - originOffsetX * rSin - originOffsetY * rCos;
                // クソややこしいね！translateとrotateとscaleが恋しいよ
            }

            tOpt.x = x; tOpt.y = y; tOpt.rotation = rotation;
            tOpt.scaleX = scaleX; tOpt.scaleY = scaleY;
            tOpt.anchor = anchor; tOpt.origin = origin;
            tOpt.originOffsetX = originOffsetX; tOpt.originOffsetY = originOffsetY;
            tOpt.parentWidth = parentWidth; tOpt.parentHeight = parentHeight;
            tOpt.alpha = alpha; tOpt.visible = visible;
        }

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
            ctx.transform(
                this.#t_a, this.#t_b, this.#t_c,
                this.#t_d, this.#t_e, this.#t_f
            );
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
    static get globalCreatedCount() { return this.#globalCreatedCount; }
    #globalId = DrawNode.#globalCreatedCount++;
    get globalId() { return this.#globalId; }

    static #finalizedCount = 0;
    static #finalizationRegistory = new FinalizationRegistry(() => this.#finalizedCount++);
    static get finalizedCount() { return this.#finalizedCount; }
}

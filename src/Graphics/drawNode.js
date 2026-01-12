import { GradientBuilder } from "./Gradients/gradient.js"

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
 *   anchor: Vector2
 *   origin: Vector2
 *   originOffsetX: number
 *   originOffsetY: number
 *   alpha: number
 *   zIndex: number
 *   fillStyle?: string | CanvasGradient | CanvasPattern | GradientBuilder
 *   strokeStyle?: string | CanvasGradient | CanvasPattern | GradientBuilder
 *   visible: boolean
 *   showBounds?: boolean
 * }} DrawNodeOptions
 */

// しょうがない: ……そろそろCanvasRenderingContext2Dの再実装になってきたね でも互換レイヤーだから仕方ない
/**
 * x, yを起点として、オブジェクトを描画するためのクラス。
 * イミュータブルとし、変更があった場合は再作成する。
 */
export class DrawNode {
    #options;
    #x;
    #y;
    #rotation;
    #rotationCenterX;
    #rotationCenterY;
    #width;
    #height;
    #scaleX;
    #scaleY;
    #alpha;
    #zIndex;
    #fillColor;
    #fillGradient;
    #strokeColor;
    #strokeGradient;
    #visible;
    #showBounds;

    /**
     * @param {DrawNodeOptions} options
     * @param {DrawNode?} oldNode
     */
    constructor(options, oldNode = null) {
        if (this.constructor === DrawNode)
            console.warn("Constructing abstract class!");

        this.#options = Object.freeze(options);

        this.#x = options.x;
        this.#y = options.y;
        this.#rotation = options.rotation;
        this.#rotationCenterX = options.originOffsetX;
        this.#rotationCenterY = options.originOffsetY;
        this.#width = options.width;
        this.#height = options.height;
        this.#scaleX = options.scaleX;
        this.#scaleY = options.scaleY;
        this.#alpha = options.alpha;
        this.#zIndex = options.zIndex;

        // type判定は先にやっておく、drawではnullチェックのみとする
        if (options.fillStyle instanceof GradientBuilder)
            this.#fillGradient = options.fillStyle;
        else
            this.#fillColor = options.fillStyle;

        if (options.strokeStyle instanceof GradientBuilder)
            this.#strokeGradient = options.strokeStyle;
        else
            this.#strokeColor = options.strokeStyle;

        this.#visible = options.visible;

        this.#showBounds = options.showBounds ?? false;
    }

    /**
     * TODO: any消せ
     * FIXME: any消せ
     * HACK: any消せ
     * TOOBAD: パブリックのany消せ
     * WARN: コードとしては確実にコンストラクタで与えられた型になるんだけど
     * IDK: それをJSDocでどうやって伝えればいいのか わ か ら な い
     * しょうがない: ←で終わらすな、解決策は模索し続けろ
     * PERF: 型は実行時には消滅します
     * @type {any}
     */
    get options() { return this.#options; }

    get width() { return this.#width; }
    get height() { return this.#height; }

    get zIndex() { return this.#zIndex; }

    // いつかグラデーションの設定の処理を追加しようと思うと、こうしておくほうが良い
    /**
     * ctxに塗りつぶしの色を設定する
     * @param {CanvasRenderingContext2D} ctx
     */
    _setFillStyle(ctx) {
        if (this.#fillColor !== undefined)
            ctx.fillStyle = this.#fillColor;
        else if (this.#fillGradient !== undefined)
            ctx.fillStyle = this.#fillGradient.getGradient(ctx);
    }

    /**
     * ctxに線の色を設定する
     * @param {CanvasRenderingContext2D} ctx
     */
    _setStrokeStyle(ctx) {
        if (this.#strokeColor !== undefined)
            ctx.strokeStyle = this.#strokeColor;
        else if (this.#strokeGradient !== undefined)
            ctx.strokeStyle = this.#strokeGradient.getGradient(ctx);
    }

    // 派生クラスで実装する必要があるので、あくまでこれはサンプル実装
    /**
     * 新しいオプションを指定して再生成
     * @abstract
     * @param {Partial<DrawNodeOptions>} options
     */
    with(options) {
        if (this.constructor !== DrawNode)
            throw new Error(`The ${this.constructor.name}.with(options) is not implemented.`);

        return new DrawNode({...this.options, ...options}, this)
    }

    /**
     * ctxにtransform を適用し、自身と子を描画
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
        if (!this.#visible || this.#alpha === 0) return;

        ctx.save();

        // PERF: ctxへの操作は死ぬほど重い ifで避けたほうが圧倒的に得
        // PERF: あとこのifはJITが(たぶん)消してくれます
        if (this.#x || this.#y) {
            ctx.translate(this.#x, this.#y);
        }
        if (this.#rotation !== 0) {
            if (this.#rotationCenterX !== 0 || this.#rotationCenterY !== 0) {
                ctx.translate(this.#rotationCenterX, this.#rotationCenterY);
                ctx.rotate(this.#rotation);
                ctx.translate(-this.#rotationCenterX, -this.#rotationCenterY);
            } else {
                ctx.rotate(this.#rotation);
            }
        }
        if (this.#scaleX !== 1 || this.#scaleY !== 1) {
            ctx.scale(this.#scaleX, this.#scaleY);
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

        this.draw(ctx);

        ctx.restore();
    }

    /**
     * 派生クラスで実装
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {}

    // スーパー簡易グローバルID
    static #globalCreatedCount = 0;
    #globalId = DrawNode.#globalCreatedCount++;
    get globalId() { return this.#globalId; }
}

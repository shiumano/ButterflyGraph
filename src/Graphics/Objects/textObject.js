import { DrawObject } from "../drawObject.js";
import { DrawNode } from "../drawNode.js";

/**
 * @import { GradientBuilder } from "../Gradients/gradient.js";
 * @import { DrawObjectOptions } from "@core/Graphics/drawObject.js"
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @typedef {DrawObjectOptions & {
 *   text?: string
 *   font?: string
 *   fill?: boolean
 *   strokeWidth?: number
 *   sizeReference?: "actual" | "font"
 * }} TextOptions
 * @typedef {DrawNodeOptions & {
 *   fillStyle: string | GradientBuilder
 *   strokeStyle: string | GradientBuilder
 *   text: string
 *   font: string
 *   fill: boolean
 *   strokeWidth: number
 *   textAscent: number
 * }} TextNodeOptions
 */

export class TextObject extends DrawObject {
    static #canvas = new OffscreenCanvas(1, 1);
    static #ctx = this.#canvas.getContext("2d");

    #fill;
    #strokeWidth;

    #text;
    #font;

    #sizeReference;

    #textHeight = 0;
    #textWidth = 0;

    #textAscent = 0;

    /**
     * 
     * @param {TextOptions} options 
     */
    constructor(options = {}) {
        super(options);
        if (TextObject.#ctx)
            TextObject.#ctx.textBaseline = "top";

        this.#fill = options.fill ?? true;
        this.#strokeWidth = Math.max(options.strokeWidth ?? 0, 0);

        this.#text = options.text ?? "";
        this.#font = options.font ?? "10px sans-serif";

        this.#sizeReference = options.sizeReference ?? "actual";

        this.#updateMetrics();
    }

    get timed() { return false; }
    set timed(_) { }

    get fill() { return this.#fill; }
    set fill(value) {
        if (this.#fill === value) return;

        this.#fill = value;
        this.requestRecreate("object");
    }

    get strokeWidth() { return this.#strokeWidth; }
    set strokeWidth(value) {
        const clampedValue = Math.max(value, 0);
        if (this.#strokeWidth === clampedValue) return;

        this.#strokeWidth = clampedValue;
        
        if (this.text.length !== 0) {
            super.width = this.#textWidth + this.strokeWidth;
            super.height = this.#textHeight + this.strokeWidth;
            this.requestRecreate("object");
        }
    }

    get width() { return super.width; }
    set width(_) {};

    get height() { return super.height; }
    set height(_) {};

    get font() { return this.#font; }
    set font(value) {
        if (this.#font === value) return;

        this.#font = value;
        this.#updateMetrics();
        this.requestRecreate("object");
    }

    get text() { return this.#text; }
    set text(value) {
        if (this.#text === value) return;

        this.#text = value;
        this.#updateMetrics();
        this.requestRecreate("object");
    }

    get sizeReference() { return this.#sizeReference; }
    set sizeReference(value) {
        if (this.#sizeReference === value) return;

        this.#sizeReference = value;
        this.#updateMetrics();
        this.requestRecreate("object");
    };

    #updateMetrics() {
        // WARN: いつフォントが読み込まれたかどうかはわからない
        // TODO: どうにか呼ばせる。必要なときだけ。新たなPERFコメは生み出したくない
        if (this.#text.length === 0) {
            // 0文字ならサイズは0！終了！
            this.#textWidth = 0;
            this.#textHeight = 0;

            super.width = 0;
            super.height = 0;
        } else {
            if (TextObject.#ctx == null) return;
            TextObject.#ctx.font = this.font;
            const metrics = TextObject.#ctx.measureText(this.text);
            this.#textWidth = metrics.width;
            if (this.sizeReference === "actual") {
                this.#textHeight = metrics.actualBoundingBoxDescent + metrics.actualBoundingBoxAscent;
                this.#textAscent = metrics.actualBoundingBoxAscent;
            }
            else {
                this.#textHeight = metrics.fontBoundingBoxDescent + metrics.fontBoundingBoxAscent;
                this.#textAscent = metrics.fontBoundingBoxAscent;
            }

            super.width = this.#textWidth + this.strokeWidth;
            super.height = this.#textHeight + this.strokeWidth;
        }
    }

    /**
     * 
     * @param {number} t 
     */
    calculateOptions(t) {
        const options = super.calculateOptions(t);
        return {
            ...options, 
            fillStyle: this.getStyle(this.fillStyle),
            strokeStyle: this.getStyle(this.strokeStyle),
            text: this.text,
            font: this.font,
            fill: this.fill,
            strokeWidth: this.strokeWidth,
            textAscent: this.#textAscent
        }
    }

    /**
     * 
     * @param {number} t 
     */
    createSnapshot(t) {
        const options = this.calculateOptions(t);
        const node = this.cachedNode?.with(options) ?? new TextNode(options);

        return { t: undefined, node: node };
    }

    get perfectlyOptimized() { return this.constructor === TextObject; }
}

class TextNode extends DrawNode {
    #text;
    #font;
    #fill;
    #strokeWidth;
    #offsetX;
    #offsetY;

    /**
     * @param {TextNodeOptions} options
     * @param {TextNode?} oldNode 
     */
    constructor(options, oldNode = null) {
        super(options);
        this.#text = options.text;
        this.#font = options.font;
        this.#fill = options.fill;
        this.#strokeWidth = options.strokeWidth;
        this.#offsetX = this.#strokeWidth / 2;
        this.#offsetY = this.#strokeWidth / 2 + options.textAscent;
    }

    /**
     * 
     * @param {Partial<TextNodeOptions>} options
     */
    with(options) {
        return new TextNode({...this.options, ...options}, this);
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        // PERF: 毎回設定するのは嫌だが、フレームワーク的ロックを行わない以上ctxの状態は信用できない
        ctx.textAlign = "start";
        ctx.textBaseline = "top";
        ctx.font = this.#font;
        ctx.direction = "ltr";

        // 縁取りの上から塗りつぶしが重なる
        // 描画順序を選択できるようにする？
        if (this.#strokeWidth > 0) {
            this._setStrokeStyle(ctx);
            ctx.lineWidth = this.#strokeWidth;
            ctx.lineJoin = "round";  // miterはやってらんない
            ctx.strokeText(this.#text, this.#offsetX, this.#offsetY);
        }

        if (this.#fill) {
            this._setFillStyle(ctx);
            ctx.fillText(this.#text, this.#offsetX, this.#offsetY);
        }
    }
}

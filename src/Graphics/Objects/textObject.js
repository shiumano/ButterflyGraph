import { DrawObject } from "../drawObject.js";
import { DrawNode } from "../drawNode.js";

/**
 * @import { DrawObjectOptions } from "@core/Graphics/drawObject.js"
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @typedef {DrawObjectOptions & {
 *   text?: string
 *   font?: string
 *   fill?: boolean
 *   strokeWidth?: number
 *   sizeReference?: "actual" | "font"
 *   autoSizeUpdate?: boolean
 * }} TextOptions
 * @typedef {DrawNodeOptions & {
 *   text: string
 *   font: string
 *   fill: boolean
 *   strokeWidth: number
 *   textAscent: number
 *   autoSizeUpdate: boolean
 * }} TextNodeOptions
 */

// https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-font-dev
const FONT_DEFAULT = "10px sans-serif";

/**
 * @extends {DrawObject<TextNode>}
 */
export class TextObject extends DrawObject {
    static #canvas = new OffscreenCanvas(1, 1);
    static #ctx = this.#canvas.getContext("2d");
    static #ctxFont = this.#ctx?.font;

    #fill;
    #strokeWidth;

    #text;
    #font;

    #sizeReference;
    #autoSizeUpdate;

    #textHeight = 0;
    #textWidth = 0;

    #textAscent = 0;

    /**
     * @param {TextOptions} options
     */
    constructor({
        text = "",
        font = FONT_DEFAULT,
        fill = true,
        strokeWidth = 0,
        sizeReference = "actual",
        autoSizeUpdate = true,
        ...options
    } = {}) {
        super(options);
        if (TextObject.#ctx) {
            TextObject.#ctx.textBaseline = "top";
        }

        this.#text = text;
        this.#font = font;

        this.#fill = fill;
        this.#strokeWidth = Math.max(strokeWidth, 0);


        this.#sizeReference = sizeReference;
        this.#autoSizeUpdate = autoSizeUpdate;

        this.#updateMetrics();
    }

    get timed() { return false; }
    set timed(_) { }

    get fill() { return this.#fill; }
    set fill(value) {
        if (this.#fill === value) return;

        this.#fill = value;
        this.requestRecreate(this, "object");
    }

    get strokeWidth() { return this.#strokeWidth; }
    set strokeWidth(value) {
        const clampedValue = Math.max(value, 0);
        if (this.#strokeWidth === clampedValue) return;

        this.#strokeWidth = clampedValue;

        if (this.text.length !== 0 && this.autoSizeUpdate) {
            super.width = this.#textWidth + this.strokeWidth;
            super.height = this.#textHeight + this.strokeWidth;
        }

        this.requestRecreate(this, "object");
    }

    get width() { return super.width; }
    set width(_) { };

    get height() { return super.height; }
    set height(_) { };

    get font() { return this.#font; }
    set font(value) {
        if (this.#font === value) return;

        this.#font = value;
        this.#updateMetrics();
        this.requestRecreate(this, "object");
    }

    get text() { return this.#text; }
    set text(value) {
        if (this.#text === value) return;

        this.#text = value;
        this.#updateMetrics();
        this.requestRecreate(this, "object");
    }

    get sizeReference() { return this.#sizeReference; }
    set sizeReference(value) {
        if (this.#sizeReference === value) return;

        this.#sizeReference = value;
        this.#updateMetrics();
        this.requestRecreate(this, "object");
    };

    /**
     * テキストのサイズを取得するか否か
     * FPS表示みたいな、頻繁に変わるけど配置が大体あってれば問題ないやつはfalseがオススメ
     *
     * trueの場合、通常通りwidthとheight、任意の座標のanchorを使用できる
     * falseの場合、widthとheightは0とされ、定義済みanchorのみ使用可能(そしてY軸がやや不正確)
     */
    get autoSizeUpdate() { return this.#autoSizeUpdate; }
    set autoSizeUpdate(value) {
        if (this.#autoSizeUpdate === value) return;

        this.#autoSizeUpdate = value;
        this.#updateMetrics();
        this.requestRecreate(this, "object");
    };

    get textAscent() { return this.#textAscent; }

    #updateMetrics() {
        // WARN: いつフォントが読み込まれたかどうかはわからない
        // TODO: どうにか呼ばせる。必要なときだけ。新たなPERFコメは生み出したくない
        if (TextObject.#ctx === null
            || this.#text.length === 0
            || !this.autoSizeUpdate
        ) {
            this.#textWidth = 0;
            this.#textHeight = 0;

            super.width = 0;
            super.height = 0;

            return;
        }

        if (this.font !== TextObject.#ctxFont) {
            TextObject.#ctx.font = this.font;
            TextObject.#ctxFont = this.font;
        }
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

    /**
     * @param {number} t
     * @returns {TextNodeOptions}
     */
    calculateOptions(t) {
        const baseOptions = super.calculateOptions(t);

        const options = Object.assign(baseOptions, {
            text: this.text,
            font: this.font,
            fill: this.fill,
            strokeWidth: this.strokeWidth,
            textAscent: this.#textAscent,
            autoSizeUpdate: this.#autoSizeUpdate
        });

        return options;
    }

    /**
     * @param {number} t
     */
    updateNode(t) {
        const cachedNode = this.cachedNode ?? new TextNode();

        cachedNode.read(this);
        return cachedNode;

    }

    isPerfectlyOptimized() { return this.constructor === TextObject; }
}

/**
 * @extends {DrawNode<TextNodeOptions>}
 */
class TextNode extends DrawNode {
    #text = "";
    #font = FONT_DEFAULT;
    #fill = true;
    #strokeWidth = 0;
    #offsetX = 0;
    #offsetY = 0;
    /** @type {CanvasTextAlign} */
    #align = "start";
    /** @type {CanvasTextBaseline} */
    #baseline = "top";

    /**
     * @returns {TextNodeOptions}
     */
    createDefaultOptions() {
        return Object.assign(super.createDefaultOptions(), {
            text: "",
            font: FONT_DEFAULT,
            fill: true,
            strokeWidth: 0,
            textAscent: 0,
            autoSizeUpdate: true
        });
    }

    /**
     * @param {Readonly<TextNodeOptions>} options
     */
    read(options) {
        const { text, font, fill, strokeWidth, textAscent, autoSizeUpdate } = options;
        this.#text = text;
        this.#font = font;
        this.#fill = fill;
        this.#strokeWidth = strokeWidth;

        if (autoSizeUpdate) {
            this.#align = "start";
            this.#baseline = "top";
            this.#offsetX = strokeWidth / 2;
            this.#offsetY = strokeWidth / 2 + textAscent;
        } else {
            // Canvas設定でまぁまぁ合わせてあげる "まぁまぁ"ね
            const { origin: {
                x: originX, y: originY
            } } = options;

            switch (originX) {
                case 0:
                    this.#align = "start";
                    this.#offsetX = strokeWidth / 2;
                    break;
                case 0.5:
                    this.#align = "center";
                    this.#offsetX = 0;
                    break;
                case 1:
                    this.#align = "end";
                    this.#offsetX = -strokeWidth / 2;
                    break;
                default:
                    this.#align = "center";  // 間を取って
                    this.#offsetX = 0;
            }

            switch (originY) {
                case 0:
                    this.#baseline = "top";
                    this.#offsetY = strokeWidth / 2;
                    break;
                case 0.5:
                    this.#baseline = "middle";
                    this.#offsetY = 0;
                    break;
                case 1:
                    this.#baseline = "bottom";
                    this.#offsetY = -strokeWidth / 2;
                    break;
                default:
                    this.#baseline = "middle";
                    this.#offsetY = 0;
            }
        }

        const tOpt = this.options;
        tOpt.text = text;
        tOpt.font = font;
        tOpt.fill = fill;
        tOpt.strokeWidth = strokeWidth;
        tOpt.textAscent = textAscent;
        tOpt.autoSizeUpdate = autoSizeUpdate;

        super.read(options);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        ctx.textAlign = this.#align;
        ctx.textBaseline = this.#baseline;
        ctx.font = this.#font;
        ctx.direction = "ltr";

        // 縁取りの上から塗りつぶしが重なる
        // 描画順序を選択できるようにする？
        if (this.#strokeWidth > 0) {
            ctx.lineWidth = this.#strokeWidth;
            ctx.lineJoin = "round";  // miterはやってらんない
            ctx.strokeText(this.#text, this.#offsetX, this.#offsetY);
        }

        if (this.#fill) {
            ctx.fillText(this.#text, this.#offsetX, this.#offsetY);
        }
    }
}

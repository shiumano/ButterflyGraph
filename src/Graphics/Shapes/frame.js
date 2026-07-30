import { DrawObject } from "../drawObject.js";
import { DrawNode } from "../drawNode.js";
import { classOf } from "../../Utils/metaPrg.js";

/**
 * @import { DrawObjectOptions } from "@core/Graphics/drawObject.js"
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @typedef {DrawObjectOptions & {
 *   lineWidth?: number
 * }} FrameOptions
 * @typedef {DrawNodeOptions & {
 *    lineWidth: number
 * }} FrameNodeOptions
 */

/**
 * @extends {DrawObject<FrameNode>}
 */
export class Frame extends DrawObject {
    #lineWidth;

    /**
     * @param {FrameOptions} options
     */
    constructor({
        lineWidth = 0,
        ...options
    } = {}) {
        super(options);
        super.timed = false;

        if (options.color !== undefined) {
            this.strokeStyle = options.color;
        }

        this.#lineWidth = lineWidth;
    }

    get timed() { return false; }
    set timed(_) { }

    get lineWidth() { return this.#lineWidth; }
    set lineWidth(value) {
        if (value === this.#lineWidth) return;

        this.#lineWidth = value;
        this.requestRecreate(this, "object");
    }

    get color() { return this.strokeStyle; }
    set color(value) { this.strokeStyle = value; }

    /**
     * @param {number} t
     * @returns {FrameNodeOptions}
     */
    calculateOptions(t) {
        const baseOptions = super.calculateOptions(t);

        const options = Object.assign(baseOptions, {
            lineWidth: this.#lineWidth
        });

        return options;
    }

    /**
     * @param {number} t
     */
    updateNode(t) {
        const node = this.cachedNode ?? new FrameNode();

        node.read(this);
        return node;
    }

    toOptions() {
        /** @type {FrameOptions} */
        const options = super.toOptions();
        delete options.fillStyle;
        delete options.timed;
        if (this.#lineWidth !== 0) options.lineWidth = this.#lineWidth;

        return options;
    }

    isPerfectlyOptimized() { return classOf(this) === Frame; }
}

/**
 * @extends {DrawNode<FrameNodeOptions>}
 */
export class FrameNode extends DrawNode {
    #lineRectWidth = 0;
    #lineRectHeight = 0;
    #lineWidth = 0;
    #offset = 0;

    /**
     * @returns {FrameNodeOptions}
     */
    createDefaultOptions() {
        return Object.assign(super.createDefaultOptions(), {
            lineWidth: 0,
        });
    }

    /**
     * @param {Readonly<FrameNodeOptions>} options
     */
    read(options) {
        let lineWidth = options.lineWidth;
        let lineRectWidth = options.width - lineWidth;
        let lineRectHeight = options.height - lineWidth;

        // rectの幅or高さが0だと、miterが0の辺を消すので欲しいサイズにならない 0にはしないようにする
        if (lineRectWidth <= 0 || lineRectHeight <= 0) {
            lineWidth = Math.min(options.width, options.height) / 2 + 0.5;  // 若干重ねる どうせctx.lineWidthは0だと0.5として扱われるので
            lineRectWidth = options.width - lineWidth;
            lineRectHeight = options.height - lineWidth;
        }

        this.#lineRectWidth = lineRectWidth;
        this.#lineRectHeight = lineRectHeight;
        this.#lineWidth = lineWidth;
        this.#offset = lineWidth / 2;

        this.options.lineWidth = options.lineWidth;

        super.read(options);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        ctx.lineWidth = this.#lineWidth;
        ctx.lineJoin = "miter";
        ctx.strokeRect(this.#offset, this.#offset, this.#lineRectWidth, this.#lineRectHeight);
    }
}

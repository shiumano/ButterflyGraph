import { DrawObject } from "../drawObject.js";
import { DrawNode } from "../drawNode.js";

/**
 * @import { DrawObjectOptions } from "@core/Graphics/drawObject.js"
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @typedef {DrawObjectOptions & {
 *   lineWidth?: number
 * }} FrameOptions
 * @typedef {DrawNodeOptions & {
 *    lineWidth: number
 *    lineRectWidth: number
 *    lineRectHeight: number
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
    constructor(options = {}) {
        super(options);

        this.#lineWidth = options.lineWidth ?? 0;
    }

    get timed() { return false; }
    set timed(_) { }

    get lineWidth() { return this.#lineWidth; }
    set lineWidth(value) {
        if (value === this.#lineWidth) return;

        this.#lineWidth = value;
        this.requestRecreate("object");
    }

    get color() { return this.strokeStyle; }
    set color(value) { this.strokeStyle = value; }

    /**
     * @param {number} t
     * @returns {FrameNodeOptions}
     */
    calculateOptions(t) {
        const options = super.calculateOptions(t);

        let lineWidth = this.lineWidth;
        let lineRectWidth = this.width - lineWidth;
        let lineRectHeight = this.height - lineWidth;

        // rectの幅or高さが0だと、miterが0の辺を消すので欲しいサイズにならない 0にはしないようにする
        if (lineRectWidth <= 0 || lineRectHeight <= 0) {
            lineWidth = Math.min(this.width, this.height) / 2 + 0.5;  // 若干重ねる どうせctx.lineWidthは0だと0.5として扱われるので
            lineRectWidth = this.width - lineWidth;
            lineRectHeight = this.height - lineWidth;
        }

        return {
            ...options,
            lineRectWidth: lineRectWidth,
            lineRectHeight: lineRectHeight,
            lineWidth: lineWidth
        };
    }

    /**
     * @param {number} t
     */
    createSnapshot(t) {
        const options = this.calculateOptions(t);
        return this.cachedNode?.with(options) ?? new FrameNode(options);
    }

    get perfectlyOptimized() { return this.constructor === Frame; }
}

/**
 * @extends {DrawNode<FrameNodeOptions>}
 */
export class FrameNode extends DrawNode {
    #lineRectWidth;
    #lineRectHeight;
    #lineWidth;
    #offset;
    /**
     * @param {FrameNodeOptions} options
     * @param {FrameNode?} oldNode
     */
    constructor(options, oldNode = null) {
        super(options, oldNode);

        this.#lineRectWidth = options.lineRectWidth;
        this.#lineRectHeight = options.lineRectHeight;
        this.#lineWidth = options.lineWidth;
        this.#offset = options.lineWidth / 2;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        this._setStrokeStyle(ctx);
        ctx.lineWidth = this.#lineWidth;
        ctx.lineJoin = "miter";
        ctx.strokeRect(this.#offset, this.#offset, this.#lineRectWidth, this.#lineRectHeight);
    }
}

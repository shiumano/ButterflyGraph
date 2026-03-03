import { DrawObject } from "../drawObject.js";
import { DrawNode } from "../drawNode.js";

/**
 * @import { DrawObjectOptions } from "@core/Graphics/drawObject.js"
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @typedef {DrawObjectOptions & {
 *   lineWidth?: number
 * }} FrameOptions
 * @typedef {Omit<DrawNodeOptions, "strokeStyle"> & {
 *    strokeStyle: Exclude<DrawNodeOptions["strokeStyle"], undefined>
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
        return {
            ...options,
            strokeStyle: this.getStyle(this.strokeStyle),
            lineRectWidth: this.width - this.lineWidth,
            lineRectHeight: this.height - this.lineWidth,
            lineWidth: this.lineWidth
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
    /** @type {Path2D} */
    #path;
    #lineWidth;
    /**
     * @param {FrameNodeOptions} options
     * @param {FrameNode?} oldNode
     */
    constructor(options, oldNode = null) {
        super(options, oldNode);

        this.#lineWidth = options.lineWidth;

        if (
            oldNode instanceof FrameNode &&
            oldNode.options.lineWidth === options.lineWidth &&
            oldNode.options.lineRectWidth === options.lineRectWidth &&
            oldNode.options.lineRectHeight === options.lineRectHeight
        ) {
            this.#path = oldNode.#path;
        } else {
            const path = new Path2D();
            const offset = options.lineWidth / 2;
            const w = options.lineRectWidth;
            const h = options.lineRectHeight;

            path.rect(offset, offset, w, h);

            this.#path = path;
        }
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        this._setStrokeStyle(ctx);
        ctx.lineWidth = this.#lineWidth;
        ctx.stroke(this.#path);
    }
}

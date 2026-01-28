import { DrawObject } from "../drawObject.js";
import { DrawNode } from "../drawNode.js";

/**
 * @import { DrawObjectOptions } from "@core/Graphics/drawObject.js"
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @typedef {DrawObjectOptions & {
 * }} RectangleOptions
 * @typedef {Omit<DrawNodeOptions, "fillStyle"> & {
 *    fillStyle: Exclude<DrawNodeOptions["fillStyle"], undefined>
 * }} RectangleNodeOptions
 */

/**
 * @extends {DrawObject<RectangleNode>}
 */
export class Rectangle extends DrawObject {
    /**
     * @param {RectangleOptions} options
     */
    constructor(options = {}) {
        super(options);
    }

    get timed() { return false; }
    set timed(_) { }

    /**
     * @param {number} t
     * @returns {RectangleNodeOptions}
     */
    calculateOptions(t) {
        const options = super.calculateOptions(t);
        return {
            ...options,
            fillStyle: this.getStyle(this.fillStyle),
        };
    }

    /**
     * @param {number} t
     */
    createSnapshot(t) {
        const options = this.calculateOptions(t);
        return this.cachedNode?.with(options) ?? new RectangleNode(options);
    }

    get perfectlyOptimized() { return this.constructor === Rectangle; }
}

/**
 * @extends {DrawNode<RectangleNodeOptions>}
 */
export class RectangleNode extends DrawNode {
    /**
     * @param {RectangleNodeOptions} options
     * @param {RectangleNode?} oldNode
     */
    constructor(options, oldNode = null) {
        super(options, oldNode);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        this._setFillStyle(ctx);
        ctx.fillRect(0, 0, this.width, this.height);
    }
}

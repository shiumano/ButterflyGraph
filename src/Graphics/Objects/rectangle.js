import { DrawObject } from "../drawObject.js";
import { DrawNode } from "../drawNode.js";

/**
 * @import { DrawObjectOptions } from "@core/Graphics/drawObject.js"
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @import { GradientBuilder } from "../Gradients/gradient.js";
 * @typedef {DrawObjectOptions & {
 * }} RectangleOptions
 * @typedef {DrawNodeOptions & {
 *    fillStyle: string | GradientBuilder
 * }} RectangleNodeOptions
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
     * 
     * @param {number} t 
     */
    calculateOptions(t) {
        const options = super.calculateOptions(t);
        return {
            ...options, 
            fillStyle: this.getColor(),
        };
    }

    /**
     * 
     * @param {number} t
     */
    createSnapshot(t) {
        const options = this.calculateOptions(t);
        const node = this.cachedNode?.with(options) ?? new RectangleNode(options);

        return { t: undefined, node: node };
    }

    get perfectlyOptimized() { return this.constructor === Rectangle; }
}

export class RectangleNode extends DrawNode {
    /**
     * @param {RectangleNodeOptions} options
     * @param {RectangleNode?} oldNode 
     */
    constructor(options, oldNode = null) {
        super(options, oldNode);
    }

    /**
     * @param {Partial<RectangleNodeOptions>} options
     */
    with(options) {
        return new RectangleNode({...this.options, ...options}, this);
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        this._setFillStyle(ctx);
        ctx.fillRect(0, 0, this.width, this.height);
    }
}

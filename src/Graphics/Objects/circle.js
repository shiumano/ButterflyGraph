import { DrawObject } from "../drawObject.js";
import { DrawNode } from "../drawNode.js";

/**
 * @import { DrawObjectOptions } from "@core/Graphics/drawObject.js"
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @import { GradientBuilder } from "../Gradients/gradient.js";
 * @typedef {DrawObjectOptions & {
 *   radius?: number
 * }} CircleOptions
 * @typedef {DrawNodeOptions & {
 *   fillStyle: string | GradientBuilder
 *   radius: number
 * }} CircleNodeOptions
 */

export class Circle extends DrawObject {
    #radius;

    /**
     * 
     * @param {CircleOptions} options 
     */
    constructor(options = {}) {
        super(options);

        const radius = options.radius ?? 0;
        this.#radius = radius;
        super.width = radius * 2;
        super.height = radius * 2;
    }

    get timed() { return false; }
    set timed(_) { }

    get radius() { return this.#radius; }
    set radius(value) { 
        if (this.#radius === value) return;

        this.#radius = value;
        super.width = value * 2;
        super.height = value * 2;
        this.requestRecreate("object");
    }

    // ゲロ甘ったるい糖衣構文
    set width(value) { this.radius = value / 2; }
    get width() { return super.width; }

    set height(value) { this.radius = value / 2; }
    get height() { return super.height; }

    /**
     * 
     * @param {number} t 
     */
    calculateOptions(t) {
        const options = super.calculateOptions(t);
        return {
            ...options,
            fillStyle: this.getStyle(this.fillStyle),
            radius: this.radius
        };
    }

    /**
     * 
     * @param {number} t
     */
    createSnapshot(t) {
        const options = this.calculateOptions(t);
        const node = this.cachedNode?.with(options) ?? new CircleNode(options);

        return { t: undefined, node: node };
    }

    get perfectlyOptimized() { return this.constructor === Circle; }
}

class CircleNode extends DrawNode {
    /** @type {Path2D} */
    #path;

    /**
     * @param {CircleNodeOptions} options
     * @param {CircleNode?} oldNode 
     */
    constructor(options, oldNode = null) {
        super(options);

        if (oldNode instanceof CircleNode
            && oldNode.options.radius === options.radius
        ) {
            this.#path = oldNode.#path
        } else {
            const radius = options.radius;
            const path = new Path2D();
            path.arc(radius, radius, radius, 0, Math.PI * 2);
            this.#path = path;
        }
    }

    /**
     * 
     * @param {Partial<CircleNodeOptions>} options
     */
    with(options) {
        return new CircleNode({...this.options, ...options}, this);
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        this._setFillStyle(ctx);
        ctx.fill(this.#path);
    }
}

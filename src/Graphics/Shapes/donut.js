
import { DrawObject } from "../drawObject.js";
import { DrawNode } from "../drawNode.js";

/**
 * @import { DrawObjectOptions } from "@core/Graphics/drawObject.js"
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @typedef {DrawObjectOptions & {
 *   radius?: number
 *   lineWidth?: number
 * }} DonutOptions
 * @typedef {DrawNodeOptions & {
 *   lineRadius: number
 *   lineWidth: number
 * }} DonutNodeOptions
 */

/**
 * @extends {DrawObject<DonutNode>}
 */
export class Donut extends DrawObject {
    #radius;
    #lineWidth;

    /**
     * @param {DonutOptions} options
     */
    constructor(options = {}) {
        super(options);
        if (options.color !== undefined) {
            this.color = options.color;
        }
        const radius = options.radius ?? 0;
        const lineWidth = options.lineWidth ?? 0;
        this.#radius = radius;
        this.#lineWidth = lineWidth;
        super.width = radius * 2;
        super.height = radius * 2;
    }

    get radius() { return this.#radius; }
    set radius(value) {
        if (value === this.#radius) return;

        this.#radius = value;
        super.width = value * 2;
        super.height = value * 2;
        this.requestRecreate(this, "object");
    }

    get lineWidth() { return this.#lineWidth; }
    set lineWidth(value) {
        if (value === this.#lineWidth) return;

        this.#lineWidth = value;
        this.requestRecreate(this, "object");
    }

    get width() { return super.width; }
    set width(value) { this.radius = value / 2; }

    get height() { return super.height; }
    set height(value) { this.radius = value / 2; }

    get color() { return this.strokeStyle; }
    set color(value) { this.strokeStyle = value; }

    /**
     * @param {number} t
     * @returns {DonutNodeOptions}
     */
    calculateOptions(t) {
        const options = super.calculateOptions(t);

        let lineWidth = this.lineWidth;
        let lineRadius = this.radius - (lineWidth / 2);

        if (lineRadius <= lineWidth / 2) {
            lineWidth = this.radius + 0.5;
            lineRadius = this.radius - (lineWidth / 2);
        }

        return {
            ...options,
            lineRadius: lineRadius,
            lineWidth: lineWidth,
        };
    }

    /**
     * @param {number} t
     */
    createSnapshot(t) {
        const options = this.calculateOptions(t);
        return new DonutNode(options, this.cachedNode);
    }

    isPerfectlyOptimized() { return this.constructor === Donut; }
}

/**
 * @extends {DrawNode<DonutNodeOptions>}
 */
class DonutNode extends DrawNode {
    /** @type {Path2D} */
    #path;
    #lineWidth;

    /**
     * @param {DonutNodeOptions} options
     * @param {DonutNode?} oldNode
     */
    constructor(options, oldNode = null) {
        super(options, oldNode);

        this.#lineWidth = options.lineWidth;
        if (
            oldNode instanceof DonutNode &&
            oldNode.options.lineRadius === options.lineRadius &&
            oldNode.options.lineWidth === options.lineWidth
        ) {
            this.#path = oldNode.#path;
        } else {
            const radius = Math.max(0, options.lineRadius);
            const center = radius + options.lineWidth / 2;
            const path = new Path2D();
            path.arc(center, center, radius, 0, Math.PI * 2);
            this.#path = path;
        }
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        ctx.lineWidth = this.#lineWidth;
        ctx.stroke(this.#path);
    }
}

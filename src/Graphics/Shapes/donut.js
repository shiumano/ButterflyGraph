
import { DrawObject } from "../drawObject.js";
import { DrawNode } from "../drawNode.js";
import { classOf } from "../../Utils/metaPrg.js";
import { nullPath } from "../../Utils/statics.js";

/**
 * @import { DrawObjectOptions } from "@core/Graphics/drawObject.js"
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @typedef {DrawObjectOptions & {
 *   radius?: number
 *   lineWidth?: number
 * }} DonutOptions
 * @typedef {DrawNodeOptions & {
 *   radius: number
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
    constructor({
        radius = 0, lineWidth = 0,
        ...options
    } = {}) {
        super(options);
        if (options.color !== undefined) {
            this.color = options.color;
        }

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
        const baseOptions = super.calculateOptions(t);

        const options = Object.assign(baseOptions, {
            radius: this.radius,
            lineWidth: this.lineWidth
        });

        return options;
    }

    /**
     * @param {number} t
     */
    updateNode(t) {
        const node = this.cachedNode ?? new DonutNode();
        node.read(this);

        return node;
    }

    isPerfectlyOptimized() { return classOf(this) === Donut; }
}

/**
 * @extends {DrawNode<DonutNodeOptions>}
 */
class DonutNode extends DrawNode {
    #path = nullPath;
    #lineWidth = 0;
    #lineRadius = 0;

    /**
     * @returns {DonutNodeOptions}
     */
    createDefaultOptions() {
        return Object.assign(super.createDefaultOptions(), {
            radius: 0,
            lineWidth: 0
        });
    }

    /**
     * @param {Readonly<DonutNodeOptions>} options
     */
    read(options) {
        let lineWidth = options.lineWidth;
        let lineRadius = options.radius - (lineWidth / 2);

        if (lineRadius <= lineWidth / 2) {
            lineWidth = options.radius + 0.5;
            lineRadius = options.radius - (lineWidth / 2);
        }

        if (this.#lineRadius !== lineRadius ||
            this.#lineWidth !== lineWidth
        ) {
            const radius = Math.max(0, lineRadius);
            const center = radius + lineWidth / 2;
            const path = new Path2D();
            path.arc(center, center, radius, 0, Math.PI * 2);
            this.#path = path;
        }

        this.#lineWidth = lineWidth;
        this.#lineRadius = lineRadius;

        const tOpt = this.options;
        tOpt.radius = options.radius;
        tOpt.lineWidth = options.lineWidth;

        super.read(options);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        ctx.lineWidth = this.#lineWidth;
        ctx.stroke(this.#path);
    }
}

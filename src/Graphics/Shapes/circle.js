import { DrawObject } from "../drawObject.js";
import { DrawNode } from "../drawNode.js";

/**
 * @import { DrawObjectOptions } from "@core/Graphics/drawObject.js"
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @typedef {DrawObjectOptions & {
 *   radius?: number
 * }} CircleOptions
 * @typedef {DrawNodeOptions & {
 *   radius: number
 * }} CircleNodeOptions
 */

/**
 * @extends {DrawObject<CircleNode>}
 */
export class Circle extends DrawObject {
    #radius;

    /**
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
        this.requestRecreate(this, "object");
    }

    // ゲロ甘ったるい糖衣構文
    set width(value) { this.radius = value / 2; }
    get width() { return super.width; }

    set height(value) { this.radius = value / 2; }
    get height() { return super.height; }

    /**
     * @param {number} t
     * @returns {CircleNodeOptions}
     */
    calculateOptions(t) {
        const baseOptions = super.calculateOptions(t);

        const options = Object.assign(baseOptions, {
            radius: this.radius
        });

        return options;
    }

    /**
     * @param {number} t
     */
    updateNode(t) {
        const node = this.cachedNode ?? new CircleNode();

        node.read(this);
        return node;
    }

    isPerfectlyOptimized() { return this.constructor === Circle; }
}

/**
 * @extends {DrawNode<CircleNodeOptions>}
 */
class CircleNode extends DrawNode {
    // WARN: ゴミ もうちょっとまとめるとかしなさい
    static #nullPath = new Path2D();
    /** @type {Path2D} */
    #path = CircleNode.#nullPath;

    /** @type {Map<number, Path2D>} */
    static #pathRegistory = new Map();

    /**
     * @returns {CircleNodeOptions}
     */
    createDefaultOptions() {
        return Object.assign(super.createDefaultOptions(), {
            radius: 0,
        });
    }

    /**
     * @param {CircleNodeOptions} options
     */
    read(options) {
        if (this.options.radius !== options.radius) {
            const radius = options.radius;

            const cachedPath = CircleNode.#pathRegistory.get(radius);
            if (cachedPath !== undefined) {
                this.#path = cachedPath;
            } else {
                const path = new Path2D();
                path.arc(radius, radius, radius, 0, Math.PI * 2);

                if (radius % 1 === 0) {
                    // PERF: 整数の半径の円は、Path2Dのキャッシュに登録する
                    //     : 塵ほどではあるが同じPath2Dを可能な限り使いまわしたほうが描画効率が良くなる
                    //     : 500個のCircleがあれば全体で1%くらいの差が出た
                    // WARN: さぁ、いつ捨てようか……あんまり恐ろしい量にはならないと思うが
                    CircleNode.#pathRegistory.set(radius, path);
                }

                this.#path = path;
            }
        }

        this.options.radius = options.radius;

        super.read(options);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        ctx.fill(this.#path);
    }
}

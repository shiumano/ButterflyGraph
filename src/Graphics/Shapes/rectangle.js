import { DrawObject } from "../drawObject.js";
import { DrawNode } from "../drawNode.js";

/**
 * @import { DrawObjectOptions } from "@core/Graphics/drawObject.js"
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @typedef {DrawObjectOptions & {
 * }} RectangleOptions
 * @typedef {DrawNodeOptions & {
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
        const baseOptions = super.calculateOptions(t);

        // // 本来は内容を更新していくのでこうなる
        // // ただし、Rectangleは何もプロパティを追加しないので…
        //
        // const options = Object.assign(baseOptions, {
        // });
        //
        // // こうなっちゃってもう無駄以外の何物でもない
        const options = baseOptions;

        return options;
    }

    /**
     * @param {number} t
     */
    createSnapshot(t) {
        const options = this.calculateOptions(t);

        const cachedNode = this.cachedNode;
        if (cachedNode !== null) {
            cachedNode.read(options);
            return cachedNode;
        }

        return new RectangleNode(options, this.cachedNode);
    }

    isPerfectlyOptimized() { return this.constructor === Rectangle; }
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
        // PERF: ctx.fillRectはfill(path)とは違って専用パスっぽい ただの四角形だもんね
        //     : わざわざPath2Dを作るより圧倒的に高速
        ctx.fillRect(0, 0, this.width, this.height);
    }
}

import { DrawObject } from "../drawObject.js";
import { DrawNode } from "../drawNode.js";
import { classOf } from "../../Utils/metaPrg.js";

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
     */
    updateNode(t) {
        const node = this.cachedNode ?? new RectangleNode();
        node.read(this);

        return node;
    }

    isPerfectlyOptimized() { return classOf(this) === Rectangle; }
}

/**
 * @extends {DrawNode<RectangleNodeOptions>}
 */
export class RectangleNode extends DrawNode {
    /**
     * @returns {RectangleNodeOptions}
     */
    createDefaultOptions() {
        return super.createDefaultOptions();
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

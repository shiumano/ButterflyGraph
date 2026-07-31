import { Renderer } from "./renderer.js";

/**
 * @import { DrawNode } from "@core/Graphics/drawNode.js";
 */

// ctxを奪うタイプの初期化処理がある
// まるでフレームワークみたい！なくても良いんだけどね
export class HTMLCanvasRenderer extends Renderer {
    #canvas;

    /**
     * @param {HTMLCanvasElement} element
     */
    constructor(element) {
        const ctx = element.getContext("2d");
        if (!ctx) throw new Error("Cannot get rendering context.");

        super(ctx, element.width, element.height);

        this.#canvas = element;
    }

    /**
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        super.resize(width, height);

        // Renderer.resizeにより0以上にクランプ済み
        const newWidth = this.width;
        const newHeight = this.height;

        // Canvasに反映
        this.#canvas.width = newWidth;
        this.#canvas.height = newHeight;
    }

    /**
     * @param {DrawNode} drawRoot
     */
    render(drawRoot) {
        super.render(drawRoot);
    }
}

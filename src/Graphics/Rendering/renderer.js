/**
 * @import { DrawNode, DrawNodeOptions } from "@core/Graphics/drawNode.js"
 */

export class Renderer {
    #width;
    #height;

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width
     * @param {number} height
     */
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.#width = width;
        this.#height = height;
    }

    get width() { return this.#width; }
    set width(value) { this.resize(value, this.height); }

    get height() { return this.#height; }
    set height(value) { this.resize(this.width, value); }

    /**
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        const clampedWidth = Math.max(width, 1);
        const clampedHeight = Math.max(height, 1);

        // Renderer にも反映
        this.#width = clampedWidth;
        this.#height = clampedHeight;
    }

    /**
     * @param {DrawNode<DrawNodeOptions>} drawRoot
     */
    render(drawRoot) {
        this.ctx.reset();
        drawRoot.render(this.ctx);
        // 以上！終わり！お疲れ様！
        // PERF: 理論上dirty rect再描画は可能、おそらくRendererの責務になるだろう
        // TODO: でも脳が死ぬから今はやーらない
    }
}

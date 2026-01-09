/**
 * @import { DrawNode } from "@core/Graphics/drawNode.js"
 */

export class Renderer {
    /**
     * 
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width
     * @param {number} height 
     */
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
    }

    /**
     * 
     * @param {DrawNode} drawRoot 
     */
    render(drawRoot) {
        this.ctx.reset();
        drawRoot.render(this.ctx);
        // 以上！終わり！お疲れ様！
        // PERF: 理論上dirty rect再描画は可能、おそらくRendererの責務になるだろう
        // TODO: でも脳が死ぬから今はやーらない
    }
}
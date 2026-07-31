/**
 * @import { DrawNode } from "@core/Graphics/drawNode.js"
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
     * @param {DrawNode} drawRoot
     */
    render(drawRoot) {
        const ctx = this.ctx;
        // MDN Web Docs - https://developer.mozilla.org/ja/docs/Web/API/CanvasRenderingContext2D/reset
        ctx.reset();

        ctx.clearRect(this.#width - 1, this.#height - 1, 1, 1);
        // Q: は？
        // A: ctx.reset()を呼び出したら内容もクリアされるはずだが、WebKitでは内容がクリアされず残像が残る
        //  : おそらくctxのピクセルデータは消えているがディスプレイの更新を忘れている
        //  : 普通フレームのリセットはclearRectだからresetでフレームが消えない問題に気付いてないんだろうな
        //  : (0, 0)から触れたピクセルの場所までinvalidateされるので、こうすると残像が消える

        // PERF: ctx.resetの半分ちょいくらいctx.clearRectもコストがかかる ゴミ

        drawRoot.render(ctx);
    }
}

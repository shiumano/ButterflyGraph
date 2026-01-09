import { Renderer } from "./renderer.js";

/**
 * @import { DrawNode } from "@core/Graphics/drawNode.js";
 */

// ctxを奪うタイプの初期化処理がある
// まるでフレームワークみたい！なくても良いんだけどね
export class HTMLCanvasRenderer extends Renderer {
    #canvas;

    // デバッグ処理で使用
    #outCtx;
    #offCanvas;
    #optionApplied = false;

    /**
     * 
     * @param {HTMLCanvasElement} element 
     * @param {boolean} debug 
     */
    constructor(element, debug=false) {
        if (debug) {
            const outCtx = element.getContext("2d");
            if (!outCtx) throw new Error("Cannot get output context.");

            // PERF: OffscreenCanvasは操作にかかった時間がプロファイラに出る！
            // PERF: その代償として、死ぬほど低速なdrawImageの呼び出しをする必要がある デバッグ以外で使うな
            const offCanvas = new OffscreenCanvas(element.width, element.height);
            // WARN: JSDoc型キャスト
            // しょうがない: キャストが必要ということは互換性がないということ CanvasとOffscreenCanvasで差が出たらがんばってそっちの方を直してくれ
            const ctx = /** @type {CanvasRenderingContext2D | null} */ (/** @type {any} */ offCanvas.getContext("2d"));
            if (!ctx) throw new Error("Cannot get rendering context.");

            super(ctx, element.clientWidth, element.clientHeight);

            this.#outCtx = outCtx;
            this.#offCanvas = offCanvas;
        } else {
            const ctx = element.getContext("2d");
            if (!ctx) throw new Error("Cannot get rendering context.");

            super(ctx, element.clientWidth, element.clientHeight);
        }

        this.#canvas = element;
    }

    /**
     * 
     * @param {number} width 
     * @param {number} height 
     */
    resize(width, height) {
        const clampedWidth = Math.max(width, 1);
        const clampedHeight = Math.max(height, 1);

        this.#canvas.width = clampedWidth;
        this.#canvas.height = clampedHeight;
        if (this.#offCanvas !== undefined) {
            this.#offCanvas.width = clampedWidth;
            this.#offCanvas.height = clampedHeight;
            this.#optionApplied = false;
        }

        // Renderer にも反映
        this.width = clampedWidth;
        this.height = clampedHeight;
    }

    #setOption() {
        if (
            !(this.#outCtx instanceof CanvasRenderingContext2D) ||
            !(this.#offCanvas instanceof OffscreenCanvas)
        ) return;
        if (!this.#optionApplied) {
            this.#outCtx.imageSmoothingEnabled = false;
            this.#outCtx.globalCompositeOperation = "copy";
            this.#optionApplied = true;
        }
    }

    /**
     * 
     * @param {DrawNode} drawRoot 
     */
    render(drawRoot) {
        super.render(drawRoot);

        // チョー適当な分岐
        if (
            this.#outCtx instanceof CanvasRenderingContext2D &&
            this.#offCanvas !== undefined
        ) {
            this.#setOption();
            this.#outCtx.drawImage(this.#offCanvas, 0, 0);
        }
    }
}


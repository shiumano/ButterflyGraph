/**
 * @typedef {{ position: number, color: string }} ColorStop
 */

/**
 * グラデーションを表すオブジェクト
 */
export class Gradient {
    /** @type {ColorStop[]} */
    #colorStops = [];
    /** @type {GradientBuilder?} */
    #builderCache = null;
    #gradientChanged = true;

    /**
     * @param {ColorStop[]} stops 
     */
    constructor(stops = []) {
        this.#colorStops = stops;
    }

    /**
     * @param {number} position 0〜1
     * @param {string} color CSS color
     */
    addColorStop(position, color) {
        this.#colorStops.push({ position, color });
        this.requestRecreate();
    }

    getColorStops() {
        return Object.freeze(this.#colorStops);
    }

    clearColorStops() {
        this.#colorStops = [];
        this.requestRecreate();
    }

    requestRecreate() {
        this.#gradientChanged = true;
    }

    createGradientBuilder() {
        return new GradientBuilder(this.getColorStops());
    }

    getGradientBuilder() {
        let builder = this.#builderCache;

        if (this.#gradientChanged || builder === null) {
            builder = this.createGradientBuilder();
            this.#builderCache = builder;
            this.#gradientChanged = false;
        }

        return builder;
    }
}

/**
 * ctxからCanvasGradientを作成する
 */
export class GradientBuilder {
    /** @type {readonly ColorStop[]} */
    #colorStops = [];
    #updateCache = true;
    /** @type {Map<number, CanvasGradient | string>} */
    #cache = new Map();

    /**
     * @param {readonly ColorStop[]} stops 
     */
    constructor(stops) {
        this.#colorStops = stops;
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    getGradient(ctx) {
        const id = getContextId(ctx);

        // 同じctxの場合：作り直すのは無駄なので再利用
        // 違うctxの場合：使い回せないので再作成
        let gradient = this.#cache.get(id);

        if (this.#updateCache || !gradient) {
            // --- Gradient を作る ---
            gradient = this.createGradient(ctx);
            this.#applyStops(gradient);

            // キャッシュに保存
            this.#cache.set(id, gradient);

            this.#updateCache = false;
        }

        return gradient;
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx
     * @returns {CanvasGradient}
     */
    createGradient(ctx) {
        throw new Error("Not implemented");
    }

    /**
     * @param {CanvasGradient} grad
     */
    #applyStops(grad) {
        for (let i = 0; i < this.#colorStops.length; i++) {
            const cs = this.#colorStops[i];
            grad.addColorStop(cs.position, cs.color);
        }
    }
}

/** @type {WeakMap<CanvasRenderingContext2D, number>} */
const ctxIdMap = new WeakMap();
let ctxIdCounter = 0;

/**
 * 
 * @param {CanvasRenderingContext2D} ctx 
 */
function getContextId(ctx) {
    let ctxId = ctxIdMap.get(ctx);
    if (ctxId === undefined) {
        ctxId = ctxIdCounter++;
        ctxIdMap.set(ctx, ctxId);
    }

    return ctxId;
}


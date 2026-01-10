/**
 * @typedef {{ position: number, color: string }} ColorStop
 * @typedef {"stops" | "criteria"} GradientRecreateReason
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
    #stopsChanged = true;

    /** @type {Readonly<Readonly<ColorStop[]>>?} */
    #frozenStops = null;

    /**
     * @param {ColorStop[]} stops
     */
    constructor(stops = []) {
        this.#colorStops = [...stops];  // 受け取った時点でそれは別のオブジェクトであるべき
    }

    /**
     * @param {number} position 0〜1
     * @param {string} color CSS color
     */
    addColorStop(position, color) {
        this.#colorStops.push({ position, color });
        this.requestRecreate("stops");
    }

    getColorStops() {
        let stops = this.#frozenStops;

        if (this.#stopsChanged || stops === null) {
            stops = Object.freeze(this.#colorStops.map(stop => Object.freeze({ ...stop })));
            this.#frozenStops = this.#frozenStops;
            this.#stopsChanged = false;
        }

        return stops;
    }

    clearColorStops() {
        this.#colorStops = [];
        this.requestRecreate("stops");
    }

    /**
     * @param {GradientRecreateReason} reason
     */
    requestRecreate(reason) {
        this.#gradientChanged = true;

        if (reason === "stops")
            this.#stopsChanged = true;
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
    /** @type {WeakMap<RenderingContext, CanvasGradient>} */
    #cache = new WeakMap();

    /**
     * @param {readonly ColorStop[]} stops
     */
    constructor(stops) {
        this.#colorStops = Object.isFrozen(stops) ? stops : [...stops];  // 受け取った時点で別のオブジェクトであるべき 既に凍ってるなら問題ない
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    getGradient(ctx) {
        // 同じctxの場合：作り直すのは無駄なので再利用
        // 違うctxの場合：使い回せないので再作成
        let gradient = this.#cache.get(ctx);

        if (gradient === undefined) {
            // --- Gradient を作る ---
            gradient = this.createGradient(ctx);
            this.#applyStops(gradient);

            // キャッシュに保存
            this.#cache.set(ctx, gradient);
        }

        return gradient;
    }

    /**
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

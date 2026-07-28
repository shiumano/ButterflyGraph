/**
 * @import { GenericDrawObject } from "@core/Graphics/drawObject.js";
 * @typedef {{ offset: number, color: string }} ColorStop
 * @typedef {"stops" | "criteria"} GradientRecreateReason
 */

import { WeakArray } from "../../Utils/memory.js";

/**
 * グラデーションを表すオブジェクト
 */
export class Gradient {
    /** @type {ColorStop[]} */
    #colorStops = [];
    #stopsChanged = true;

    /** @type {WeakMap<RenderingContext, CanvasGradient>} */
    #cache = new WeakMap();

    /** @type {Readonly<Readonly<ColorStop[]>>?} */
    #frozenStops = null;

    /** @type {WeakArray<GenericDrawObject>} */
    #mountedObjects = new WeakArray();

    /**
     * @param {ColorStop[]} stops
     */
    constructor(stops = []) {
        this.#colorStops = [...stops];  // 受け取った時点でそれは別のオブジェクトであるべき
    }

    /**
     * @param {number} offset 0〜1
     * @param {string} color CSS color
     */
    addColorStop(offset, color) {
        this.#colorStops.push({ offset: offset, color });
        this.requestRecreate("stops");
    }

    getColorStops() {
        let stops = this.#frozenStops;

        if (this.#stopsChanged || stops === null) {
            stops = Object.freeze(this.#colorStops.map(stop => Object.freeze({ ...stop })));
            this.#frozenStops = stops;
            this.#stopsChanged = false;
        }

        return stops;
    }

    clearColorStops() {
        this.#colorStops = [];
        this.requestRecreate("stops");
    }

    /**
     * @param {GenericDrawObject} object
     */
    mountTo(object) {
        if (!this.#mountedObjects.includes(object)) {
            this.#mountedObjects.push(object);
        }
    }

    /**
     * @param {GenericDrawObject} object
     */
    unmountFrom(object) {
        this.#mountedObjects.remove(object);
    }

    /**
     * @param {GradientRecreateReason} reason
     */
    requestRecreate(reason) {
        this.#cache = new WeakMap();  // WeakMapにclear()は無い、つくりなおすしか無い

        if (reason === "stops") {
            this.#stopsChanged = true;
        }

        this.#mountedObjects.forEach((obj) => {
            obj.requestRecreate(obj, "object");
        });
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
            grad.addColorStop(cs.offset, cs.color);
        }
    }
}

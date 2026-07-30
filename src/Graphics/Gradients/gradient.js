/**
 * @import { DrawObject } from "@core/Graphics/drawObject.js";
 * @typedef {{ offset: number, color: string }} ColorStop
 * @typedef {"stops" | "criteria"} GradientRecreateReason
 */

import { WeakArray } from "../../Utils/weakArray.js";
import { classOf } from "../../Utils/metaPrg.js";

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

    /** @type {WeakArray<DrawObject>} */
    #mountedObjects = new WeakArray();

    /** @type {Map<string, typeof Gradient>} */
    static #objectTypes = new Map();
    static get gradientTypeNames() { return this.#objectTypes.keys(); }

    /**
     * @param {string} name
     */
    static getTypeByName(name) {
        return this.#objectTypes.get(name);
    }

    /**
     * @param {ColorStop[]} stops
     */
    constructor(stops = []) {
        const thisCls = /** @type {typeof Gradient} */ (classOf(this));
        Gradient.#objectTypes.set(thisCls.name, thisCls);

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
     * @param {DrawObject} object
     */
    mountTo(object) {
        if (!this.#mountedObjects.includes(object)) {
            this.#mountedObjects.push(object);
        }
    }

    /**
     * @param {DrawObject} object
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

    toJSON() {
        return {
            type: classOf(this).name,
            stops: this.#colorStops,
            args: /** @type {number[]} */ ([])
        };
    }
}

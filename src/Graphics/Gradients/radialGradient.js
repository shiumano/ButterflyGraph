import { Gradient, GradientBuilder } from "./gradient.js";

/**
 * @import { ColorStop } from "./gradient.js";
 */

export class RadialGradient extends Gradient {
    #x0;
    #y0;
    #r0;
    #x1;
    #y1;
    #r1;

    /**
     * 
     * @param {number} x0
     * @param {number} y0
     * @param {number} r0
     * @param {number} x1
     * @param {number} y1
     * @param {number} r1
     * @param {ColorStop[]} stops
     */
    constructor(x0, y0, r0, x1, y1, r1, stops = []) {
        super(stops);
        this.#x0 = x0;
        this.#y0 = y0;
        this.#r0 = r0;

        this.#x1 = x1;
        this.#y1 = y1;
        this.#r1 = r1;
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} r 
     */
    setInner(x, y, r) {
        this.#x0 = x;
        this.#y0 = y;
        this.#r0 = r;
        this.requestRecreate();
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} r 
     */
    setOuter(x, y, r) {
        this.#x1 = x;
        this.#y1 = y;
        this.#r1 = r;
        this.requestRecreate();
    }

    createGradientBuilder() {
        return new RadialGradientBuilder(
            this.#x0, this.#y0, this.#r0,
            this.#x1, this.#y1, this.#r1,
            this.getColorStops()
        );
    }
}

class RadialGradientBuilder extends GradientBuilder {
    #x0;
    #y0;
    #r0;
    #x1;
    #y1;
    #r1;

    /**
     * 
     * @param {number} x0
     * @param {number} y0
     * @param {number} r0
     * @param {number} x1
     * @param {number} y1
     * @param {number} r1
     * @param {readonly ColorStop[]} stops
     */
    constructor(x0, y0, r0, x1, y1, r1, stops = []) {
        super(stops);
        this.#x0 = x0;
        this.#y0 = y0;
        this.#r0 = r0;

        this.#x1 = x1;
        this.#y1 = y1;
        this.#r1 = r1;
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    createGradient(ctx) {
        const grad = ctx.createRadialGradient(
            this.#x0, this.#y0, this.#r0,
            this.#x1, this.#y1, this.#r1
        );

        return this._applyStops(grad);
    }
}

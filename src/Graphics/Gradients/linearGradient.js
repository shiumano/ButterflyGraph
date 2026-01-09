import { Gradient, GradientBuilder } from "./gradient.js";

/**
 * @import { ColorStop } from "./gradient.js";
 */

export class LinearGradient extends Gradient {
    #x0;
    #y0;
    #x1;
    #y1;

    /**
     * 
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {ColorStop[]} stops
     */
    constructor(x0, y0, x1, y1, stops = []) {
        super(stops);
        this.#x0 = x0;
        this.#y0 = y0;
        this.#x1 = x1;
        this.#y1 = y1;
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     */
    setStart(x, y) {
        this.#x0 = x;
        this.#y0 = y;
        this.requestRecreate();
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     */
    setEnd(x, y) {
        this.#x1 = x;
        this.#y1 = y;
        this.requestRecreate();
    }

    createGradientBuilder() {
        return new LinearGradientBuilder(this.#x0, this.#y0, this.#x1, this.#y1, this.getColorStops());
    }
}

class LinearGradientBuilder extends GradientBuilder {
    #x0;
    #y0;
    #x1;
    #y1;

    /**
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {readonly ColorStop[]} stops
     */
    constructor(x0, y0, x1, y1, stops) {
        super(stops);
        this.#x0 = x0;
        this.#y0 = y0;
        this.#x1 = x1;
        this.#y1 = y1;
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    createGradient(ctx) {
        return ctx.createLinearGradient(
            this.#x0, this.#y0,
            this.#x1, this.#y1
        );
    }
}

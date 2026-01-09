import { Gradient, GradientBuilder } from "./gradient.js";

/**
 * @import { ColorStop } from "./gradient.js";
 */

export class ConicGradient extends Gradient {
    #angle;
    #x;
    #y;

    /**
     *
     * @param {number} angle 起点角度（rad）
     * @param {number} x
     * @param {number} y
     * @param {ColorStop[]} stops
     */
    constructor(angle, x, y, stops = []) {
        super(stops);
        this.#angle = angle;
        this.#x = x;
        this.#y = y;
    }

    /**
     *
     * @param {number} angle
     */
    setAngle(angle) {
        this.#angle = angle;
        this.requestRecreate();
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     */
    setCenter(x, y) {
        this.#x = x;
        this.#y = y;
        this.requestRecreate();
    }

    createGradientBuilder() {
        return new ConicGradientBuilder(this.#angle, this.#x, this.#y, this.getColorStops());
    }
}

class ConicGradientBuilder extends GradientBuilder {
    #angle;
    #x;
    #y;

    /**
     * @param {number} angle 起点角度（rad）
     * @param {number} x
     * @param {number} y
     * @param {readonly ColorStop[]} stops
     */
    constructor(angle, x, y, stops) {
        super(stops);
        this.#angle = angle;
        this.#x = x;
        this.#y = y;
    }
    /**
     *
     * @param {CanvasRenderingContext2D} ctx
     */
    createGradient(ctx) {
        return ctx.createConicGradient(
            this.#angle,
            this.#x,
            this.#y
        );
    }
}

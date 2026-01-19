import { AnimationBase } from "./animationBase.js";

var _ = 0;

/**
 * @enum {number}
 */
export const Easing = Object.freeze({
    none: _++,
    in: _++,
    inQuad: _++,
    out: _++,
    outQuad: _++,
    inOutQuad: _++,
    inSine: _++,
    outSine: _++
})

export class EaseAnimation extends AnimationBase{
    #easing;

    /**
     *
     * @param {number} end
     * @param {number} duration
     * @param {Easing} easing
     */
    constructor(end, duration, easing) {
        super(end, duration)
        this.#easing = easing;
    }


    /**
     * @param {number} norm
     */
    leap(norm) {
        switch (this.#easing) {
            case Easing.in:
            case Easing.inQuad:
                return norm * norm;

            case Easing.out:
            case Easing.outQuad:
                return norm * (2 - norm);

            case Easing.inOutQuad:
                if (norm < 0.5) return norm * norm * 2;

                return 0.5 + (norm - 0.5) * (1.5 - norm) * 2;

            case Easing.inSine:
                return 1 - Math.cos(Math.PI * norm / 2);

            case Easing.outSine:
                return Math.sin(Math.PI * norm / 2);

            default:
                return norm;
        }
    }
}

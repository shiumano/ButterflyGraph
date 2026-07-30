import { AnimationBase } from "./animationBase.js";

/**
 * @import { ValueOf } from "@core/Utils/metaPrg.js"
 */

export const Easing = Object.freeze({
    none: 0,
    in: 1,
    inQuad: 2,
    out: 3,
    outQuad: 4,
    inOutQuad: 5,
    inSine: 6,
    outSine: 7
});
/**
 * @typedef {ValueOf<typeof Easing>} EasingTypes
 */

export class EaseAnimation extends AnimationBase{
    #easing;

    /**
     *
     * @param {number} end
     * @param {number} duration
     * @param {EasingTypes} easing
     */
    constructor(end, duration, easing) {
        super(end, duration);
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

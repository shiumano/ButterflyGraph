import { AnimationBase } from "./animationBase.js";

export class LinearAnimation extends AnimationBase{
    /**
     * @param {number} t
     */
    getValue(t) {
        const moveRange = this.endValue - this.startValue;
        const norm = t / this.duration;

        return this.startValue + moveRange * norm;
    }
}

export class AnimationBase {
    startValue = 0;
    endValue;
    duration;

    /**
     *
     * @param {number} end
     * @param {number} duration
     */
    constructor(end, duration) {
        this.endValue = end;
        this.duration = duration;
    }

    /**
     * @param {number} t
     * @returns {number}
     */
    getValue(t) {
        const moveRange = this.endValue - this.startValue;
        const norm = this.duration !== 0 ? t / this.duration : 1;

        return this.startValue + moveRange * this.leap(norm);
    }

    /**
     * @abstract
     * @param {number} norm
     * @returns {number}
     */
    leap(norm) {
        throw new Error("Not implemented");
    }
}

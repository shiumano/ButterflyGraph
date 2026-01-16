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
     * @abstract
     * @param {number} t
     * @returns {number}
     */
    getValue(t) {
        throw new Error("Not implemented");
    }
}

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
        const norm = t !== 0 ? Math.min(Math.max(t / this.duration, 0), 1) : 1;  // HACK: なん(NaN)なんだよもう！（小粋なギャグ とにかく0/0は避けよう

        return this.startValue + moveRange * this.leap(norm);
    }

    /**
     * @abstract
     * @param {number} norm 0 ~ 1
     * @returns {number}
     */
    leap(norm) {
        throw new Error("Not implemented");
    }
}

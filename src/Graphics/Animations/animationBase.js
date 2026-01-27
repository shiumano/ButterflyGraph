export class AnimationBase {
    startValue = 0;
    endValue;
    duration;
    timeRange;

    /**
     * @param {number} end
     * @param {number} duration
     */
    constructor(end, duration) {
        this.endValue = end;
        this.duration = duration;
        this.timeRange = duration;
    }

    /**
     * @param {number} t
     * @returns {number}
     */
    getValue(t) {
        const moveRange = this.endValue - this.startValue;
        // duration=0の場合は即座に終了値へ遷移(0/0でNaNが生まれるので)、それ以外は通常の正規化
        const norm = this.timeRange === 0 ? 1 : Math.min(Math.max(t / this.timeRange, 0), 1);

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

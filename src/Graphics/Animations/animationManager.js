import { EaseAnimation, Easing } from "./easeAnimation.js";
import { LinearAnimation } from "./linearAnimation.js";

/**
 * @import { AnimationBase } from "./animationBase"
 */

/**
 * @template T
 * @type {AnimationManager<T>}
 */
export class AnimationManager {
    /** @type {AnimationBase[]} */
    #animations = []
    startValue = 0;  // TODO: あとでちゃんとget/setにして最初のｱﾆﾒを書き換えるようにする
    /** @type {AnimationBase?} */
    #firstAnimation = null;
    #lastTime = 0;
    #lastValue = 0;
    /** @type {AnimationBase?} */
    #lastAnimation = null;
    #duration = 0;
    #latestAnimationIndex = 0;
    #latestUsedAnimationStartTime = 0;

    #applyer;
    // ……@typeが多いね

    /**
     * @param {number} startValue
     * @param {(value: number) => T} applyer
     */
    constructor(startValue, applyer) {
        this.startValue = startValue;
        this.#applyer = applyer;
    }

    /**
     * @param {AnimationBase} animation
     */
    addAnimation(animation) {
        if (this.#firstAnimation === null)
            this.#firstAnimation = animation;

        const lastEndValue = this.#animations[this.#animations.length - 1]?.endValue;
        if (lastEndValue !== undefined) {
            animation.startValue = lastEndValue;
        } else {
            animation.startValue = this.startValue;
        }
        this.#duration += animation.duration;
        this.#lastValue = animation.endValue;
        this.#lastAnimation = animation;
        this.#animations.push(animation);

        return this;
    }

    // TODO: removeAnimationとかinsertAnimationとかも作る！

    /**
     * @param {number} end
     * @param {number} duration
     */
    to(end, duration) {
        return this.addAnimation(new LinearAnimation(end, duration));
    }

    /**
     * @param {number} duration
     */
    delay(duration) {
        return this.addAnimation(new LinearAnimation(this.#lastValue, duration))
    }

    /**
     * @param {number} end
     * @param {number} duration
     */
    easeIn(end, duration) {
        return this.addAnimation(new EaseAnimation(end, duration, Easing.in));
    }

    /**
     * @param {number} end
     * @param {number} duration
     */
    easeOut(end, duration) {
        return this.addAnimation(new EaseAnimation(end, duration, Easing.out));
    }

    /**
     * @param {number} end
     * @param {number} duration
     */
    easeInOutQuad(end, duration) {
        return this.addAnimation(new EaseAnimation(end, duration, Easing.inOutQuad));
    }

    /**
     * @param {number} end
     * @param {number} duration
     */
    easeInSine(end, duration) {
        return this.addAnimation(new EaseAnimation(end, duration, Easing.inSine));
    }

    /**
     * @param {number} end
     * @param {number} duration
     */
    easeOutSine(end, duration) {
        return this.addAnimation(new EaseAnimation(end, duration, Easing.outSine));
    }

    /**
     *
     * @param {number} t
     */
    getValue(t) {
        // PERF: forは減ったがifが増えた
        // IDK: 得なのか損なのか比べても誤差でよくわからん きっと軽いでしょ

        const animationCount = this.#animations.length;  // Array.lengthも負荷 JSはスレッド競合が起きない言語なのでヨシ！

        // ❌ 1st EXCEPTION: no animations
        if (animationCount === 0) {
            // console.log("no animations");
            return this.startValue;  // 何かしらは(ry
        }

        // ❌ 2nd EXCEPTION: overrun
        if (t > this.#duration) {
            // console.log("overrun");
            return this.#lastAnimation?.getValue(t) ?? this.#lastValue;  // 何か(ry
        }

        if (t >= this.#lastTime) {
            this.#lastTime = t;

            // ⭕ 1st HOTPATH: same animation
            let animationIndex = this.#latestAnimationIndex;
            let animationStartTime = this.#latestUsedAnimationStartTime;

            const latestUsedAnimationStartTime = animationStartTime;
            const latestAnimation = this.#animations[animationIndex];

            if (t >= latestUsedAnimationStartTime && t < latestUsedAnimationStartTime + latestAnimation.duration) {
                // console.log("same animation");
                return latestAnimation.getValue(t - latestUsedAnimationStartTime);
            }

            // ⭕ 2nd HOTPATH: next animation
            animationIndex++;

            // ❌ 3rd EXCEPTION: no next
            if (animationIndex >= animationCount || animationIndex < 0) {  // どっちかといえば増えていくほうのパスが温かい というか普通マイナスには行かない
                // console.log("no next");
                return this.#lastAnimation?.getValue(t) ?? this.#lastValue;
            }

            const nextAnimationStartTime = animationStartTime;
            const nextAnimation = this.#animations[animationIndex];

            animationStartTime += latestAnimation.duration;

            if (t >= nextAnimationStartTime && t < nextAnimationStartTime + nextAnimation.duration) {
                // console.log("next animation");
                this.#latestAnimationIndex = animationIndex;
                this.#latestUsedAnimationStartTime = animationStartTime;
                return nextAnimation.getValue(t - nextAnimationStartTime);
            }

            // ⭕ 3rd HOTPATH: reset time
            const firstAnimation = this.#firstAnimation;
            if (firstAnimation !== null && t < firstAnimation.duration) {
                // console.log("reset time");
                this.#latestAnimationIndex = 0;
                this.#latestUsedAnimationStartTime = 0;
                return firstAnimation.getValue(t);
            }
        }

        // 🔙 DEOPTIMIZATION: loop search
        let animationStartTime = 0;
        for (let i = 0; i < this.#animations.length; i++) {  // PERF: 配列のlengthで回したほうが境界チェックが減って速い 蜘蛛猿はトントンだがV8は2倍近い差がある
            const animation = this.#animations[i];
            if (t < animationStartTime + animation.duration) {
                // console.log("loop search find");
                this.#latestAnimationIndex = i;
                this.#latestUsedAnimationStartTime = animationStartTime;
                return animation.getValue(t - animationStartTime);
            }
            animationStartTime += animation.duration;
        }
        return this.#lastAnimation?.endValue ?? this.#lastValue;
    }

    /**
     * @param {number} t
     */
    get(t) {
        return this.#applyer(this.getValue(t));
    }
}

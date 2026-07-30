// 一体何度、Vector2は実装されたのだろうか

/**
 * @typedef {{x: number, y: number}} Pos
 */

/**
 * x, yの値を表すシンプルなオブジェクト
 */
export class Vector2 {
    #x = 0;
    #y = 0;
    #editable = true;

    /**
     * @param {Pos} pos
     */
    constructor(pos) {
        if (pos instanceof Vector2) {
            this.#x = pos.#x;
            this.#y = pos.#y;
        } else {
            const { x = 0, y = 0 } = pos;
            this.#x = x;
            this.#y = y;
        }
    }

    get x() { return this.#x; }
    set x(value) {
        if (this.#editable) {
            this.#x = value;
        }
        else {
            console.error("This Vector2 is not editable.");
        }
    }

    get y() { return this.#y; }
    set y(value) {
        if (this.#editable) {
            this.#y = value;
        }
        else {
            console.error("This Vector2 is not editable.");
        }
    }

    /**
     * @param {Readonly<Vector2>} other
     */
    equals(other) {
        // WARN: Readonly<>にした結果、プライベート要素が滅んだ
        // @ts-expect-error
        return this === other || this.#x === other.#x && this.#y === other.#y;
    }

    /**
     * このVector2オブジェクトの変更不能版を取得する
     * @returns {Readonly<Vector2>}
     */
    freeze() {
        if (!this.#editable) {
            return this;
        } else {
            const frozenVector2 = new Vector2(this);
            frozenVector2.#editable = false;
            return frozenVector2;
        }
    }

    /**
     * 変更不能なVector2オブジェクトを生成する
     * @param {Pos} pos
     */
    static newFreeze(pos) {
        return (pos instanceof Vector2 ? pos : new Vector2(pos)).freeze();
    }

    toJSON() {
        return { x: this.#x, y: this.#y };
    }
}

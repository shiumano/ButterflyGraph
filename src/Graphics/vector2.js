// 一体何度、Vector2は実装されたのだろうか

/**
 * x, yの値を表すシンプルなオブジェクト
 */
export class Vector2 {
    #x;
    #y;
    #editable;

    /**
     * @overload
     * @param {number} x
     * @param {number} y
     * @param {true} editable 
     * @returns {Vector2}
     * @overload
     * @param {number} x
     * @param {number} y
     * @param {false} editable
     * @returns {Readonly<Vector2>}
     */
    constructor(x = 0, y = 0, editable = true) {
        this.#x = x;
        this.#y = y;
        this.#editable = editable;
    }

    get x() { return this.#x; }
    set x(value) { 
        if (this.#editable)
            this.#x = value;
        else
            console.error("This Vector2 is not editable.");
    }

    get y() { return this.#y; }
    set y(value) { 
        if (this.#editable)
            this.#y = value;
        else
            console.error("This Vector2 is not editable.");
    }

    /**
     * このVector2オブジェクトの変更不能版を取得する
     */
    freeze() {
        return this.#editable ? new Vector2(this.x, this.y, false) : this;
    }
}

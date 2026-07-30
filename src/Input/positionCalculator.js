/**
 * @import { Pos } from "@core/Graphics/vector2.js"
 * @import { DrawObject } from "@core/Graphics/drawObject.js"
 */

/** @type {Readonly<Float64Array>} */
const identityMatrix = createInitialMatrix();

export class PositionCalculator {
    /** @type {WeakMap<DrawObject, PositionCalculator>} */
    static #attachedCalculators = new WeakMap();

    static #lastVersion = 0;

    #calclatedVersion = -1;
    #parentVersion = -1;

    #localTransform = createInitialMatrix();
    #worldTransform = createInitialMatrix();

    #rTransform = createInitialMatrix();

    #targetId = -1;  // 自分からDrawObjectを参照しないという強い意思

    static #constructKey = Symbol();
    /**
     * @param {Symbol} key
     * @param {DrawObject} target
     */
    constructor(key, target) {
        if (key !== PositionCalculator.#constructKey) {
            throw new TypeError("ElementRectCache is not constructible.");
        }

        this.#targetId = target.globalId;
        this.#calculateTransform(target);
    }

    // PERF: いちいちこの程度のラムダを生成するだけでも目立つコストが発生する
    //     : 他が軽いから浮き出てきちゃう
    /**
     * @param {DrawObject} target
     */
    static #createCalulator = (target) => new PositionCalculator(this.#constructKey, target);

    /**
     * @param {DrawObject} target
     * @param {number} lx
     * @param {number} ly
     */
    static getLocalPos(target, lx, ly) {
        const calculator = this.#attachedCalculators.getOrInsertComputed(target, this.#createCalulator);
        const rTransform = calculator.#calculateTransform(target);
        const pos = worldToLocal(lx, ly, rTransform);

        return pos;
    }

    /**
     * @param {DrawObject} target
     */
    #calculateTransform(target) {
        if (target.globalId !== this.#targetId) throw new Error("An incorrect target was specified.");

        const parent = target.parent;

        const localTransform = this.#localTransform;
        const worldTransform = this.#worldTransform;

        let parentVersion;
        let parentWorldTransform;
        if (parent !== null) {
            const parentCalculator = PositionCalculator.#attachedCalculators.getOrInsertComputed(
                parent, PositionCalculator.#createCalulator
            );

            parentCalculator.#calculateTransform(parent);

            parentWorldTransform = parentCalculator.#worldTransform;
            parentVersion = parentCalculator.#calclatedVersion;
        } else {
            parentWorldTransform = identityMatrix;
            parentVersion = -1;
        }

        if (target.transformCacheInvalid || this.#parentVersion !== parentVersion) {
            calculateMatrix(target, this.#localTransform);
            target.transformCacheInvalid = false;

            // console.log("target:", target.name, "parent:", parent?.name)
            multiplyMatrix(parentWorldTransform, localTransform, worldTransform);
            invertMatrix(worldTransform, this.#rTransform);

            this.#calclatedVersion = PositionCalculator.#lastVersion++;
            this.#parentVersion = parentVersion;
        }

        return this.#rTransform;
    }
}

function createInitialMatrix() {
    return new Float64Array([1, 0, 0, 1, 0, 0]);
}

/**
 * @param {Readonly<{
 *   x: number, y: number, rotation: number,
 *   scaleX: number, scaleY: number,
 *   anchor: Pos,
 *   originOffsetX: number, originOffsetY: number,
 *   parentWidth: number, parentHeight: number
 * }>} options
 * @param {Float64Array} matrix
 */
function calculateMatrix(options, matrix) {
    const {
        x, y, rotation,
        scaleX, scaleY,
        anchor,
        originOffsetX, originOffsetY,
        parentWidth, parentHeight
    } = options;

    const drawX = x - originOffsetX + parentWidth * anchor.x;
    const drawY = y - originOffsetY + parentHeight * anchor.y;
    // 回転のサイン・コサインを計算
    const rCos = Math.cos(rotation);
    const rSin = Math.sin(rotation);

    // 行列の各成分を計算
    matrix[0] = scaleX * rCos;
    matrix[1] = scaleX * rSin;
    matrix[2] = -scaleY * rSin;
    matrix[3] = scaleY * rCos;
    matrix[4] = drawX + originOffsetX - originOffsetX * rCos + originOffsetY * rSin;
    matrix[5] = drawY + originOffsetY - originOffsetX * rSin - originOffsetY * rCos;
}

/**
 * @param {Readonly<Float64Array>} a
 * @param {Readonly<Float64Array>} b
 * @param {Float64Array} out
 */
function multiplyMatrix(a, b, out) {
    const a_a = a[0], a_b = a[1], a_c = a[2], a_d = a[3], a_e = a[4], a_f = a[5];
    const b_a = b[0], b_b = b[1], b_c = b[2], b_d = b[3], b_e = b[4], b_f = b[5];

    out[0] = a_a * b_a + a_c * b_b;  // m0
    out[1] = a_b * b_a + a_d * b_b;  // m1
    out[2] = a_a * b_c + a_c * b_d;  // m2
    out[3] = a_b * b_c + a_d * b_d;  // m3
    out[4] = a_a * b_e + a_c * b_f + a_e;  // m4 (World X)
    out[5] = a_b * b_e + a_d * b_f + a_f;  // m5 (World Y)
}

/**
 * @param {number} lx
 * @param {number} ly
 * @param {Readonly<Float64Array>} worldMatrix
 */
function localToWorld(lx, ly, worldMatrix) {
    return {
        x: worldMatrix[0] * lx + worldMatrix[2] * ly + worldMatrix[4],
        y: worldMatrix[1] * lx + worldMatrix[3] * ly + worldMatrix[5]
    };
}

/**
 * @param {Readonly<Float64Array>} m
 * @param {Float64Array} out
 */
function invertMatrix(m, out) {
    const a = m[0], b = m[1], c = m[2], d = m[3], e = m[4], f = m[5];

    // 行列式 (Determinant) の計算
    const det = a * d - b * c;

    // スケールが0などの理由で逆行列が存在しない（行列式が0）場合のエラーハンドリング
    if (det === 0) {
        return false;
    }

    const invDet = 1.0 / det;

    // 逆行列の各成分を計算
    out[0] = d * invDet;
    out[1] = -b * invDet;
    out[2] = -c * invDet;
    out[3] = a * invDet;
    out[4] = (c * f - d * e) * invDet;
    out[5] = (b * e - a * f) * invDet;

    return true;
}

/**
 * @param {number} wx
 * @param {number} wy
 * @param {Readonly<Float64Array>} invWorldMatrix
 */
function worldToLocal(wx, wy, invWorldMatrix) {
    return {
        x: invWorldMatrix[0] * wx + invWorldMatrix[2] * wy + invWorldMatrix[4],
        y: invWorldMatrix[1] * wx + invWorldMatrix[3] * wy + invWorldMatrix[5]
    };
}

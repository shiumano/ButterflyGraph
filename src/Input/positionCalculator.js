/**
 * @import { GenericDrawObject } from "@core/Graphics/drawObject.js"
 */

import { WeakArray } from "../Utils/memory.js";

const identityMatrix = createInitialMatrix();

export class PositionCalculator {
    /** @type {WeakMap<GenericDrawObject, Float64Array>} */
    static #transformCache = new WeakMap();
    /** @type {WeakMap<GenericDrawObject, Float64Array>} */
    static #worldMatrixCache = new WeakMap();
    /** @type {WeakArray<PositionCalculator>} */
    static #registeredCalculators = new WeakArray();

    /** @type {Set<number>} */
    #invalidParentsId = new Set();

    #target;

    #rMatrix = createInitialMatrix();

    /**
     * @param {GenericDrawObject} target
     */
    constructor(target) {
        this.#target = target;

        PositionCalculator.#registeredCalculators.push(this);

        const { matrix } = this.#calculateWorldTransform(target);
        invertMatrix(matrix, this.#rMatrix);
    }

    /**
     * @param {number} lx
     * @param {number} ly
     */
    getLocalPos(lx, ly) {
        const { transformInvalid, matrix } = this.#calculateWorldTransform(this.#target);
        const rMatrix = this.#rMatrix;
        if (transformInvalid) invertMatrix(matrix, rMatrix);
        const pos = worldToLocal(lx, ly, rMatrix);

        return pos;
    }

    // PERF: arrayのnewはやめよう！
    /** @type {GenericDrawObject[]} */
    #branchLineArr = [];
    /**
     * @param {GenericDrawObject} target
     */
    #calculateWorldTransform(target) {
        const branchLine = this.#branchLineArr;
        /** @type {GenericDrawObject?} */
        let revCurrentObj = target;
        while (revCurrentObj !== null) {
            branchLine.push(revCurrentObj);
            revCurrentObj = revCurrentObj.parent;
        }

        let transformInvalid = false;
        for (let i = branchLine.length - 1; i >= 0; i--) {
            const obj = branchLine[i];

            const transformCacheInvalid = obj.transformCacheInvalid;
            if (transformCacheInvalid) {
                this.#addInvalidId(obj.globalId);
            }

            transformInvalid ||= transformCacheInvalid || this.#invalidParentsId.has(obj.globalId);

            if (transformInvalid) {
                const objMatrix = transformCache.getOrInsertComputed(obj, createInitialMatrix);
                calculateMatrix(obj, objMatrix);

                const worldMatrix = worldMatrixCache.getOrInsertComputed(obj, createInitialMatrix);
                if (obj.parent !== null) {
                    parentWorldMatrix = worldMatrixCache.getOrInsertComputed(obj.parent, createInitialMatrix);
                    // parentWorldMatrixは既に計算されているはず！
                    multiplyMatrix(parentWorldMatrix, objMatrix, worldMatrix);
                } else {
                    multiplyMatrix(identityMatrix, objMatrix, worldMatrix);
                }

                obj.transformCacheInvalid = false;
            }
        }

        branchLine.length = 0;
        this.#invalidParentsId.clear();  // 一番上からターゲットの場所まで回してなかったんだから、もう使わないんですよ

        const matrix = worldMatrixCache.getOrInsertComputed(target, createInitialMatrix);
        return { transformInvalid, matrix };
    }

    /**
     * @param {number} objId
     */
    #addInvalidId(objId) {
        PositionCalculator.#registeredCalculators.forEach((calculator) => {
            calculator.#invalidParentsId.add(objId);
        });
    }
}

function createInitialMatrix() {
    return new Float64Array([1, 0, 0, 1, 0, 0]);
}

/**
 * @param {Readonly<{
 *   x: number, y: number, rotation: number,
 *   scaleX: number, scaleY: number,
 *   anchor: {x: number, y: number},
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

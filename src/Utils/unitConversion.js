/**
 * 直接変換（単位変換なし）
 * @param {number} value
 * @returns {number}
 */
export function direct(value) {
    return value;
}

/**
 * 度からラジアンへ変換
 * @param {number} degree
 * @returns {number}
 */
export function degreeToRadian(degree) {
    return degree * (Math.PI / 180);
}

/**
 * 回転数からラジアンへ変換
 * @param {number} rotation
 * @returns {number}
 */
export function rotationToRadian(rotation) {
    return rotation * 2 * Math.PI;
}

/**
 * 角度からHSLの色相CSSへ変換
 * @param {number} degree
 * @returns {string}
 */
export function angleToHSLColor(degree) {
    const hue = ((degree % 360) + 360) % 360;  // 正の値に変換
    return `hsl(${hue}, 100%, 50%)`;
}

/**
 * 回転数からHSLの色相CSSへ変換
 * @param {number} rotation
 * @returns {string}
 */
export function rotationToHSLColor(rotation) {
    const hue = ((rotation % 1) + 1) % 1;  // 正の値に変換
    return `hsl(${hue}turn, 100%, 50%)`;
}

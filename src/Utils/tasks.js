// トップレベル以外からの場所から呼び出すとwindowから呼び出されたことにならず壊れることがある
// bindしておくことで、どこから呼び出してもwindowから呼び出されたことになる
const fixedRequestAnimationFrame = requestAnimationFrame.bind(window);

/***
 * @param {number} ms
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function waitVsync() {
    return new Promise(fixedRequestAnimationFrame);
}

// トップレベル以外からの場所(とくにPromise)から呼び出すとwindowから呼び出されたことにならず壊れることがある
// bindしておくことで、どこから呼び出してもwindowから呼び出されたことになる
const fixedRequestAnimationFrame = requestAnimationFrame.bind(window);

/**
 * @param {number} ms
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 次のフレームが描画されるタイミングで解決されるPromiseを返す
 * @returns {Promise<number>} 解決された時点のタイムスタンプを返すPromise
 */
export function waitVsync() {
    // つまりこういうこと
    // return new Promise(resolve => {
    //     function animationCallback(timestamp) {
    //         resolve(timestamp);
    //     }
    //     requestAnimationFrame(animationCallback);
    // });
    //
    // でもよく見るとanimationCallbackとresolveのシグネチャは同じだから、これで動くはず
    // return new Promise(resolve => {
    //     requestAnimationFrame(resolve)
    // });
    //
    // さらにPromiseコンストラクタの引数は”コールバック関数を受け取る関数”で、requestAnimationFrameも同じ
    // ということでrequestAnimationFrameをそのまま渡してもいけるはず
    //
    // つまり、PromiseコンストラクタにrequestAnimationFrameを渡すだけで
    // 「次のフレームのタイミングで、そのフレームのタイムスタンプで解決されるPromise」
    // が出来上がる
    //
    // それがこれ↓
    return new Promise(fixedRequestAnimationFrame);
}

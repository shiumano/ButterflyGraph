/**
 * @typedef {(time: DOMHighResTimeStamp) => void} TimestampCallback
 */

// トップレベル以外からの場所(とくにPromise)から呼び出すとwindowから呼び出されたことにならず壊れることがある
// bindしておくことで、どこから呼び出してもwindowから呼び出されたことになる
const fixedRequestAnimationFrame = requestAnimationFrame.bind(window);

/**
 * @param {TimestampCallback} resolve
 */
function resolveNowCallback(resolve) {
    resolve(window.performance.now());
}
/** @type {(resolve: TimestampCallback) => number} */
const sleep4msTimeout = setTimeout.bind(window, resolveNowCallback, 4);

// 参考: https://dbaron.org/log/20100309-faster-timeouts

const channel = new MessageChannel();
const sendPort = channel.port2;
/** @type {TimestampCallback[]} */
const queue = [];

channel.port1.onmessage = function () {
    queue.shift()?.(performance.now());
};

/**
 * @param {TimestampCallback} callback
 */
function setZeroTimeout(callback) {
    queue.push(callback);
    sendPort.postMessage(null);
}

/**
 * 次のフレームが描画されるタイミングで解決されるPromiseを返す
 * @returns {Promise<DOMHighResTimeStamp>} 解決された時点のタイムスタンプを返すPromise
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

// 誤差計算がグローバルだとあちこちで呼び出された時に酷いことになりかねない
// IDK: でもそこまで考慮する必要ある？どうせもともと4ms未満のsleepなんて存在しないんだよ？
let diff = 0;

/**
 * 指定した時間を非同期で待機する
 * ms < 4の場合、4ms以上の遅延になるまで0msになる
 * @param {number} ms
 * @returns {Promise<DOMHighResTimeStamp>}
 */
export function sleep(ms) {
    if (ms < 4) {
        // HACK: 基本的にブラウザーのsetTimeoutは4msが下限
        //     : 普通に考えて4ms未満の周期なんぞにするべきではない
        //     : しかし、パフォーマンステストで限界を調べるなら、そこで止まってしまうとつまらない
        //     : ということで4ms未満の場合、待機時間が4msを超えるまで*0msのタイムアウト*になる
        //     : 0ms未満にした場合、*確実に*0msになる
        //     : postMessageでイベントを挟ませているからスレッドの停止はされないが、死ぬほど重いことに変わりはない
        //     : ちゃんとした安定性が欲しければ4ms以上で呼びましょうね、4ms未満は標準仕様のサポート外なんだから文句言うな
        if (ms > 0) diff += ms;

        if (diff < 4) {
            return new Promise(setZeroTimeout);
        } else {
            diff -= 4;
            return new Promise(sleep4msTimeout);
        }
    }

    // 説明したら100行のコメントが必要になる AIに聞けばたぶん教えてくれるよ
    return new Promise(setTimeout.bind(window, resolveNowCallback, ms));
}

// https://developer.mozilla.org/ja/docs/Web/API/Path2D
const path2d_mutation_funcs = [
    "addPath", "rect", "roundRect", "arc", "ellipse",
    "moveTo", "lineTo","arcTo", "bezierCurveTo", "quadraticCurveTo",
    "closePath"
];

const readonlyProto = Object.create(Path2D.prototype);
for (const key of Object.getOwnPropertyNames(Path2D.prototype)) {
    if (key === "constructor") continue;

    const desc = Object.getOwnPropertyDescriptor(Path2D.prototype, key);
    if (typeof desc?.value === "function") {
        if (path2d_mutation_funcs.includes(key)) {
            Object.defineProperty(readonlyProto, key, {
                value: () => {
                    throw new TypeError(`Path2D is readonly. Cannot call method: ${key}`);
                }
            });
        } else {
            // 今後APIが生えたときのために… @napi-rs/canvas使っても発火するが、それはしゃーない
            console.warn(`${key}ってなんの関数！？`);
        }
    }
}
Object.freeze(readonlyProto);

/**
 * Path2Dを変更不可能にする
 * @param {Path2D} path
 */
function freezePath(path) {
    // HACK: 結構な破壊
    //     : ctx.fillやctx.stroke等の描画はできる、操作は不可能
    //     : 操作をしたら実行時エラーでドボンなのでご注意ください
    Object.setPrototypeOf(path, readonlyProto);
    Object.freeze(path);
    // ちなみに、Path2D.prototype.rect.call(nullPath, 100, 100, 100, 100);は通る
    // だけどそこまでやるなら普通にnew Path2Dしたほうが早いし、そこまでやる奴は破壊したいだけだよ
    return path;
}

/**
 * 空のPath2Dオブジェクト
 * 変更不能
 */
export const nullPath = freezePath(new Path2D());

/**
 * 空のArrayオブジェクト
 * 変更不能
 * @type {readonly []}
 */
export const nullArray = Object.freeze([]);

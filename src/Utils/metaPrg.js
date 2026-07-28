/**
 * オブジェクトインスタンスからnewできるクラスタイプを取得する
 *
 * @remarks ただし、推論は雑なabstract型になる
 *
 * 本物の型が欲しければ classOf< typeof Circle >(new Circle()) みたいにジェネリクス指定が必要
 * JSDocの場合は/** @ type {typeof Circle} * / (classOf(new Circle()))になる
 * @template {abstract new (...args: any) => any} T
 * @param {InstanceType<T>} obj
 */
export function classOf(obj) {
    // obj.constructorがtypeof typeof objを返してくれたらいいのに！！
    return /** @type {T} */ (/** @type {any} */ (obj.constructor));
}
// JSDocのあちこちにスペースが挟まってるのは、例がJSDocとして解釈されないための回避策

/**
 * @template T
 * @param {T} obj
 * @param {keyof T} prop
 */
export function getDesctiptor(obj, prop) {
    let searchTarget = obj;
    while (searchTarget !== null) {
        const descriptor = Object.getOwnPropertyDescriptor(searchTarget, prop);
        if (descriptor !== undefined) {
            return descriptor;
        }
        // getOwnPropertyDescriptorはOwnしか見ないので、プロトタイプを追ってくれない なので自力で追う
        searchTarget = Object.getPrototypeOf(searchTarget);
    }
}

// 型ガード関数まで始めちゃったらTSだろ
/**
 * @template T
 * @param {readonly T[]} arr
 * @param {any} item
 * @returns {item is T}
 */
export function includes(arr, item) {
    // includesの型が少々早すぎる
    return arr.includes(item);
}

// FIXME: get-onlyプロパティは弾くことができてない アニメーションのターゲットにしたら実行時エラーでドボン
/**
 * @template T
 * @typedef {{
 *   [K in keyof T]: T[K] extends Function ? never : K extends string ? K : never
 * }[keyof T]} Properties
 */

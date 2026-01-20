import { fnv1a64 } from "../../Utils/hash.js";

/**
 * @typedef {{
 *   width: number
 *   height: number
 *   pixelCount: number
 *   hash: bigint
 * }} ImageInfo
 */

const performance = window.performance;  // PERF: おまじないすぎてエグい window.performanceはgetter

/**
 * 画像キャッシュ管理のためのstaticクラス
 */
export class ImageCacheStore {
    /** @type {Map<bigint, {hash: bigint, bitmap: ImageBitmap, lastUsed: number}>} */
    static #cacheMap = new Map();
    /** @type {Map<bigint, Blob>} */
    static #hashBlobMap = new Map();
    static #loadedPixelCount = 0;

    /** @type {WeakMap<Blob, bigint>} */
    static #blobHash = new WeakMap();

    /** @type {Map<bigint, Promise<void | ImageBitmap>>} */
    static #inflight = new Map();

    /**
     * BlobをキーにするためFNV-1aハッシュを生成
     * @param {Blob} blob
     * @returns {Promise<bigint>}
     */
    static async hashBlob(blob) {
        const cachedHash = this.#blobHash.get(blob);
        if (cachedHash !== undefined) return cachedHash;

        const buf = await blob.arrayBuffer();
        const hash = fnv1a64(new Uint8Array(buf));
        this.#blobHash.set(blob, hash);
        return hash;
    }

    /**
     * @param {Blob} blob
     * @returns {Promise<ImageInfo>}
     */
    static async loadBlob(blob) {
        const hash = await this.hashBlob(blob);
        this.#hashBlobMap.set(hash, blob);

        const cache = this.#cacheMap.get(hash);

        const bitmap = cache?.bitmap ?? await this.loadImage(hash);

        const width = bitmap.width;
        const height = bitmap.height;

        const pixelCount = width * height;

        return {
            width: width,
            height: height,
            pixelCount: pixelCount,
            hash: hash
        };
    }

    /**
     * @param {bigint} hash
     */
    static async loadImage(hash) {
        const blob = this.#hashBlobMap.get(hash);

        if (blob === undefined)
            throw new Error("The blob associated with the hash was not found.");

        const bitmap = await createImageBitmap(blob);

        if (bitmap === undefined)
            throw new Error("Unable to decode data");

        this.#cacheMap.set(hash, {
            hash,
            bitmap,
            lastUsed: performance.now()
        });

        // PERF: 5000万pxまでは安全(~200MB)、設定で1億px(~400MB)かそれ以上に設定できるようしてあげようか
        this.#loadedPixelCount += bitmap.width * bitmap.height;

        if (this.#loadedPixelCount > 50_000_000) {
            const cacheEntries = Array.from(this.#cacheMap.values())
                .sort((a, b) => a.lastUsed - b.lastUsed);
            for (let i = 0; i < cacheEntries.length; i++) {
                this.evict(cacheEntries[i].hash);
                if (this.#loadedPixelCount < 50_000_000) break;
            }
        }

        return bitmap;
    }

    /**
     * 最終使用時刻を更新
     * @param {bigint} key
     */
    static touch(key) {
        const v = this.#cacheMap.get(key);
        if (v) v.lastUsed = performance.now();
    }

    /**
     * キャッシュをアンロード
     * @param {bigint} hash
     */
    static evict(hash) {
        const cache = this.#cacheMap.get(hash);

        if (cache === undefined) return;

        const bitmap = cache.bitmap

        bitmap.close();
        this.#cacheMap.delete(hash);

        this.#loadedPixelCount -= bitmap.width * bitmap.height;
    }

    /**
     * キャッシュがある場合はImageBitmapを返す
     * 無ければデコードを開始して終了
     * @param {bigint} hash
     * @returns {ImageBitmap?}
     */
    static getOrOrder(hash) {
        const cache = this.#cacheMap.get(hash);

        if (cache !== undefined) {
            this.touch(hash);
            return cache.bitmap;
        } else {
            if (!this.#inflight.has(hash)) {
                const p = this.loadImage(hash)
                    .catch((err) => {
                        console.warn("Image decode failed", err);
                    })
                    .finally(() => this.#inflight.delete(hash));
                this.#inflight.set(hash, p);
            }
            // PERF: nullが返るのは"仕様"、裏でデコードだけは回しとく
            //     : asyncでやるほど時間がかかる処理を1フレームをブロックしてやる方が間違い
            return null;
        }
    }
}

import { hashBlob } from "../../Utils/hash.js";

export class ImageInfo {
    // PERF: BlobやらURLやらをずっと持っておくのはメモリに優しくない これもLRU管理するべきかも
    /** @type {Map<string, Promise<Blob>>} */
    static #URLBlob = new Map();
    /** @type {Map<bigint, Promise<string>>} */
    static #hashURL = new Map();
    /** @type {Map<bigint, ImageInfo>} */
    static #hashImageInfo = new Map();
    static #loadedPixelCount = 0;

    static #current = 0;

    /** @type {Promise<ImageBitmap>?} */
    #loadingPromise = null;

    #url;
    #blob;
    /** @type {ImageBitmap?} */
    #bitmap = null;
    #width = 0;
    #height = 0;
    #pixelCount = 0;
    #lastTouched = 1;

    // 参考: https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Classes/Private_elements#プライベートコンストラクターをシミュレーション
    static #constructing = false;
    /**
     * @param {string} url
     * @param {Blob} blob
     */
    constructor(url, blob) {
        if (!ImageInfo.#constructing) {
            throw new TypeError("ImageInfo is not constructible.");
        }
        ImageInfo.#constructing = false;

        this.#url = url;
        this.#blob = blob;
    }

    get width() { return this.#width; }
    get height() { return this.#height; }

    /**
     * @param {string} url
     */
    static async fromURL(url) {
        const blob = await this.#URLBlob.getOrInsertComputed(url, () => fetchBlob(url));
        const hash = await hashBlob(blob);

        const cache = this.#hashImageInfo.get(hash);
        if (cache !== undefined) {
            await cache.#loadImage();  // できたてほやほや or LRUで飛ばされたあとの可能性がある
            return cache;
        }

        if (url.startsWith("blob:")) {
            // blobスキームは一度きりの存在なので、シリアライズできるようにdataスキームにしておく
            // PERF: そりゃ重いよ？だけどデコード済み画像が大量にある時点で既にオワなのさ
            url = await this.#hashURL.getOrInsertComputed(hash, () => blobToDataURL(blob));
        }
        this.#constructing = true;
        const imageInfo = new ImageInfo(url, blob);
        this.#hashImageInfo.set(hash, imageInfo);

        await imageInfo.#loadImage();

        return imageInfo;
    }

    /**
     * キャッシュをアンロード
     */
    evict() {
        const bitmap = this.#bitmap;
        if (bitmap === null) return;

        this.#bitmap = null;
        bitmap.close();

        ImageInfo.#loadedPixelCount -= this.#pixelCount;
    }

    async #loadImage() {
        this.#lastTouched = ImageInfo.#current++;

        if (this.#bitmap) return;

        if (this.#loadingPromise !== null) {
            await this.#loadingPromise;  // 待機だけする
            return;
        }

        const promise = createImageBitmap(this.#blob).then((bitmap) => {
            if (bitmap === undefined) throw new Error("Unable to decode data");
            return bitmap;
        }).finally(() => this.#loadingPromise = null);

        this.#loadingPromise = promise;

        const bitmap = await promise;

        const { width, height } = bitmap;
        const pixelCount = width * height;

        ImageInfo.#loadedPixelCount += pixelCount;
        this.#bitmap = bitmap;
        this.#width = width;
        this.#height = height;
        this.#pixelCount = pixelCount;

        if (ImageInfo.#loadedPixelCount > 50_000_000) {
            const cacheEntries = Array.from(ImageInfo.#hashImageInfo.values())
                .sort((a, b) => a.#lastTouched - b.#lastTouched);
            for (let i = 0; i < cacheEntries.length; i++) {
                cacheEntries[i].evict();
                if (ImageInfo.#loadedPixelCount < 50_000_000) break;
            }
        }
    }

    /**
     * キャッシュがある場合はImageBitmapを返す
     * 無ければデコードを開始して終了
     * @returns {ImageBitmap?}
     */
    getOrOrder() {
        this.#lastTouched = ImageInfo.#current++;

        const bitmap = this.#bitmap;
        if (bitmap !== null) return bitmap;

        // PERF: nullが返るのは"仕様"、裏でデコードだけは回しとく
        //     : asyncでやるほど時間がかかる処理を1フレームをブロックしてやる方が間違い
        this.#loadImage().catch((err) => console.warn(err));
        return null;
    }

    toJSON() {
        return {
            type: ImageInfo.name,
            url: this.#url
        };
    }
}

/**:
 * @param {string} url
 */
async function fetchBlob(url) {
    const r = await fetch(url);
    return await r.blob();
}

/**
 * @param {Blob} blob
 */
function blobToDataURL(blob) {
    const reader = new FileReader();

    /** @type {Promise<string>} */
    const p = new Promise(resolve => {
        reader.onload = () => {
            const result = reader.result;
            const resultString = typeof result === "string" ? result : "data:,";  // 空データを表すdata URLでお茶を濁す
            resolve(resultString);
        };
    });

    reader.readAsDataURL(blob);
    return p;
}

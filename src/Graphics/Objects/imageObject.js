import { Anchor } from "../anchor.js";
import { DrawNode } from "../drawNode.js";
import { DrawObject } from "../drawObject.js";
import { ImageCacheStore } from "./imageCacheStore.js";

/**
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @import { DrawObjectOptions } from "@core/Graphics/drawObject.js"
 * @import { ImageInfo } from "./imageCacheStore.js";
 * @typedef {DrawObjectOptions & {
 *   fps?: number
 *   imageAlign?: Anchor
 *   imageSmoothing?: boolean
 *   loop?: boolean
 *   image?: Blob
 * }} ImageObjectOptions
 * @typedef {DrawNodeOptions & {
 *   hash: bigint | null
 *   offsetX: number
 *   offsetY: number
 *   imageSmoothing: boolean
 * }} ImageNodeOptions
 */

/**
 * @extends {DrawObject<ImageNode>}
 */
export class ImageObject extends DrawObject {
    #fps; // 0 = static
    #imageAlign;
    #imageSmoothing;
    #loop;

    /** @type {ImageInfo[]} */
    #images = [];

    #frameCount = 0;
    #length = Number.MAX_VALUE;

    /**
     * @param {ImageObjectOptions} options
     */
    constructor(options = {}) {
        super(options);

        super.width = 0;
        super.height = 0;

        this.#fps = options.fps ?? 0;
        this.#imageAlign = options.imageAlign ?? Anchor.topLeft;
        this.#imageSmoothing = options.imageSmoothing ?? true;
        this.#loop = options.loop ?? true;

        if (options.image != undefined) {
            // awaitじゃないため不安定 できればawait ImageObject.load(blobs)でちゃんとロードして欲しい
            this.load([options.image]);
        }

        this.#updateTimeInfo();
    }

    get timed() { return super.timed; }
    set timed(_) { }

    get width() { return super.width; }
    set width(_) { }

    get height() { return super.height; }
    set height(_) { }

    get fps() { return this.#fps; }
    set fps(value) {
        if (this.#fps === value) return;

        this.#fps = value;
        this.#updateTimeInfo();
        this.requestRecreate("object");
    }

    get imageAlign() { return this.#imageAlign; }
    set imageAlign(value) {
        if (this.#imageAlign.x === value.x
            && this.#imageAlign.y === value.y
        ) return;

        this.#imageAlign = value;
        this.requestRecreate("object");
    }

    get imageSmoothing() { return this.#imageSmoothing; }
    set imageSmoothing(value) {
        if (this.#imageSmoothing === value) return;

        this.#imageSmoothing = value;
        this.requestRecreate("object");
    }

    get loop() { return this.#loop; }
    set loop(value) {
        if (this.#loop === value) return;

        this.#loop = value;
        this.requestRecreate("object");
    }

    #updateTimeInfo() {
        this.#length = (this.#fps > 0 && this.#frameCount > 0)
            ? (this.#frameCount / this.#fps) * 1000
            : Number.MAX_VALUE;  // ms単位
        super.timed = this.#frameCount > 1 && this.fps != 0;
    }

    /**
     * @param {Blob[]} blobs
     */
    async load(blobs) {
        if (blobs.length === 0) {
            this.#images = [];
            this.#frameCount = 0;
            super.width = 0;
            super.height = 0;
            this.#updateTimeInfo();
            this.requestRecreate("object");
            return;
        }

        const images = await Promise.all(
            blobs.map(blob => ImageCacheStore.loadBlob(blob))
        )

        super.width = Math.max(...images.map(image => image.width));
        super.height = Math.max(...images.map(image => image.height));

        this.#images = images;
        this.#frameCount = images.length;

        this.#updateTimeInfo();
        this.requestRecreate("object");
    }

    /**
     * @param {number} t
     */
    calculateOptions(t) {
        const options = super.calculateOptions(t);

        if (this.#frameCount === 0) {
            return {
                ...options,
                hash: null,
                offsetX: 0,
                offsetY: 0,
                imageSmoothing: false
            }
        }

        const time = this.#loop ? t % (this.#length) : t;

        const frameIndex = Math.max(Math.min(
            Math.floor(this.#frameCount * (time / this.#length)),
            this.#frameCount - 1
        ), 0);

        const imageInfo = this.#images[frameIndex];

        const offsetX = (this.width - imageInfo.width) * this.#imageAlign.x;
        const offsetY = (this.height - imageInfo.height) * this.#imageAlign.y;

        return {
            ...options,
            hash: imageInfo.hash,
            offsetX: offsetX,
            offsetY: offsetY,
            imageSmoothing: this.imageSmoothing
        };
    }

    /**
     * @param {number} t
     */
    createSnapshot(t) {
        const options = this.calculateOptions(t);

        return this.cachedNode?.with(options) ??  new ImageNode(options);
    }

    get perfectlyOptimized() { return this.constructor === ImageObject; }
}

/**
 * @extends {DrawNode<ImageNodeOptions>}
 */
class ImageNode extends DrawNode {
    #hash;
    #offsetX;
    #offsetY;
    #imageSmoothing;

    /**
     * @param {ImageNodeOptions} options
     * @param {ImageNode?} oldNode
     */
    constructor(options, oldNode = null) {
        super(options, oldNode);

        this.#hash = options.hash;
        this.#offsetX = options.offsetX;
        this.#offsetY = options.offsetY;
        this.#imageSmoothing = options.imageSmoothing;
    }

    /**
     * @param {Partial<ImageNodeOptions>} options
     */
    with(options) {
        return new ImageNode({...this.options, ...options}, this)
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        if (this.#hash === null)
            return

        const bitmap = ImageCacheStore.getOrOrder(this.#hash);
        if (bitmap !== null) {
            ctx.imageSmoothingEnabled = this.#imageSmoothing;
            ctx.drawImage(bitmap, this.#offsetX, this.#offsetY);
        } else {
            // プレースホルダー もうちょっと圧少なめでも良いかも
            ctx.fillStyle = "#0ff4";
            ctx.fillRect(0, 0, this.width, this.height);

            ctx.strokeStyle = "#f00f";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.rect(0.5, 0.5, this.width - 1, this.height - 1);
            ctx.lineTo(this.width - 1, this.height - 1);
            ctx.closePath();
            ctx.stroke();
        };
    }
}

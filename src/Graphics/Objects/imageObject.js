import { Anchor } from "../anchor.js";
import { DrawNode } from "../drawNode.js";
import { DrawObject } from "../drawObject.js";
import { classOf } from "../../Utils/metaPrg.js";

/**
 * @import { Vector2 } from "@core/Graphics/vector2.js";
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @import { DrawObjectOptions } from "@core/Graphics/drawObject.js"
 * @import { ImageInfo } from "./imageInfo.js";
 * @typedef {DrawObjectOptions & {
 *   fps?: number
 *   imageAlign?: Readonly<Vector2>
 *   imageSmoothing?: boolean
 *   loop?: boolean
 *   images?: ImageInfo[]
 * }} ImageObjectOptions
 * @typedef {DrawNodeOptions & {
 *   imageInfo: ImageInfo | null
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
    constructor({
        fps = 0,
        imageAlign = Anchor.topLeft,
        imageSmoothing = true,
        loop = true,
        images = [],
        ...options
    } = {}) {
        super(options);

        super.timed = true;
        super.width = 0;
        super.height = 0;

        this.#fps = fps;
        this.#imageAlign = imageAlign;
        this.#imageSmoothing = imageSmoothing;
        this.#loop = loop;

        this.load(images);

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
        this.requestRecreate(this, "object");
    }

    get imageAlign() { return this.#imageAlign; }
    set imageAlign(value) {
        if (this.#imageAlign.equals(value)) return;

        this.#imageAlign = value;
        this.requestRecreate(this, "object");
    }

    get imageSmoothing() { return this.#imageSmoothing; }
    set imageSmoothing(value) {
        if (this.#imageSmoothing === value) return;

        this.#imageSmoothing = value;
        this.requestRecreate(this, "object");
    }

    get loop() { return this.#loop; }
    set loop(value) {
        if (this.#loop === value) return;

        this.#loop = value;
        this.requestRecreate(this, "object");
    }

    #updateTimeInfo() {
        this.#length = (this.#fps > 0 && this.#frameCount > 0)
            ? (this.#frameCount / this.#fps) * 1000
            : Number.MAX_VALUE;  // ms単位
        super.timed = this.#frameCount > 1 && this.fps !== 0;
    }

    /**
     * @param {ImageInfo[]} images
     */
    load(images) {
        if (images.length === 0) {
            this.#images = [];
            this.#frameCount = 0;
            super.width = 0;
            super.height = 0;
            this.#updateTimeInfo();
            this.requestRecreate(this, "object");
            return;
        }

        super.width = Math.max(...images.map(image => image.width));
        super.height = Math.max(...images.map(image => image.height));

        this.#images = images.slice();  // 自分のものにする
        this.#frameCount = images.length;

        this.#updateTimeInfo();
        this.requestRecreate(this, "object");
    }

    /**
     * @param {number} t
     * @returns {ImageNodeOptions}
     */
    calculateOptions(t) {
        const baseOptions = super.calculateOptions(t);

        const time = this.#loop ? t % (this.#length) : t;
        const frameIndex = Math.max(Math.min(
            Math.floor(this.#frameCount * (!isNaN(time) ? time / this.#length : 0)),
            this.#frameCount - 1
        ), 0);

        const imageInfo = this.#images[frameIndex];

        if (imageInfo === undefined) {
            const options = Object.assign(baseOptions, {
                imageInfo: null,
                offsetX: 0,
                offsetY: 0,
                imageSmoothing: false
            });
            return options;
        }

        if (this.cachedNode?.options.imageInfo !== imageInfo) {
            this.requestRecreate(this, "object");
        }

        const offsetX = (this.width - imageInfo.width) * this.#imageAlign.x;
        const offsetY = (this.height - imageInfo.height) * this.#imageAlign.y;

        const options = Object.assign(baseOptions, {
            imageInfo: imageInfo,
            offsetX: offsetX,
            offsetY: offsetY,
            imageSmoothing: this.#imageSmoothing
        });

        return options;
    }

    /**
     * @param {number} t
     */
    updateNode(t) {
        const options = this.calculateOptions(t);

        const node = this.cachedNode ?? new ImageNode();
        node.read(options);

        return node;
    }

    isPerfectlyOptimized() { return classOf(this) === ImageObject; }
}

/**
 * @extends {DrawNode<ImageNodeOptions>}
 */
class ImageNode extends DrawNode {
    /** @type {ImageInfo?} */
    #imageInfo = null;
    #offsetX = 0;
    #offsetY = 0;
    #imageSmoothing = true;

    /**
     * @returns {ImageNodeOptions}
     */
    createDefaultOptions() {
        return Object.assign(super.createDefaultOptions(), {
            imageInfo: null,
            offsetX: 0,
            offsetY: 0,
            imageSmoothing: true
        });
    }

    /**
     * @param {Readonly<ImageNodeOptions>} options
     */
    read(options) {
        const { imageInfo, offsetX, offsetY, imageSmoothing } = options;

        this.#imageInfo = imageInfo;
        this.#offsetX = offsetX;
        this.#offsetY = offsetY;
        this.#imageSmoothing = imageSmoothing;

        const tOpt = this.options;
        tOpt.imageInfo = imageInfo;
        tOpt.offsetX = offsetX;
        tOpt.offsetY = offsetY;
        tOpt.imageSmoothing = imageSmoothing;

        super.read(options);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        const bitmap = this.#imageInfo?.getOrOrder();
        if (bitmap !== null && bitmap !== undefined) {
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

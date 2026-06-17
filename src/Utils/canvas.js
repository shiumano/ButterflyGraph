/**
 * @import { Canvas, SKRSContext2D } from "@napi-rs/canvas";
 * @typedef { HTMLCanvasElement | OffscreenCanvas | Canvas } AnyCanvas
 */

/** @type {(width: number, height: number) => AnyCanvas} */
let createCanvas = (width, height) => new OffscreenCanvas(width, height);

if (typeof OffscreenCanvas === "undefined") {
    const nodeCanvas = await import("@napi-rs/canvas");
    createCanvas = nodeCanvas.createCanvas;
    // これでもダメなら知ったことではない
}

export { createCanvas };

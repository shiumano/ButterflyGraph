/**
 * @import { GenericDrawObject } from "@core/Graphics/drawObject.js"
 * @typedef {"click" | "pointermove" | "pointerdown" | "pointerup"} SupportedEvents
 */

import { ElementRectCache } from "./elementRectCache.js";
import { PositionCalculator } from "./positionCalculator.js";

export class InputHandler {
    #canvas;
    #target;

    #rectCache;

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {GenericDrawObject} target
     */
    constructor(canvas, target) {
        this.#canvas = canvas;
        this.#rectCache = ElementRectCache.getCache(canvas);

        this.#target = target;
    }

    /**
     * @param {SupportedEvents} type
     * @param {(lx: number, ly: number, px: number, py: number) => void} listener
     */
    addListener(type, listener) {
        this.#canvas.addEventListener(type, (ev) => {
            if (type === "pointerdown") {
                // お節介ではあるが、あって困ることのほうが少ないんじゃないかな
                this.#canvas.setPointerCapture(ev.pointerId);
            }

            const { rect, dpr } = this.#rectCache;
            const canvasX = (ev.clientX - rect.left) * dpr;
            const canvasY = (ev.clientY - rect.top) * dpr;

            const target = this.#target;
            const parent = target.parent;

            const { x: lx, y: ly } = PositionCalculator.getLocalPos(this.#target, canvasX, canvasY);
            const { x: px = 0, y: py = 0 } = parent !== null ? PositionCalculator.getLocalPos(parent, canvasX, canvasY) : {};

            listener(lx, ly, px, py);
        });
    }
}

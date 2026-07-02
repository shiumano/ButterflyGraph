import { DrawObject } from "../../Graphics/drawObject.js";
import { DrawNode } from "../../Graphics/drawNode.js";
import { TestScene } from "./testScene.js";
import { Anchor } from "../../Graphics/anchor.js";
import { degreeToRadian, direct } from "../../Utils/unitConversion.js";

export class CustomObjectTestScene extends TestScene {
    async load() {
        const obj = new Butterfly({
            anchor: Anchor.centre,
            origin: Anchor.centre,
            width: 220, height: 160,
        });

        this.addBindSlider("X position", -500, 500, obj, "x", direct);
        this.addBindSlider("Y position", -500, 500, obj, "y", direct);
        this.addBindSlider("Rotation", -360, 360, obj, "rotation", degreeToRadian);
        this.addBindSlider("Width", 10, 500, obj, "width", direct);
        this.addBindSlider("Height", 10, 500, obj, "height", direct);
        this.addBindSlider("X scale", 0.1, 10, obj, "scaleX", direct);
        this.addBindSlider("Y scale", 0.1, 10, obj, "scaleY", direct);
        this.addBindToggle("Dark theme", obj, "dark", value => value);
        this.addBindToggle("Show bounds", obj, "showBounds", value => value);

        this.root.addChild(obj);
    }
}

/**
 * @import { DrawObjectOptions } from "@core/Graphics/drawObject.js"
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @typedef { DrawObjectOptions & {
 *   dark?: boolean
 * }} ButterflyOptions
 * @typedef {DrawNodeOptions & {
 * }} ButterflyNodeOptions
 */

/**
 * @extends {DrawObject<ButterflyNode>}
 */
class Butterfly extends DrawObject {
    #dark;

    /**
     * @param {ButterflyOptions} options
     */
    constructor(options) {
        super(options);

        this.#dark = options.dark ?? true;
    }

    get timed() { return false; }
    set timed(_) { }

    get dark() { return this.#dark; }
    set dark(value) {
        if (this.#dark === value) return;

        this.#dark = value;
        this.requestRecreate(this, "object");
    }

    /**
     * @param {number} t
     * @returns {ButterflyNodeOptions}
     */
    calculateOptions(t) {
        const options = super.calculateOptions(t);
        return {
            ...options,
            fillStyle: this.dark ? "#A78BFA" : "#6A5ACD",
            strokeStyle: this.dark ? "#F5F7FA" : "#111"
        };
    }

    /**
     * @param {number} t
     */
    createSnapshot(t) {
        const options = this.calculateOptions(t);
        return this.cachedNode?.with(options) ?? new ButterflyNode(options);
    }

    isPerfectlyOptimized() { return this.constructor === Butterfly; }
}

/**
 * @extends {DrawNode<ButterflyNodeOptions>}
 */
class ButterflyNode extends DrawNode {
    /** @type {Path2D} */
    #nodesPath;
    /** @type {Path2D} */
    #bodyPath;
    /** @type {Path2D} */
    #strokePath;
    /**
     * @param {ButterflyNodeOptions} options
     * @param {ButterflyNode?} oldNode
     */
    constructor(options, oldNode = null) {
        super(options, oldNode);

        if (
            oldNode instanceof ButterflyNode &&
            oldNode.width === options.width &&
            oldNode.height === options.height
        ) {
            this.#nodesPath = oldNode.#nodesPath;
            this.#bodyPath = oldNode.#bodyPath;
            this.#strokePath = oldNode.#strokePath;
        } else {
            const ws = this.width / 160;  // width scale
            const hs = this.height / 110;  // height scale

            const nodesPath = new Path2D();
            nodesPath.arc(42 * ws, 52 * hs, 4, 0, Math.PI * 2);
            nodesPath.moveTo(60 * ws, 58 * hs);
            nodesPath.arc(60 * ws, 58 * hs, 4, 0, Math.PI * 2);
            nodesPath.moveTo(40 * ws, 66 * hs);
            nodesPath.arc(40 * ws, 66 * hs, 4, 0, Math.PI * 2);
            nodesPath.moveTo(118 * ws, 52 * hs);
            nodesPath.arc(118 * ws, 52 * hs, 4, 0, Math.PI * 2);
            nodesPath.moveTo(100 * ws, 58 * hs);
            nodesPath.arc(100 * ws, 58 * hs, 4, 0, Math.PI * 2);
            nodesPath.moveTo(120 * ws, 66 * hs);
            nodesPath.arc(120 * ws, 66 * hs, 4, 0, Math.PI * 2);

            const bodyPath = new Path2D();
            bodyPath.roundRect(78 * ws, 30 * hs, 4 * ws, 36 * hs, 2);

            const strokePath = new Path2D();
            strokePath.moveTo(98 * ws, 18 * hs);
            strokePath.bezierCurveTo(92 * ws, 15 * hs, 82 * ws, 20 * hs, 80 * ws, 30 * hs);
            strokePath.bezierCurveTo(78 * ws, 20 * hs, 68 * ws, 15 * hs, 62 * ws, 18 * hs);
            strokePath.moveTo(76 * ws, 70 * hs);
            strokePath.bezierCurveTo(68 * ws, 85 * hs, 53 * ws, 110 * hs, 30 * ws, 105 * hs);
            strokePath.bezierCurveTo(15 * ws, 100 * hs, 25 * ws, 80 * hs, 48 * ws, 70 * hs);
            strokePath.bezierCurveTo(20 * ws, 65 * hs, 0 * ws, 40 * hs, 5 * ws, 20 * hs);
            strokePath.bezierCurveTo(10 * ws, -5 * hs, 40 * ws, 0 * hs, 70 * ws, 40 * hs);
            strokePath.closePath();
            strokePath.moveTo(84 * ws, 70 * hs);
            strokePath.bezierCurveTo(92 * ws, 85 * hs, 107 * ws, 110 * hs, 130 * ws, 105 * hs);
            strokePath.bezierCurveTo(145 * ws, 100 * hs, 135 * ws, 80 * hs, 112 * ws, 70 * hs);
            strokePath.bezierCurveTo(140 * ws, 65 * hs, 160 * ws, 40 * hs, 155 * ws, 20 * hs);
            strokePath.bezierCurveTo(150 * ws, -5 * hs, 120 * ws, 0 * hs, 90 * ws, 40 * hs);
            strokePath.closePath();
            strokePath.moveTo(42 * ws, 52 * hs);
            strokePath.lineTo(60 * ws, 58 * hs);
            strokePath.lineTo(40 * ws, 66 * hs);
            strokePath.moveTo(118 * ws, 52 * hs);
            strokePath.lineTo(100 * ws, 58 * hs);
            strokePath.lineTo(120 * ws, 66 * hs);

            this.#nodesPath = nodesPath;
            this.#bodyPath = bodyPath;
            this.#strokePath = strokePath;
        }
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        const fillStyle = ctx.fillStyle;
        ctx.fillStyle = ctx.strokeStyle;

        ctx.lineWidth = 2.6;
        ctx.lineCap = "round";
        ctx.lineJoin = "miter";
        ctx.fill(this.#bodyPath);
        ctx.stroke(this.#strokePath);

        ctx.fillStyle = fillStyle;
        ctx.fill(this.#nodesPath);
    }
}

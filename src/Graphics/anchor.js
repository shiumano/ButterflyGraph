import { Vector2 } from "./vector2.js";

/**
 * 矩形状の3x3の配置を表す
 */
export const Anchor = Object.freeze({
    topLeft: Vector2.newFreeze({ x: 0, y: 0 }),
    top: Vector2.newFreeze({ x: 0.5, y: 0 },),
    topRight: Vector2.newFreeze({ x: 1, y: 0 }),
    left: Vector2.newFreeze({ x: 0, y: 0.5 }),
    centre: Vector2.newFreeze({ x: 0.5, y: 0.5 }),
    right: Vector2.newFreeze({ x: 1, y: 0.5 }),
    bottomLeft: Vector2.newFreeze({ x: 0, y: 1 }),
    bottom: Vector2.newFreeze({ x: 0.5, y: 1 }),
    bottomRight: Vector2.newFreeze({ x: 1, y: 1 })
});

/** @type {ReadonlyArray<keyof typeof Anchor>} */
export const allAnchors = Object.freeze([
    "topLeft", "top", "topRight",
    "left", "centre", "right",
    "bottomLeft", "bottom", "bottomRight"
]);

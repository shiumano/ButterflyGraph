import { Vector2 } from "./vector2.js";

/**
 * 矩形状の3x3の配置を表す
 * @enum {Vector2}
 */
export const Anchor = Object.freeze({
    topLeft: new Vector2(0, 0, false),
    top: new Vector2(0.5, 0, false),
    topRight: new Vector2(1, 0, false),
    left: new Vector2(0, 0.5, false),
    centre: new Vector2(0.5, 0.5, false),
    right: new Vector2(1, 0.5, false),
    bottomLeft: new Vector2(0, 1, false),
    bottom: new Vector2(0.5, 1, false),
    bottomRight: new Vector2(1, 1, false)
});

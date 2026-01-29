import { AnimationTestScene } from "./animationTestScene.js";
import { CircleTestScene } from "./circleTestScene.js";
import { RectangleTestScene } from "./rectangleTestScene.js";
import { TextObjectTestScene } from "./textObjectTestScene.js";

/**
 * @import { TestScene } from "./testScene.js";
 */

/** @type {typeof TestScene[]} */
export const Scenes = [
    RectangleTestScene,
    CircleTestScene,
    TextObjectTestScene,
    AnimationTestScene,
];

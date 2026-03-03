import { AnimationTestScene } from "./animationTestScene.js";
import { BufferedContainerTestScene } from "./bufferedContainerTestScene.js";
import { CircleTestScene } from "./circleTestScene.js";
import { ContainerTestScene } from "./containerTestScene.js";
import { CustomObjectTestScene } from "./customObjectTestScene.js";
import { DonutTestScene } from "./donutTestScene.js";
import { ImageObjectTestScene } from "./imageObjectTestScene.js";
import { RectangleTestScene } from "./rectangleTestScene.js";
import { TextObjectTestScene } from "./textObjectTestScene.js";

/**
 * @import { TestScene } from "./testScene.js";
 */

/** @type {typeof TestScene[]} */
export const Scenes = [
    RectangleTestScene,
    CircleTestScene,
    DonutTestScene,
    TextObjectTestScene,
    ImageObjectTestScene,
    ContainerTestScene,
    BufferedContainerTestScene,
    AnimationTestScene,
    CustomObjectTestScene,
];

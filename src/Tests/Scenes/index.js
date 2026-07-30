import { AnimationTestScene } from "./animationTestScene.js";
import { BufferedContainerTestScene } from "./bufferedContainerTestScene.js";
import { CircleTestScene } from "./circleTestScene.js";
import { ContainerTestScene } from "./containerTestScene.js";
import { CustomObjectTestScene } from "./customObjectTestScene.js";
import { DonutTestScene } from "./donutTestScene.js";
import { FrameTestScene } from "./frameTestScene.js";
import { ImageObjectTestScene } from "./imageObjectTestScene.js";
import { RectangleTestScene } from "./rectangleTestScene.js";
import { TextObjectTestScene } from "./textObjectTestScene.js";
import { GradientTestScene } from "./gradientTestScene.js";
import { InheritedColorTestScene } from "./inheritedColorTestScene.js";
import { ComplexTreeTestScene } from "./complexTreeTestScene.js";
import { ParticleTestScene } from "./particleTestScene.js";
import { InputHandlerTestScene } from "./inputHandlerTestScene.js";
import { SerializeTestScene } from "./serializeTestScene.js";

/**
 * @import { TestScene } from "./testScene.js";
 */

/** @type {typeof TestScene[]} */
export const Scenes = [
    RectangleTestScene,
    CircleTestScene,
    DonutTestScene,
    FrameTestScene,
    TextObjectTestScene,
    ImageObjectTestScene,
    ContainerTestScene,
    BufferedContainerTestScene,
    GradientTestScene,
    AnimationTestScene,
    CustomObjectTestScene,
    InheritedColorTestScene,
    ComplexTreeTestScene,
    ParticleTestScene,
    InputHandlerTestScene,
    SerializeTestScene,
];

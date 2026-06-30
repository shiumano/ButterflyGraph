import { TestScene } from "./testScene.js";
import { Rectangle } from "../../Graphics/Shapes/rectangle.js";
import { Circle } from "../../Graphics/Shapes/circle.js";
import { LinearGradient } from "../../Graphics/Gradients/linearGradient.js";
import { Container } from "../../Graphics/Containers/container.js";
import { angleToHSLColor } from "../../Utils/unitConversion.js";
import { TextObject } from "../../Graphics/Objects/textObject.js";
import { Anchor } from "../../Graphics/anchor.js";


export class ComplexTreeTestScene extends TestScene {
    async load() {
        const baseContainer = new Container();
        const background = new Rectangle({
            fillStyle: new LinearGradient(
                0, 0, 0, 1000,
                [
                    { position: 0, color: "red" },
                    { position: 1, color: "blue" }
                ]
            ),
            width: 1000,  // すごく適当
            height: 1000,
        });
        baseContainer.addChild(background);

        const circlesContainer = new Container();
        for (let i = 0; i < 500; i++) {
            const circle = new Circle({
                fillStyle: angleToHSLColor(Math.random() * 360),
                radius: 10,
                x: Math.random() * 1000,
                y: Math.random() * 1000,
            });
            circlesContainer.addChild(circle);
        }
        circlesContainer.registerAnimationFor("x", (t) => Math.sin(t / 1000) * 50).to(1000000, 1000000);
        circlesContainer.registerAnimationFor("y", (t) => Math.cos(t / 1000) * 50).to(1000000, 1000000);
        baseContainer.addChild(circlesContainer);

        const rectanglesContainer = new Container();
        for (let i = 0; i < 500; i++) {
            const rectangle = new Rectangle({
                fillStyle: angleToHSLColor(Math.random() * 360),
                origin: Anchor.centre,
                width: 40,
                height: 20,
                x: Math.random() * 1000,
                y: Math.random() * 1000,
            });

            if (i < 50) {
                rectangle.registerAnimationFor("rotation", (t) => t / 1000).to(2000000, 1000000);
            }
            rectanglesContainer.addChild(rectangle);
        }
        rectanglesContainer.registerAnimationFor("x", (t) => -Math.sin(t / 1000) * 50).to(1000000, 1000000);
        rectanglesContainer.registerAnimationFor("y", (t) => Math.cos(t / 2000) * 50).to(1000000, 1000000);

        const nestedContainer = new Container();
        let currentContainer = nestedContainer;
        for (let i = 0; i < 2; i++) {
            const newContainer = new Container();
            currentContainer.addChild(newContainer);
            currentContainer = newContainer;
        }

        currentContainer.addChild(rectanglesContainer);

        const currentTimeText = new TextObject({
            text: "Current Time: 0",
            font: "20px Arial",
            fillStyle: "white",
            x: 10,
            y: 10,
        });
        currentTimeText.registerAnimationFor("text", (t) => `Current Time: ${t.toFixed(2)}`).to(1000000, 1000000);
        currentContainer.addChild(currentTimeText);

        baseContainer.addChild(nestedContainer);

        this.root.addChild(baseContainer);
    }
}

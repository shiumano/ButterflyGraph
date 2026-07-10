import { TestScene } from "./testScene.js";
import { Rectangle } from "../../Graphics/Shapes/rectangle.js";
import { Circle } from "../../Graphics/Shapes/circle.js";
import { LinearGradient } from "../../Graphics/Gradients/linearGradient.js";
import { Container } from "../../Graphics/Containers/container.js";
import { angleToHSLColor } from "../../Utils/unitConversion.js";
import { TextObject } from "../../Graphics/Objects/textObject.js";
import { Anchor } from "../../Graphics/anchor.js";
import { BufferedContainer } from "../../Graphics/Containers/bufferedContainer.js";


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

        const circlesContainer = new Container({
            width: 1000,
            height: 1000,
            clip: true,
        });
        for (let i = 0; i < 500; i++) {
            const circle = new Circle({
                fillStyle: angleToHSLColor(Math.random() * 360),
                radius: 10,
                x: Math.random() * 1000,
                y: Math.random() * 1000,
            });
            circlesContainer.addChild(circle);
        }

        const circlesBufferContainer = new BufferedContainer({
            width: 1000,
            height: 1000,
            visible: false
        });
        const circlesWrapContainer = new Container({ children: [circlesContainer, circlesBufferContainer] });
        circlesWrapContainer.animate("x", (t) => Math.sin(t / 1000) * 50).to(1000000, 1000000);
        circlesWrapContainer.animate("y", (t) => Math.cos(t / 1000) * 50).to(1000000, 1000000);
        baseContainer.addChild(circlesWrapContainer);

        const staticRectanglesContainer = new Container();
        const rectanglesContainer = new Container({ children: [staticRectanglesContainer] });
        for (let i = 0; i < 500; i++) {
            const rectangle = new Rectangle({
                fillStyle: angleToHSLColor(Math.random() * 360),
                origin: Anchor.centre,
                width: 40,
                height: 20,
                x: Math.random() * 1000,
                y: Math.random() * 1000,
            });

            if (i < 100) {
                rectangle.animate("rotation", (t) => t / 1000).to(2000000, 1000000);
                rectanglesContainer.addChild(rectangle);
            } else {
                // PERF: 子が動くと、Container全体でmapが起きる
                //     : 動かないものは動かないものContainerにまとめて、mapを限定しようね
                staticRectanglesContainer.addChild(rectangle);
            }
        }
        rectanglesContainer.animate("x", (t) => -Math.sin(t / 1000) * 50).to(1000000, 1000000);
        rectanglesContainer.animate("y", (t) => Math.cos(t / 2000) * 50).to(1000000, 1000000);

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
            autoSizeUpdate: false,
            x: 10,
            y: 10,
        });
        currentTimeText.animate("text", (t) => `Current Time: ${t.toFixed(2)}`).to(1000000, 1000000);
        currentContainer.addChild(currentTimeText);

        baseContainer.addChild(nestedContainer);

        this.addToggle("Buffer circles", false, (value) => {
            circlesBufferContainer.visible = value;
            if (value) {
                // Container同士が奪い合うのでこれで済む
                circlesBufferContainer.addChild(circlesContainer);
            } else {
                circlesWrapContainer.addChild(circlesContainer);
            }
        });
        this.addBindToggle("Check buffer redraw", circlesBufferContainer, "redrawRainbow", value => value);

        this.root.addChild(baseContainer);
    }
}

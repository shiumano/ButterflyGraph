import { Container } from "../../Graphics/Containers/container.js";
import { TestScene } from "./testScene.js";
import { Rectangle } from "../../Graphics/Shapes/rectangle.js";
import { Circle } from "../../Graphics/Shapes/circle.js";
import { TextObject } from "../../Graphics/Objects/textObject.js";
import { Frame } from "../../Graphics/Shapes/frame.js";
import { Donut } from "../../Graphics/Shapes/donut.js";

export class InheritedColorTestScene extends TestScene {
    async load() {
        const mainContainer = new Container({
            fillStyle: "red",
            strokeStyle: "blue",
            children: [
                new Rectangle({
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                }),
                new Circle({
                    x: 150,
                    y: 0,
                    radius: 50,
                }),
                new TextObject({
                    x: 300,
                    y: 0,
                    text: "Fill",
                    font: "100px Arial",
                }),
                new Frame({
                    x: 0,
                    y: 150,
                    width: 100,
                    height: 100,
                    lineWidth: 10,
                }),
                new Donut({
                    x: 150,
                    y: 150,
                    radius: 50,
                    lineWidth: 10,
                }),
                new TextObject({
                    x: 300,
                    y: 150,
                    text: "Stroke",
                    font: "100px Arial",
                    fill: false,
                    strokeWidth: 4,
                }),
                new TextObject({
                    x: 0,
                    y: 300,
                    text: "Hello, World!",
                    font: "100px Arial",
                    fill: true,
                    strokeWidth: 4,
                }),
            ],
        });

        this.addTextInput("Fill color", "red", (value) => {
            mainContainer.fillStyle = value;
        });
        this.addTextInput("Stroke color", "blue", (value) => {
            mainContainer.strokeStyle = value;
        });

        this.root.addChild(mainContainer);
    }
}

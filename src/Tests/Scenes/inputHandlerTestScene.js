import { TestScene } from "./testScene.js";
import { Anchor } from "../../Graphics/anchor.js";
import { Rectangle } from "../../Graphics/Shapes/rectangle.js";
import { Circle } from "../../Graphics/Shapes/circle.js";
import { Frame } from "../../Graphics/Shapes/frame.js";
import { Donut } from "../../Graphics/Shapes/donut.js";
import { TextObject } from "../../Graphics/Objects/textObject.js";
import { Container } from "../../Graphics/Containers/container.js";
import { InputHandler } from "../../Input/inputHandler.js";
import { degreeToRadian, direct } from "../../Utils/unitConversion.js";

export class InputHandlerTestScene extends TestScene {
    async load() {
        const displayText = new TextObject({
            x: 10, y: 10, color: "white", strokeStyle: "black",
            font: "20px sans-serif", strokeWidth: 2, autoSizeUpdate: false
        });

        const cursorCircle = new Circle({
            origin: Anchor.centre,
            color: "yellow",
            radius: 10
        });
        const cursorDonut = new Donut({
            origin: Anchor.centre,
            color: "purple",
            radius: 15, lineWidth: 2
        });
        const dragableRect = new Rectangle({
            width: 50, height: 50, color: "white"
        });

        const circleContainer = new Container({
            name: "cyan container",
            x: 50, y: 50,
            width: 200, height: 200,
            origin: Anchor.centre,
            children: [
                dragableRect,
                cursorCircle,
                new Frame({
                    width: 200, height: 200, strokeStyle: "cyan", lineWidth: 2
                })
            ]
        });
        const donutContainer = new Container({
            name: "lime container",
            x: 300, y: 50,
            width: 200, height: 200,
            origin: Anchor.centre,
            children: [
                cursorDonut,
                new Frame({
                    width: 200, height: 200, strokeStyle: "lime", lineWidth: 2
                })
            ]
        });
        const parentContainer = new Container({
            name: "pink container",
            x: 500, y: 500,
            width: 200, height: 200,
            origin: Anchor.centre,
            children: [
                circleContainer, donutContainer,
                new Frame({
                    width: 200, height: 200, strokeStyle: "pink", lineWidth: 2
                })
            ]
        });

        this.root.addChild(displayText, parentContainer);

        const circleInputHandler = new InputHandler(this.canvas, cursorCircle);
        const donutInputHandler = new InputHandler(this.canvas, cursorDonut);
        const rectInputHandler = new InputHandler(this.canvas, dragableRect);

        circleInputHandler.addListener("pointermove", (_, __, px, py) => {
            cursorCircle.x = px;
            cursorCircle.y = py;

            displayText.text = `Circle local pos... X: ${px.toFixed(2)}, Y: ${py.toFixed(2)}`;
        });

        donutInputHandler.addListener("pointermove", (_, __, px, py) => {
            cursorDonut.x = px;
            cursorDonut.y = py;
        });

        const rectStatus = { sx: 0, sy: 0, drag: false };
        rectInputHandler.addListener("pointerdown", (lx, ly) => {
            if (0 <= lx && lx < dragableRect.width && 0 <= ly && ly < dragableRect.height) {
                rectStatus.sx = lx;
                rectStatus.sy = ly;
                rectStatus.drag = true;
                dragableRect.color = "red";
            } else {
                dragableRect.color = "blue";
            }
        });
        rectInputHandler.addListener("pointermove", (_, __, px, py) => {
            if (rectStatus.drag) {
                dragableRect.x = px - rectStatus.sx;
                dragableRect.y = py - rectStatus.sy;
            }
        });
        rectInputHandler.addListener("pointerup", () => {
            rectStatus.drag = false;
            dragableRect.color = "white";
        });

        this.addBindSlider("Cyan container X", -500, 500, circleContainer, "x", direct);
        this.addBindSlider("Cyan container Y", -500, 500, circleContainer, "y", direct);
        this.addBindSlider("Cyan container Rotation", -180, 180, circleContainer, "rotation", degreeToRadian);
        this.addBindSlider("Cyan container Scale", -2, 2, circleContainer, "scale", direct);
        this.addBindSlider("Lime container X", -500, 500, donutContainer, "x", direct);
        this.addBindSlider("Lime container Y", -500, 500, donutContainer, "y", direct);
        this.addBindSlider("Lime container Rotation", -180, 180, donutContainer, "rotation", degreeToRadian);
        this.addBindSlider("Lime container Scale", -2, 2, donutContainer, "scale", direct);
        this.addBindSlider("Pink container X", -500, 500, parentContainer, "x", direct);
        this.addBindSlider("Pink container Y", -500, 500, parentContainer, "y", direct);
        this.addBindSlider("Pink container Rotation", -180, 180, parentContainer, "rotation", degreeToRadian);
        this.addBindSlider("Pink container Scale", -2, 2, parentContainer, "scale", direct);
    }
}

import { Container } from "../../Graphics/Containers/container.js";
import { TestScene } from "./testScene.js";
import { Circle } from "../../Graphics/Shapes/circle.js";
import { Rectangle } from "../../Graphics/Shapes/rectangle.js";
import { Anchor, allAnchors } from "../../Graphics/anchor.js";
import { degreeToRadian, direct } from "../../Utils/unitConversion.js";

export class ContainerTestScene extends TestScene {
    async load() {
        const testContainer = new Container({
            x: 200, y: 200,
            width: 500, height: 500,
            children: [
                new Circle({
                    x: 200, y: 50,
                    radius: 100, color: "red"
                }),
                new Rectangle({
                    x: 50, y: 100,
                    anchor: Anchor.left,
                    width: 150, height: 100,
                    color: "yellow"
                })
            ]
        });

        const greenRect = new Rectangle({
            x: -20, y: 0,
            anchor: Anchor.right,
            origin: Anchor.centre,
            width: 200, height: 200,
            color: "green"
        });
        testContainer.addChild(greenRect);

        this.addBindSlider("X position", -500, 500, testContainer, "x", direct);
        this.addBindSlider("Y position", -500, 500, testContainer, "y", direct);
        this.addBindSlider("Rotation", -360, 360, testContainer, "rotation", degreeToRadian);
        this.addBindSlider("Width", 0, 500, testContainer, "width", direct);
        this.addBindSlider("Height", 0, 500, testContainer, "height", direct);
        this.addBindSlider("X scale", 0, 10, testContainer, "scaleX", direct);
        this.addBindSlider("Y scale", 0, 10, testContainer, "scaleY", direct);
        this.addBindSlider("Alpha", 0, 1, testContainer, "alpha", direct);

        this.addBindSlider("Green rect X position", -500, 500, greenRect, "x", direct);
        this.addBindSlider("Green rect Y position", -500, 500, greenRect, "y", direct);
        this.addSelector("Green rect anchor", allAnchors, "topLeft", value => greenRect.anchor = Anchor[value]);
        this.addBindSlider("Green rect rotation", -360, 360, greenRect, "rotation", degreeToRadian);
        this.addBindSlider("Green rect alpha", 0, 1, greenRect, "alpha", direct);

        this.addBindToggle("Clipping", testContainer, "clip", value => value);
        this.addBindToggle("Show bounds", testContainer, "showBounds", value => value);

        /** @type {Circle[]} */
        const addedChild = [];
        this.addButton("Add child", () => {
            const circle = new Circle({
                x: Math.random() * 500, y: Math.random() * 500,
                radius: 50, color: "cyan"
            });
            testContainer.addChild(circle);
            addedChild.push(circle);
        });

        this.addButton("Remove child", () => {
            const circle = addedChild.pop();
            if (circle === undefined) return;
            testContainer.removeChild(circle);
        });

        this.root.addChild(testContainer);
    }
}

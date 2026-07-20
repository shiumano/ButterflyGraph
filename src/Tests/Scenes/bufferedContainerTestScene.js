import { Container } from "../../Graphics/Containers/container.js";
import { TestScene } from "./testScene.js";
import { Rectangle } from "../../Graphics/Shapes/rectangle.js";
import { Circle } from "../../Graphics/Shapes/circle.js";
import { Anchor } from "../../Graphics/anchor.js";
import { BufferedContainer } from "../../Graphics/Containers/bufferedContainer.js";
import { degreeToRadian, direct } from "../../Utils/unitConversion.js";

export class BufferedContainerTestScene extends TestScene {
    async load() {
        const rectOptions = {
            x: 50, y: 100,
            width: 100, height: 200,
            origin: Anchor.centre,
            color: "red"
        };
        const circleOptions = {
            x: 0, y: 100,
            radius: 150,
            color: "lime"
        };
        const lineOptions = {
            x: 0, y: 50,
            width: 200, height: 1,
            color: "white"
        };
        const rect1 = new Rectangle(rectOptions);
        const circle1 = new Circle(circleOptions);
        const line1 = new Rectangle(lineOptions);
        const bufferedContainer = new BufferedContainer({
            x: -200,
            width: 200, height: 200,
            anchor: Anchor.centre,
            origin: Anchor.centre,
            children: [rect1, circle1, line1]
        });

        const rect2 = new Rectangle(rectOptions);
        const circle2 = new Circle(circleOptions);
        const line2 = new Rectangle(lineOptions);
        const normalContainer = new Container({
            x: 200,
            width: 200, height: 200,
            anchor: Anchor.centre,
            origin: Anchor.centre,
            children: [rect2, circle2, line2]
        });

        const wrapContainer = new Container({
            anchor: Anchor.centre, children: [bufferedContainer, normalContainer]
        });

        this.addBindSlider("Resolution scale", 0.1, 2, bufferedContainer, "resolutionScale", direct);
        this.addSelector("Follow mode", ["none", "scale", "all"], bufferedContainer.follow, value => bufferedContainer.follow = value);
        this.addBindToggle("Supersize", bufferedContainer, "supersize", value => value);
        this.addBindToggle("Redraw rainbow", bufferedContainer, "redrawRainbow", value => value);
        this.addBindToggle("Image smoothing", bufferedContainer, "imageSmoothing", value => value);
        this.addSlider("Position offset", 0, 400, 400, value => {
            bufferedContainer.x = value / -2;
            normalContainer.x = value / 2;
        });
        this.addSlider("X Scale (both)", -1, 5, 1, value => {
            bufferedContainer.scaleX = value;
            normalContainer.scaleX = value;
        });
        this.addSlider("Y Scale (both)", -1, 5, 1, value => {
            bufferedContainer.scaleY = value;
            normalContainer.scaleY = value;
        });
        this.addSlider("Rotation (both)", -360, 360, 0, value => {
            const rad = degreeToRadian(value);
            bufferedContainer.rotation = rad;
            normalContainer.rotation = rad;
        });
        this.addToggle("Clipping (both)", false, value => {
            bufferedContainer.clip = value;
            normalContainer.clip = value;
        });
        this.addSlider("Alpha (both)", 0, 1, 1, value => {
            bufferedContainer.alpha = value;
            normalContainer.alpha = value;
        });
        this.addToggle("Show bounds (both)", false, value => {
            bufferedContainer.showBounds = value;
            normalContainer.showBounds = value;
        });
        this.addBindSlider("Scale X (Wrap container)", -1, 5, wrapContainer, "scaleX", direct);
        this.addBindSlider("Scale Y (Wrap container)", -1, 5, wrapContainer, "scaleY", direct);
        this.addButton("Animation child (both)", (ev) => {
            const t = this.toLocalTime(ev.timeStamp);

            rect1.animate("rotation", direct).jump(t).set(0).to(Math.PI * 2, 60000);
            rect2.animate("rotation", direct).jump(t).set(0).to(Math.PI * 2, 60000);
        });

        this.root.addChild(wrapContainer);
    }
}

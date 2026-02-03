import { Container } from "../../Graphics/Containers/container.js";
import { TestScene } from "./testScene.js";
import { Rectangle } from "../../Graphics/Shapes/rectangle.js";
import { Circle } from "../../Graphics/Shapes/circle.js";
import { Anchor } from "../../Graphics/anchor.js";
import { BufferedContainer } from "../../Graphics/Containers/bufferedContainer.js";
import { degreeToRadian, direct } from "../../Utils/unitConversion.js";

/**
 * @import { TestSceneOptions } from "./testScene.js"
 */

export class BufferedContainerTestScene extends TestScene {
    /**
     * @param {TestSceneOptions} options
     */
    constructor(options) {
        super(options);

        const rect1 = new Rectangle({
            width: 100, height: 200,
            color: "red"
        });
        const circle1 = new Circle({
            x: 0, y: 100,
            radius: 150,
            color: "lime"
        });
        const line1 = new Rectangle({
            x: 0, y: 50,
            width: 200, height: 1,
            color: "white"
        });
        const bufferedContainer = new BufferedContainer({
            x: -200,
            width: 200, height: 200,
            anchor: Anchor.centre,
            origin: Anchor.centre,
            children: [rect1, circle1, line1]
        });

        const rect2 = new Rectangle(rect1);  // これでオブジェクトプロパティをコピーしたオブジェクトを作れる 適当〜
        const circle2 = new Circle(circle1);
        const line2 = new Rectangle(line1);
        const normalContainer = new Container({
            x: 200,
            width: 200, height: 200,
            anchor: Anchor.centre,
            origin: Anchor.centre,
            children: [rect2, circle2, line2]
        });

        this.addBindSlider("Resolution scale", 0.1, 2, bufferedContainer, "resolutionScale", direct);
        this.addSelector("Follow mode", ["none", "scale", "all"], bufferedContainer.follow, value => bufferedContainer.follow = value);
        this.addBindToggle("Supersize", bufferedContainer, "supersize", value => value);
        this.addBindToggle("Redraw rainbow", bufferedContainer, "redrawRainbow", value => value);
        this.addSlider("Position offset", 0, 400, 400, value => {
            bufferedContainer.x = value / -2;
            normalContainer.x = value / 2;
        });
        this.addSlider("Scale (both)", 0.5, 5, 1, value => {
            bufferedContainer.scale = value;
            normalContainer.scale = value;
        });
        this.addSlider("Rotation (both)", -360, 360, 0, value => {
            const rad = degreeToRadian(value);
            bufferedContainer.rotation = rad;
            normalContainer.rotation = rad;
        });
        this.addSlider("Alpha (both)", 0, 1, 1, value => {
            bufferedContainer.alpha = value;
            normalContainer.alpha = value;
        });
        this.addToggle("Show bounds (both)", false, value => {
            bufferedContainer.showBounds = value;
            normalContainer.showBounds = value;
        });

        this.root.addChild(bufferedContainer, normalContainer);
    }

}

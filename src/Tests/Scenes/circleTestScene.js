import { TestScene } from "./testScene.js";
import { Anchor } from "../../Graphics/anchor.js";
import { Circle } from "../../Graphics/Shapes/circle.js";
import { direct } from "../../Utils/unitConversion.js";

/**
 * @import { TestSceneOptions } from "./testScene.js"
 */

export class CircleTestScene extends TestScene {
    circle;
    /**
     * @param {TestSceneOptions} options
     */
    constructor(options) {
        super(options);

        this.addChild(
            this.circle = new Circle({
                radius: 50,
                fillStyle: "red",
            })
        );

        this.addBindSlider("X Position", -500, 500, this.circle, "x", direct);
        this.addBindSlider("Y Position", -500, 500, this.circle, "y", direct);
        this.addBindSlider("Radius", 10, 200, this.circle, "radius", direct);

        this.addButton("Random Color", () => {
            this.circle.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
        });

        this.addBindToggle("Show bounding box", this.circle, "showBounds", v => v);

        this.addSelector("Anchor", ["topLeft", "top", "left", "centre", "right", "bottom"], "topLeft", value => this.circle.anchor = Anchor[value]);
    }
}

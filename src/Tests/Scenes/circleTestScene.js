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
                fillStyle: 'red',
            })
        );

        this.addBindSlider("X Position", -500, 500, this.circle, "x", direct);
        this.addBindSlider("Y Position", -500, 500, this.circle, "y", direct);
        this.addBindSlider("Radius", 10, 200, this.circle, "radius", direct);

        this.addButton("Random Color", () => {
            this.circle.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
        });

        this.addBindToggle("Show bounding box", this.circle, "showBounds", v => v);

        this.addSelector("Anchor", ["top left", "center", "left", "right", "top", "bottom"], "top left", (value) => {
            switch (value) {
                case "top left":
                    this.circle.anchor = Anchor.topLeft;
                    break;
                case "center":
                    this.circle.anchor = Anchor.centre;
                    break;
                case "left":
                    this.circle.anchor = Anchor.left;
                    break;
                case "right":
                    this.circle.anchor = Anchor.right;
                    break;
                case "top":
                    this.circle.anchor = Anchor.top;
                    break;
                case "bottom":
                    this.circle.anchor = Anchor.bottom;
                    break;
                default:
                    break;
            }
        });
    }
}

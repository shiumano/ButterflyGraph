import { Rectangle } from "../../Graphics/Shapes/rectangle.js";
import { TestScene } from "./testScene.js";
import { Anchor } from "../../Graphics/anchor.js";
import { degreeToRadian, direct } from "../../Utils/unitConversion.js";

/**
 * @import { TestSceneOptions } from "./testScene.js"
 */

export class RectangleTestScene extends TestScene {
    /**
     * @param {TestSceneOptions} options
     */
    constructor(options) {
        super(options);

        const rectangle = new Rectangle({
            width: 100,
            height: 100,
            color: "white"
        });

        this.addBindSlider("X position", -500, 500, rectangle, "x", direct);
        this.addBindSlider("Y position", -500, 500, rectangle, "y", direct);
        this.addBindSlider("Rotation", -360, 360, rectangle, "rotation", degreeToRadian);
        this.addBindSlider("Width", 0, 500, rectangle, "width", direct);
        this.addBindSlider("Height", 0, 500, rectangle, "height", direct);
        this.addBindSlider("X scale", 0, 10, rectangle, "scaleX", direct);
        this.addBindSlider("Y scale", 0, 10, rectangle, "scaleY", direct);
        this.addSelector("Anchor", Object.keys(Anchor), "topLeft", value => {
            for (const [key, anchor] of Object.entries(Anchor)) {
                if (key === value) {
                    rectangle.anchor = anchor;
                    return;
                }
            }
        });
        this.addSelector("Origin", ["topLeft", "top", "left", "centre", "right", "bottom"], "topLeft", value => rectangle.anchor = Anchor[value]);
        this.addBindSlider("Alpha", 0, 1, rectangle, "alpha", direct);
        this.addTextInput("Fill color", "white", value => rectangle.fillStyle = value);
        this.addBindToggle("Visible", rectangle, "visible", value => value);
        this.addBindToggle("Show bounds", rectangle, "showBounds", value => value);

        this.addChild(rectangle);
    }
}

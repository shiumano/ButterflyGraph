import { Rectangle } from "../../Graphics/Shapes/rectangle.js";
import { TestScene } from "./testScene.js";
import { Anchor, allAnchors } from "../../Graphics/anchor.js";
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
        this.addSelector("Anchor", allAnchors, "topLeft", value => rectangle.anchor = Anchor[value]);
        this.addSelector("Origin", allAnchors, "topLeft", value => rectangle.origin = Anchor[value]);
        this.addBindSlider("Alpha", 0, 1, rectangle, "alpha", direct);
        this.addTextInput("Fill color", "white", value => rectangle.fillStyle = value);
        this.addBindToggle("Visible", rectangle, "visible", value => value);
        this.addBindToggle("Show bounds", rectangle, "showBounds", value => value);

        this.root.addChild(rectangle);
    }
}

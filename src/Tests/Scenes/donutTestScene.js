import { direct } from "../../Utils/unitConversion.js";
import { Donut } from "../../Graphics/Shapes/donut.js";
import { TestScene } from "./testScene.js";

/**
 * @import { TestSceneOptions } from "./testScene.js"
 */

export class DonutTestScene extends TestScene {
    /**
     * @param {TestSceneOptions} options
     */
    constructor(options) {
        super(options);

        const donut = new Donut({
            x: 100,
            y: 100,
            radius: 50,
            lineWidth: 20,
            strokeStyle: "yellow",
        });

        this.addBindSlider("Radius", 0, 100, donut, "radius", direct);
        this.addBindSlider("Line Width", 0, 50, donut, "lineWidth", direct);

        this.root.addChild(donut);
    }
}

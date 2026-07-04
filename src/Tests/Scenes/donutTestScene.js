import { direct } from "../../Utils/unitConversion.js";
import { Donut } from "../../Graphics/Shapes/donut.js";
import { TestScene } from "./testScene.js";

export class DonutTestScene extends TestScene {
    async load() {
        const donut = new Donut({
            x: 100,
            y: 100,
            radius: 50,
            lineWidth: 20,
            strokeStyle: "yellow",
        });

        this.addBindSlider("X position", 0, 500, donut, "x", direct);
        this.addBindSlider("Y position", 0, 500, donut, "y", direct);
        this.addBindToggle("Show bounds", donut, "showBounds", value => value);
        this.addBindSlider("Radius", 0, 100, donut, "radius", direct);
        this.addBindSlider("Line Width", 0, 50, donut, "lineWidth", direct);

        this.root.addChild(donut);
    }
}

import { TestScene } from "./testScene.js";
import { Anchor, allAnchors } from "../../Graphics/anchor.js";
import { Circle } from "../../Graphics/Shapes/circle.js";
import { direct } from "../../Utils/unitConversion.js";

export class CircleTestScene extends TestScene {
    async load() {
        const circle = new Circle({
            radius: 50,
            fillStyle: "red",
        });

        this.addBindSlider("X Position", -500, 500, circle, "x", direct);
        this.addBindSlider("Y Position", -500, 500, circle, "y", direct);
        this.addBindSlider("Radius", 10, 200, circle, "radius", direct);

        this.addButton("Random Color", () => {
            circle.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
        });

        this.addBindToggle("Show bounding box", circle, "showBounds", v => v);

        this.addSelector("Anchor", allAnchors, "topLeft", value => circle.anchor = Anchor[value]);

        this.root.addChild(circle);
    }
}

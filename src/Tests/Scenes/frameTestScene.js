import { Frame } from "../../Graphics/Shapes/frame.js";
import { direct } from "../../Utils/unitConversion.js";
import { TestScene } from "./testScene.js";

export class FrameTestScene extends TestScene {
    async load() {
        const frame = new Frame({
            x: 100,
            y: 100,
            width: 200,
            height: 150,
            lineWidth: 10,
            strokeStyle: "red",
        });

        this.addBindSlider("Width", 0, 300, frame, "width", direct);
        this.addBindSlider("Height", 0, 300, frame, "height", direct);
        this.addBindSlider("Line Width", 0, 50, frame, "lineWidth", direct);

        this.root.addChild(frame);
    }
}

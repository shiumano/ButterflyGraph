import { direct } from "../../Utils/unitConversion.js";
import { allAnchors, Anchor } from "../../Graphics/anchor.js";
import { TextObject } from "../../Graphics/Objects/textObject.js";
import { TestScene } from "./testScene.js";

export class TextObjectTestScene extends TestScene {
    async load() {
        const textObj = new TextObject({
            anchor: Anchor.centre,
            origin: Anchor.centre,
            color: "cyan",
            strokeStyle: "magenta",
            text: "Hello ButterflyGraph!",
            font: "40px sans-serif"
        });

        this.addTextInput("Text", textObj.text, value => textObj.text = value);
        this.addTextInput("Font", textObj.font, value => textObj.font = value);
        this.addBindToggle("Fill", textObj, "fill", value => value);
        this.addBindSlider("Stroke width", 0, 10, textObj, "strokeWidth", direct);
        this.addBindSlider("Scale", 0.1, 20, textObj, "scale", direct);
        this.addBindToggle("Size reference -> font", textObj, "sizeReference", value => value ? "font" : "actual");
        this.addBindToggle("Auto size update", textObj, "autoSizeUpdate", value => value);
        this.addSelector("Origin", allAnchors, "centre", value => textObj.origin = Anchor[value]);
        this.addBindToggle("Show bounds", textObj, "showBounds", value => value);

        this.root.addChild(textObj);
    }
}

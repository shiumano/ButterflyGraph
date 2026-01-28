import { Anchor } from "../../Graphics/anchor.js";
import { TextObject } from "../../Graphics/Objects/textObject.js";
import { TestScene } from "./testScene.js";

export class TextObjectTestScene extends TestScene {
    /**
     * @param {HTMLElement} testArea
     * @param {HTMLElement} controlArea
     * @param {number} startTime
     */
    constructor(testArea, controlArea, startTime) {
        super(testArea, controlArea, startTime);

        const textObj = new TextObject({
            anchor: Anchor.centre,
            origin: Anchor.centre,
            color: "cyan",
            text: "Hello ButterflyGraph!",
        });

        this.addTextInput("Text", textObj.text, value => textObj.text = value);
        this.addTextInput("Font", textObj.font, value => textObj.font = value);
        this.addSlider("Scale", 0.1, 20, textObj.scale, value => textObj.scale = value);
        this.addToggle("Size reference -> font", textObj.sizeReference === "font", value => textObj.sizeReference = value ? "font" : "actual");
        this.addToggle("Show bounds", false, value => textObj.showBounds = value);

        this.addChild(textObj);
    }
}

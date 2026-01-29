import { direct } from "../../Utils/unitConversion.js";
import { Anchor } from "../../Graphics/anchor.js";
import { TextObject } from "../../Graphics/Objects/textObject.js";
import { TestScene } from "./testScene.js";

/**
 * @import { TestSceneOptions } from "./testScene.js"
 */

export class TextObjectTestScene extends TestScene {
    /**
     * @param {TestSceneOptions} options
     */
    constructor(options) {
        super(options);

        const textObj = new TextObject({
            anchor: Anchor.centre,
            origin: Anchor.centre,
            color: "cyan",
            text: "Hello ButterflyGraph!",
        });

        this.addTextInput("Text", textObj.text, value => textObj.text = value);
        this.addTextInput("Font", textObj.font, value => textObj.font = value);
        this.addBindSlider("Scale", 0.1, 20, textObj, "scale", direct);
        this.addToggle("Size reference -> font", textObj.sizeReference === "font", value => textObj.sizeReference = value ? "font" : "actual");
        this.addToggle("Show bounds", false, value => textObj.showBounds = value);

        this.addChild(textObj);
    }
}

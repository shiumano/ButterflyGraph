import { direct } from "../../Utils/unitConversion.js";
import { Anchor } from "../../Graphics/anchor.js";
import { ImageObject } from "../../Graphics/Objects/imageObject.js";
import { TestScene } from "./testScene.js";

/**
 * @import { TestSceneOptions } from "./testScene.js"
 */

const shidev_logo_data_base64 = `data:image/png;base64,
iVBORw0KGgoAAAANSUhEUgAAAGAAAAAgCAMAAADaHo1mAAAAElBMVEX/5eWqqqraAEkzMzONAMQW
/wDGjE4cAAAAuUlEQVR42tWW3Q7DIAiFq8j7PzB23ZCt4rJ17uKQ9iS9IEHx4yc0J7DyAtYjwAZU
CwAngIj1Y8YFEG4xgCkSxqZIQ/gA2enoUHlqtgyRXXTbpRbR6Nbt2jTDIGiCv1K0rqP9m4EFPGgC
TpHeLiKRXfQ+B7TrU1f5/nr5dC/vHUUwToH1jen4OJF5fSc8/z7wNTASpTo/QSm1ztUqimBuG/SN
0N/va2D2SAMnSGnZkNdf978otAYXJ7gD6MWqp36YXykAAAAASUVORK5CYII=`;

const shidevLogoBlob = await fetch(shidev_logo_data_base64).then(resp => resp.blob());

export class ImageObjectTestScene extends TestScene {
    /**
     * @param {TestSceneOptions} options
     */
    constructor(options) {
        super(options);

        const imageObj = new ImageObject({
            anchor: Anchor.centre,
            origin: Anchor.centre,
            image: shidevLogoBlob,
            scale: 5
        });

        this.addBindSlider("Scale", 0.5, 20, imageObj, "scale", direct);
        this.addBindSlider("Rotation", -10, 10, imageObj, "rotation", direct);
        this.addToggle("Image smoothing", imageObj.imageSmoothing, value => imageObj.imageSmoothing = value);

        this.addChild(imageObj);
    }
}

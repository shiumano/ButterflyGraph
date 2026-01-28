import { TestScene } from "./testScene.js";
import { Rectangle } from "../../Graphics/Shapes/rectangle.js";
import { direct } from "../../Utils/unitConversion.js";
import { TextObject } from "../../Graphics/Objects/textObject.js";
import { Anchor } from "../../Graphics/anchor.js";

export class AnimationTestScene extends TestScene {
    /**
     * @param {HTMLElement} testArea
     * @param {HTMLElement} controlArea
     * @param {number} startTime
     */
    constructor(testArea, controlArea, startTime) {
        super(testArea, controlArea, startTime);

        const rect = new Rectangle({
            width: 100,
            height: 100,
            fillStyle: 'blue',
        });
        const textObj = new TextObject({
            anchor: Anchor.topRight,
            origin: Anchor.topRight,
            text: "0",
            font: "40px serif",
            color: "white",
        });

        const xAnim = rect.registerAnimationFor("x", direct);
        xAnim.to(500, 2000).to(0, 2000).easeInOutQuad(500, 1500).delay(1000).set(0);

        const textAnim = textObj.registerAnimationFor("text", (v) => v.toFixed(2));
        textAnim.to(10000, 10000);

        this.addButton("Override animation", ev => {
            xAnim.jump(Math.max(0, ev.timeStamp - this.startTime)).set(0).easeOut(500, 500);
        })

        this.addChild(rect, textObj);
    }
}

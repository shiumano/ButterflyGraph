import { Container } from "../../Graphics/Containers/container.js";
import { Anchor } from "../../Graphics/anchor.js";
import { TestScene } from "./testScene.js";
import { degreeToRadian, direct } from "../../Utils/unitConversion.js";

/**
 * @import { TestSceneOptions } from "./testScene.js"
 * @import { IDrawNode } from "@core/Graphics/drawNode.js"
 * @import { IDrawObject } from "@core/Graphics/drawObject.js"
 */

export class MinimumImplementTestScene extends TestScene {
    /**
     * @param {TestSceneOptions} options
     */
    constructor(options) {
        super(options);

        const myObj = new MyObj();
        const container = new Container({
            width: 500, height: 500,
            anchor: Anchor.centre, origin: Anchor.centre,
            children: [myObj]
        });

        this.addBindSlider("Container X position", -500, 500, container, "x", direct);
        this.addBindSlider("Container Y position", -500, 500, container, "y", direct);
        this.addBindSlider("Container rotation", -360, 360, container, "rotation", degreeToRadian);
        this.addBindSlider("Object width", 0, 300, myObj, "width", direct);
        this.addBindSlider("Object height", 0, 300, myObj, "height", direct);
        this.addTextInput("Object color", myObj.color, value => myObj.color = value);

        this.root.addChild(container);
    }
}

/**
 * @implements {IDrawNode}
 * @implements {IDrawObject}
 */
class MyObj {
    anchor = Anchor.topLeft;
    zIndex = 0;
    parent = null;
    timed = false;
    animated = false;
    width = 200;
    height = 200;
    color = "yellow";

    // お前ら本当に必要なのか？？？
    requestRecreate() {}
    calculateAnimations() {}

    // スーパー雑実装
    getSnapshot() { return this; }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
        // 面倒でしょう？君もDrawNode<T>を継承しないかい？
    }
}

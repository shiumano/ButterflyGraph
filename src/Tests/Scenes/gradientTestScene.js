import { Circle } from "../../Graphics/Shapes/circle.js";
import { TestScene } from "./testScene.js";
import { RadialGradient } from "../../Graphics/Gradients/radialGradient.js";
import { LinearGradient } from "../../Graphics/Gradients/linearGradient.js";
import { ConicGradient } from "../../Graphics/Gradients/conicGradient.js";
import { Rectangle } from "../../Graphics/Shapes/rectangle.js";
import { degreeToRadian } from "../../Utils/unitConversion.js";

/**
 * @import { TestSceneOptions } from "./testScene.js";
 */

export class GradientTestScene extends TestScene {
    /**
     *
     * @param {TestSceneOptions} options
     */
    constructor(options) {
        super(options);

        const linearGradient = new LinearGradient(0, 0, 200, 200, [
            { position: 0, color: "yellow" },
            { position: 1, color: "blue" }
        ]);
        const radialGradient = new RadialGradient(
            100, 100, 0,
            100, 100, 100,
            [
                { position: 0, color: "blue" },
                { position: 1, color: "red" }
            ]
        );
        const conicGradient = new ConicGradient(0, 100, 100, [
            { position: 0, color: "red" },
            { position: 1, color: "yellow" }
        ]);

        const linearGradRect = new Rectangle({
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            fillStyle: linearGradient
        });

        const radialGradCircle = new Circle({
            x: 500,
            y: 100,
            radius: 100,
            fillStyle: radialGradient
        });

        const conicGradCircle = new Circle({
            x: 900,
            y: 100,
            radius: 100,
            fillStyle: conicGradient
        });

        const linearGradStartPos = { x: 100, y: 100 };
        this.addSlider("Linear gradient start X position", 0, 200, 0, (value) => {
            linearGradStartPos.x = value;
            linearGradient.setStart(linearGradStartPos.x, linearGradStartPos.y);
        });
        this.addSlider("Linear gradient start Y position", 0, 200, 0, (value) => {
            linearGradStartPos.y = value;
            linearGradient.setStart(linearGradStartPos.x, linearGradStartPos.y);
        });

        const radialGradInnerPos = { x: 100, y: 100, r: 0 };
        this.addSlider("Radial gradient inner circle X position", 0, 200, 100, (value) => {
            radialGradInnerPos.x = value;
            radialGradient.setInner(radialGradInnerPos.x, radialGradInnerPos.y, radialGradInnerPos.r);
        });
        this.addSlider("Radial gradient inner circle Y position", 0, 200, 100, (value) => {
            radialGradInnerPos.y = value;
            radialGradient.setInner(radialGradInnerPos.x, radialGradInnerPos.y, radialGradInnerPos.r);
        });
        this.addSlider("Radial gradient inner circle radius", 0, 100, 0, (value) => {
            radialGradInnerPos.r = value;
            radialGradient.setInner(radialGradInnerPos.x, radialGradInnerPos.y, radialGradInnerPos.r);
        });

        const conicGradAngle = { angle: 0 };
        this.addSlider("Conic gradient angle", 0, 360, 0, (value) => {
            conicGradAngle.angle = degreeToRadian(value);
            conicGradient.setAngle(conicGradAngle.angle);
        });

        this.root.addChild(linearGradRect);
        this.root.addChild(radialGradCircle);
        this.root.addChild(conicGradCircle);
    }
}

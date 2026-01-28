import { TestScene } from "./testScene.js";
import { Anchor } from "../../Graphics/anchor.js";
import { Circle } from "../../Graphics/Shapes/circle.js";

export class CircleTestScene extends TestScene {
    circle;
    /**
     * @param {HTMLElement} testArea
     * @param {HTMLElement} controlArea
     * @param {number} startTime 
     */
    constructor(testArea, controlArea, startTime) {
        super(testArea, controlArea, startTime);

        this.addChild(
            this.circle = new Circle({
                radius: 50,
                fillStyle: 'red',
            })
        );

        this.addSlider("X Position", -500, 500, this.circle.x, (value) => {
            this.circle.x = value;
        });

        this.addSlider("Y Position", -500, 500, this.circle.y, (value) => {
            this.circle.y = value;
        });

        this.addSlider("Radius", 10, 200, this.circle.radius, (value) => {
            this.circle.radius = value;
        });

        this.addButton("Random Color", () => {
            this.circle.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
        });

        this.addToggle("Show bounding box", false, (value) => {
            this.circle.showBounds = value;
        });

        this.addSelector("Anchor", ["top left", "center", "left", "right", "top", "bottom"], "top left", (value) => {
            switch (value) {
                case "top left":
                    this.circle.anchor = Anchor.topLeft;
                    break;
                case "center":
                    this.circle.anchor = Anchor.centre;
                    break;
                case "left":
                    this.circle.anchor = Anchor.left;
                    break;
                case "right":
                    this.circle.anchor = Anchor.right;
                    break;
                case "top":
                    this.circle.anchor = Anchor.top;
                    break;
                case "bottom":
                    this.circle.anchor = Anchor.bottom;
                    break;
                default:
                    break;
            }
        });
    }
}

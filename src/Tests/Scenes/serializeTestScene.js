import { Container } from "../../Graphics/Containers/container.js";
import { TestScene } from "./testScene.js";
import { TextObject } from "../../Graphics/Objects/textObject.js";
import { Rectangle } from "../../Graphics/Shapes/rectangle.js";
import { Circle } from "../../Graphics/Shapes/circle.js";
import { Frame } from "../../Graphics/Shapes/frame.js";
import { Donut } from "../../Graphics/Shapes/donut.js";
import { Anchor } from "../../Graphics/anchor.js";
import { ImageInfo } from "../../Graphics/Objects/imageInfo.js";
import { ImageObject } from "../../Graphics/Objects/imageObject.js";
import { LinearGradient } from "../../Graphics/Gradients/linearGradient.js";
import { deserialize, serialize } from "../../Utils/serialize.js";

const shidev_logo_data_base64 = `data:image/png;base64,
iVBORw0KGgoAAAANSUhEUgAAAGAAAAAgCAMAAADaHo1mAAAAElBMVEX/5eWqqqraAEkzMzONAMQW
/wDGjE4cAAAAuUlEQVR42tWW3Q7DIAiFq8j7PzB23ZCt4rJ17uKQ9iS9IEHx4yc0J7DyAtYjwAZU
CwAngIj1Y8YFEG4xgCkSxqZIQ/gA2enoUHlqtgyRXXTbpRbR6Nbt2jTDIGiCv1K0rqP9m4EFPGgC
TpHeLiKRXfQ+B7TrU1f5/nr5dC/vHUUwToH1jen4OJF5fSc8/z7wNTASpTo/QSm1ztUqimBuG/SN
0N/va2D2SAMnSGnZkNdf978otAYXJ7gD6MWqp36YXykAAAAASUVORK5CYII=`;

export class SerializeTestScene extends TestScene {
    async load() {
        const shidevLogoImage = await ImageInfo.fromURL(shidev_logo_data_base64);

        const originalContainer = new Container({
            children: [
                new Container({
                    fillStyle: "pink",
                    children: [
                        new TextObject({
                            x: 200, y: 50,
                            rotation: 0.1,
                            origin: Anchor.centre,
                            fillStyle: "white",
                            text: "Shapes",
                            font: "40px sans-serif"
                        }),
                        new Rectangle({ y: 50, width: 100, height: 100 }),
                        new Circle({ x: 120, y: 100, radius: 50 }),
                        new Frame({ y: 200, width: 80, height: 120, color: "yellow", lineWidth: 20 }),
                        new Donut({ x: 140, y: 250, radius: 60, color: "lime", lineWidth: 20 }),
                        new ImageObject({ y: 400, scale: 3, images: [shidevLogoImage] }),
                        new TextObject({
                            y: 500, fillStyle: new LinearGradient(0, 0, 200, 0, [{ offset: 0, color: "white" }, { offset: 1, color: "orange" }]),
                            text: "Gradient",
                            font: "40px sans-serif",
                        })
                    ]
                }),
            ]
        });

        const serialized = serialize(originalContainer);
        console.log(serialized);

        const clonedContainer = await deserialize(serialized);
        clonedContainer.x = 500;

        this.root.addChild(originalContainer, clonedContainer);
    }
}

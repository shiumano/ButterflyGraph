import { degreeToRadian, direct } from "../../Utils/unitConversion.js";
import { Anchor, allAnchors } from "../../Graphics/anchor.js";
import { ImageObject } from "../../Graphics/Objects/imageObject.js";
import { TestScene } from "./testScene.js";

const shidev_logo_data_base64 = `data:image/png;base64,
iVBORw0KGgoAAAANSUhEUgAAAGAAAAAgCAMAAADaHo1mAAAAElBMVEX/5eWqqqraAEkzMzONAMQW
/wDGjE4cAAAAuUlEQVR42tWW3Q7DIAiFq8j7PzB23ZCt4rJ17uKQ9iS9IEHx4yc0J7DyAtYjwAZU
CwAngIj1Y8YFEG4xgCkSxqZIQ/gA2enoUHlqtgyRXXTbpRbR6Nbt2jTDIGiCv1K0rqP9m4EFPGgC
TpHeLiKRXfQ+B7TrU1f5/nr5dC/vHUUwToH1jen4OJF5fSc8/z7wNTASpTo/QSm1ztUqimBuG/SN
0N/va2D2SAMnSGnZkNdf978otAYXJ7gD6MWqp36YXykAAAAASUVORK5CYII=`;

const frame_0_data_base64 = `data:image/png;base64,
iVBORw0KGgoAAAANSUhEUgAAAGQAAABkAQMAAABKLAcXAAAABlBMVEUAAAD///+l2Z/dAAABK0lE
QVR42sXUMXKFMAwEUDMULn0EjuKj2TMpci26XINUaSldOGyk/wdJO0mqFKF7A1jCaJ3SX64FR9CK
EVSAoA3orgbsLiAss4pOUxaNuCRmXBKXqYoQC4SCCi8IvHvBRW40kxSXIqfpkgaGtTLCF2Z5arVm
iqywkJK1VrSyaVM1mLqqB9XfdL9sKj+r4m7hqa7NmnbSQTr1k00jqGn/QWB10k46SCdpkCbpIqG7
PqWEa8qi2dUwgjbMoIIrSEYr33vWpvz5V5dMxZtLJuYjqPkwiSppI2XSSkqsRqokz46qkLINvWol
LTZ1qkTyaf0un/JnBdOVQjoadGNcePFUNUrcI5qWRtaGmFsNuGdat8/zrtvnZ8ECOidAZ0iLcX8U
DCdRDa9pjT39x/UF20KBCFfA6B0AAAAASUVORK5CYII=`;
const frame_1_data_base64 = `data:image/png;base64,
iVBORw0KGgoAAAANSUhEUgAAAJYAAACWAQMAAAAGz+OhAAAABlBMVEUAAAD///+l2Z/dAAAAd0lE
QVR42u3VsQ3AIAwEQFsUlB4hozAajMZGaSmiOOn/ixSQBn95QrItihdZFR1o6ULLN5o52uHto/Xl
VtHU0cxhv+QOtxXHd5WYoymx9IOxue9+J7nDwEo38m/7WZ9qOSxsgdl0a2Qu6QrSC0r6Q4ZEIpHI
RnkAHoCsrEReMqgAAAAASUVORK5CYII=`;
const frame_2_data_base64 = `data:image/png;base64,
iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAAABlBMVEUAAAD///+l2Z/dAAAA80lE
QVR42u3bsY4CMRBEQff//zQZASeBtcDJ01TFG/AYezFiWQsAAAAAAJgtf5VkTGvJCyUZQ1Kyp6Xj
+JKkoyTpKEk6SpKOkpSEJB0laQ8Zd4bce8sHhuxdd3zI+9cdH7KECLFHZoesKyvrzNPWhY7Dj41r
9kDur3LND/nkXVqHECvLFjGQ//4SaSAGYiAWlo5vdRiIDh02ug4dOnTo0KFjQIYOHTqedESHDhvE
uprSMTKo5I8KNU/GX3n0tyYkNSE9T5WnJiRGYpf80o2r57Ok8cSylzTzS1fPz9SPOQsAAAAAAAAA
AAAAAAAAAAAAgKPdAGnVCK9egtAkAAAAAElFTkSuQmCC`;
const frame_3_data_base64 = `data:image/png;base64,
iVBORw0KGgoAAAANSUhEUgAAAPoAAAD6AQMAAACyIsh+AAAABlBMVEUAAAD///+l2Z/dAAAA+0lE
QVR42u2XMQ7DIBAEz6Kg9BPyFD/NPM1P4QmUFMiXgOvsWkKJImWnSDVScge3XMyEEEIIIcQ80d0r
EtaX4AkIjy4UIGxOvmPvQmPCyQSnQmLCQarwTPqAhNFJ1KnorFPjh1Z2okRYmGAS/klYpoUwKQSS
IGMyCkupbCSloLDh8b8pJCYYEU4jVTQjfThp3hs7i0SuA+5Dz6hspA4irPi4ex3ls3ey19kmBZsX
dgkSviWETO5kLGNw3gtrHbPZwOQf/aOhDEyLYwHvi3eFyoRCdj0QYteuB3Ly2vVA0gZSRI9h8iqy
lfZaehN5DOh7kvUvSgghhBBC/BJPnMc2B6namHwAAAAASUVORK5CYII=`;
const frame_4_data_base64 = `data:image/png;base64,
iVBORw0KGgoAAAANSUhEUgAAASwAAAEsAQMAAABDsxw2AAAABlBMVEUAAAD///+l2Z/dAAABHUlE
QVR42u3YsQ2DMBCF4UMuXHoEj8Jo9miMwgguXSAu2EjQcS+RG5T3158UcWcTJSKMMcYYY4wx9j+5
FWK+QCxUiMUNYvNO9gtLQ5mOZJNuA5nTOpB5LQNZ0HUgi7pABwRjSTO0Us0hA7tSiQuwhF3mFZju
JqkAY6sCbDUeuwLYfCwBOHHpmC7AjrEBrI0NuDRTI/ZNde0DbebbMBBWkJfNyRQ64ghbBrJ+E6JC
N8FmerJsrhRhrm3eZr4fDpOFftSCxWK/Biab+8vNZKm/tUym/XUEsAywfmFsFvSqPs7janucx9X+
OI+7xwe9y+9k4JOCcwO3AO700tC3GxkZGRnZ25lXRInDfshO2J8Tgv3VwRhjjDHGGGOMse/7ADrp
cp0Mx4CbAAAAAElFTkSuQmCC`;

export class ImageObjectTestScene extends TestScene {
    async load() {
        const imageObj = new ImageObject({
            y: -200,
            anchor: Anchor.centre,
            origin: Anchor.centre,
            scale: 5
        });

        const animImageObj = new ImageObject({
            y: 200,
            anchor: Anchor.centre,
            origin: Anchor.centre,
            fps: 1
        });

        this.addBindSlider("Logo scale", 0.5, 20, imageObj, "scale", direct);
        this.addBindSlider("Logo rotation", -360, 360, imageObj, "rotation", degreeToRadian);
        this.addBindToggle("Logo image smoothing", imageObj, "imageSmoothing", value => value);

        this.addBindSlider("Animation fps", 0, 30, animImageObj, "fps", direct);
        this.addSelector("Animation image align", allAnchors, "topLeft", value => animImageObj.imageAlign = Anchor[value]);

        this.root.addChild(imageObj, animImageObj);

        const shidevLogoBlob = await fetch(shidev_logo_data_base64).then(resp => resp.blob());

        const animFrames = [
            await fetch(frame_0_data_base64).then(resp => resp.blob()),
            await fetch(frame_1_data_base64).then(resp => resp.blob()),
            await fetch(frame_2_data_base64).then(resp => resp.blob()),
            await fetch(frame_3_data_base64).then(resp => resp.blob()),
            await fetch(frame_4_data_base64).then(resp => resp.blob())
        ];

        await imageObj.load([shidevLogoBlob]);
        await animImageObj.load(animFrames);
    }
}

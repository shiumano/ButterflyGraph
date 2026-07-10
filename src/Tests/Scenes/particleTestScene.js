import { direct } from "../../Utils/unitConversion.js";
import { Container } from "../../Graphics/Containers/container.js";
import { Circle } from "../../Graphics/Shapes/circle.js";
import { TestScene } from "./testScene.js";
import { Vector2 } from "../../Graphics/vector2.js";

export class ParticleTestScene extends TestScene {
    async load() {
        const particles = [...Array(5000)].map(() => new Circle({ radius: 3 }));
        const gravityContainer = new Container({ anchor: new Vector2(0.5, 0.2), fillStyle: "cyan", children: particles });

        this.addButton("Splash", (ev) => {
            const animation_length = 10000;

            const now = this.toLocalTime(ev.timeStamp);
            gravityContainer.animate("y", direct).jump(now).set(0).easeIn(10000, animation_length);

            for (const circle of particles) {
                const r = Math.random() * Math.PI * 2;
                const c = Math.sqrt(Math.random());
                circle.animate("x", direct).jump(now).set(0).to(1200 * Math.sin(r) * c, animation_length);
                circle.animate("y", direct).jump(now).set(0).to(1500 * Math.cos(r) * c, animation_length);
            }
        });

        this.root.addChild(gravityContainer);
    }
}

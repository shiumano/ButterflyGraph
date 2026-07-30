import { direct } from "../../Utils/unitConversion.js";
import { Container } from "../../Graphics/Containers/container.js";
import { Circle } from "../../Graphics/Shapes/circle.js";
import { TestScene } from "./testScene.js";

export class ParticleTestScene extends TestScene {
    async load() {
        const particles = [...Array(5000)].map(() => new Circle({ radius: 3 }));
        const particleAnimations = particles.map(circle => {
            const r = Math.random() * Math.PI * 2;
            const d = Math.sqrt(Math.random());
            const x = Math.sin(r) * d * 1200;
            const y = Math.cos(r) * d * 1500;

            return circle.addAnimation("pos", (value) => {
                circle.x = value * x;
                circle.y = value * y;
            });
        });

        const gravityContainer = new Container({ anchor: { x: 0.5, y: 0.2 }, fillStyle: "cyan", children: particles });
        const gravityAnimation = gravityContainer.animate("y", direct);

        this.addButton("Splash", (ev) => {
            const animation_length = 10000;

            const now = this.toLocalTime(ev.timeStamp);
            gravityAnimation.jump(now).set(0).easeIn(10000, animation_length);

            for (const anim of particleAnimations) {
                anim.jump(now).set(0).to(1, animation_length);
            }
        });

        this.root.addChild(gravityContainer);
    }
}

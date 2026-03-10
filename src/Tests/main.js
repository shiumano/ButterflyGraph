import { Scenes } from "./Scenes/index.js";

/**
 * @import { TestScene } from "./Scenes/testScene.js";
 */

const testArea = document.getElementById("test-area");
const controlArea = document.getElementById("control-area");
const testsList = document.getElementById("tests-list");
const speedLabel = document.getElementById("speed-label");
const speedSlider = document.getElementById("speed-slider");
const zoomLabel = document.getElementById("zoom-label");
const zoomSlider = document.getElementById("zoom-slider");
const fpsDisplay = document.getElementById("fps-display");
const dpiDisplay = document.getElementById("dpi-display");
const colorSelector = document.getElementById("background-color-picker");

if (
    testArea === null ||
    controlArea === null ||
    testsList === null ||
    speedLabel === null ||
    !(speedSlider instanceof HTMLInputElement) ||
    zoomLabel === null ||
    !(zoomSlider instanceof HTMLInputElement) ||
    fpsDisplay === null ||
    dpiDisplay === null ||
    !(colorSelector instanceof HTMLInputElement)
) {
    throw new Error("Missing required HTML elements");
}

colorSelector.addEventListener("change", (e) => {
    testArea.style.backgroundColor = colorSelector.value;
});

speedSlider.addEventListener("input", (e) => {
    const value = parseFloat(speedSlider.value);
    speedLabel.textContent = `Speed: ${value.toFixed(1)}x`;
});
speedSlider.addEventListener("dblclick", (e) => {
    speedSlider.value = "1";
    speedLabel.textContent = "Speed: 1.0x";
    speedSlider.dispatchEvent(new Event("input"));
});

zoomSlider.addEventListener("input", (e) => {
    const value = parseFloat(zoomSlider.value);
    zoomLabel.textContent = `Zoom: ${value.toFixed(1)}x`;
});
zoomSlider.addEventListener("dblclick", (e) => {
    zoomSlider.value = "1";
    zoomLabel.textContent = "Zoom: 1.0x";
    zoomSlider.dispatchEvent(new Event("input"));
});

/** @type {TestScene?} */
let currentScene = null;

Scenes.forEach(async (SceneClass) => {
    const button = document.createElement("button");
    button.textContent = SceneClass.name;
    button.addEventListener("click", () => {
        location.hash = SceneClass.name;  // hashchangeイベントでシーンが切り替わる
    });

    testsList.appendChild(button);
    if (location.hash.replace("#", "") === SceneClass.name) {
        const scene = new SceneClass({ testArea, controlArea, speedSlider, zoomSlider, fpsDisplay, dpiDisplay, startTime: Infinity });
        currentScene = scene;
        await scene.load();
        if (!scene.destroyed) {
            scene.startTime = performance.now() + 500;
        }
    }
});

window.addEventListener("hashchange", async () => {
    const sceneName = location.hash.replace("#", "");

    // シーンの選択解除ってことにする
    if (sceneName === "") {
        currentScene?.destroy();
        currentScene = null;
        return;
    }

    const SceneClass = Scenes.find(s => s.name === sceneName);

    if (SceneClass !== undefined) {
        currentScene?.destroy();

        const scene = new SceneClass({ testArea, controlArea, speedSlider, zoomSlider, fpsDisplay, dpiDisplay, startTime: Infinity });
        currentScene = scene;
        await scene.load();
        if (!scene.destroyed) {
            scene.startTime = performance.now() + 500;
        }
    }
});

/**
 * @param {number} now
 */
function renderLoop(now) {
    currentScene?.loop(now);
    requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);

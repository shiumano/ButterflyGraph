import { Scenes } from "./Scenes/index.js";

/**
 * @import { TestScene } from "./Scenes/testScene.js";
 */

const testArea = document.getElementById("test-area");
const controlArea = document.getElementById("control-area");
const testsList = document.getElementById("tests-list");
const colorSelector = document.getElementById("background-color-picker");

if (testArea === null || controlArea === null || testsList === null || colorSelector === null) {
    throw new Error("Missing required HTML elements");
}

colorSelector.addEventListener("change", (e) => {
    if (!(e.target instanceof HTMLInputElement)) return;

    testArea.style.backgroundColor = e.target.value;
});

/** @type {TestScene?} */
let currentScene = null;

Scenes.forEach((SceneClass) => {
    const button = document.createElement("button");
    button.textContent = SceneClass.name;
    button.addEventListener("click", (e) => {
        // clear previous scene
        if (currentScene) {
            currentScene.destroy();
            currentScene = null;
        }

        location.hash = SceneClass.name;

        // create new scene
        const startTime = performance.now() + 500;
        currentScene = new SceneClass(testArea, controlArea, startTime);
    });
    testsList.appendChild(button);
    if (location.hash.replace("#", "") === SceneClass.name) {
        const startTime = performance.now() + 500;
        currentScene = new SceneClass(testArea, controlArea, startTime);
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

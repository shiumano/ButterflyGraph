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
let currentStartTime = 0;

Scenes.forEach((SceneClass) => {
    const button = document.createElement("button");
    button.textContent = SceneClass.name;
    button.addEventListener("click", (e) => {
        // clear previous scene
        if (currentScene) {
            currentScene.destroy();
            currentScene = null;
        }

        // create new scene
        currentScene = new SceneClass(testArea, controlArea);
        currentStartTime = e.timeStamp + 500;
    });
    testsList.appendChild(button);
});

/**
 * @param {number} now
 */
function renderLoop(now) {
    if (currentScene) {
        currentScene.loop(Math.max(0, now - currentStartTime));
    }
    requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);

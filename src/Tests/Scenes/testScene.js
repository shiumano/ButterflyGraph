import { HTMLCanvasRenderer } from "../../Graphics/Rendering/HTMLCanvasRenderer.js";
import { Container } from "../../Graphics/Containers/container.js";

/**
 * @import { GenericDrawObject, Properties } from "@core/Graphics/drawObject.js"
 * @typedef {{
 *   testArea: HTMLElement
 *   controlArea: HTMLElement
 *   speedSlider: HTMLInputElement
 *   zoomSlider: HTMLInputElement
 *   fpsDisplay: HTMLElement
 *   dpiDisplay: HTMLElement
 *   startTime: number
 * }} TestSceneOptions
 */

export class TestScene {
    testArea;
    controlArea;
    dpiDisplay;
    renderer;
    observer;
    startTime;

    speed;
    current = 0;  // あくまでオフセット計算用 これをdelta加算していくわけではない！
    timeOffset = 0;

    zoomScale = 1;

    wrapper;
    canvas;

    forceRedraw = false;

    fpsUpdateIntervalId;
    animationFrameCount = 0;

    stats = {
        updateTime: 0,
        executionTime: 0
    };

    destroyed = false;

    root;

    /**
     * @param {TestSceneOptions} options
     */
    constructor(options) {
        const { testArea, controlArea, speedSlider, zoomSlider, fpsDisplay, dpiDisplay, startTime } = options;

        const canvas = document.createElement("canvas");
        canvas.width = testArea.clientWidth;
        canvas.height = testArea.clientHeight;
        canvas.style.transformOrigin = "0px 0px";

        const wrapper = document.createElement("div");
        wrapper.style.width = "100%";
        wrapper.style.height = "100%";
        wrapper.style.contain = "strict";
        wrapper.appendChild(canvas);
        testArea.appendChild(wrapper);

        const renderer = new HTMLCanvasRenderer(canvas, false);
        renderer.perfMeasure = true;

        const speed = parseFloat(speedSlider.value);
        speedSlider.addEventListener("input", (ev) => {
            const now = ev.timeStamp;
            // 途中で速度を変えても自然に見えるように、開始時間をずらす
            const current = this.toLocalTime(now);
            const newSpeed = parseFloat(speedSlider.value);
            this.speed = newSpeed;

            if (this.startTime === Infinity) return;

            this.current = current;
            if (newSpeed === 0) {
                this.timeOffset = now - this.startTime;
            } else {
                this.timeOffset = now - this.startTime - current / newSpeed;
            }
        });

        const zoomScale = parseFloat(zoomSlider.value);
        zoomSlider.addEventListener("input", (ev) => {
            const newScale = parseFloat(zoomSlider.value);
            this.zoomScale = newScale;
            this.resizeCanvas();
        });

        const dpr = window.devicePixelRatio;

        const root = new Container({
            width: renderer.width,
            height: renderer.height,
        });

        const observer = new ResizeObserver(this.resizeCanvas.bind(this));
        observer.observe(wrapper);

        const mqString = `(resolution: ${dpr}dppx)`;
        const media = matchMedia(mqString);
        media.addEventListener("change", this.updateDevicePixelRatio.bind(this), { once: true });


        this.fpsUpdateIntervalId = setInterval(() => {
            if (this.destroyed) {
                clearInterval(this.fpsUpdateIntervalId);
                return;
            }

            const fps = renderer.frameCount;
            const updateTimePercent = this.stats.updateTime / 100;
            const execTimePercent = this.stats.executionTime / 10;
            fpsDisplay.textContent = (
                `FPS: ${fps} / ${this.animationFrameCount}  `
                + `Update: ${updateTimePercent.toFixed(2)}% `
                + `Exec: ${execTimePercent.toFixed(2)}%`);
            renderer.frameCount = 0;
            this.stats.updateTime = 0;
            this.stats.executionTime = 0;
            this.animationFrameCount = 0;
        }, 1000);

        this.testArea = testArea;
        this.controlArea = controlArea;
        this.dpiDisplay = dpiDisplay;
        this.startTime = startTime;
        this.speed = speed;
        this.zoomScale = zoomScale;
        this.wrapper = wrapper;
        this.canvas = canvas;
        this.renderer = renderer;
        this.observer = observer;
        this.root = root;
    }

    async load() { }

    resizeCanvas() {
        const rect = this.wrapper.getBoundingClientRect();

        const dpr = window.devicePixelRatio;

        const w = rect.width;
        const h = rect.height;

        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.renderer.resize(w * dpr, h * dpr);
            this.canvas.style.scale = `${1 / dpr}`;
            // リサイズするとなにもかもがリセットされるので再描画が必要
            this.forceRedraw = true;

            this.dpiDisplay.textContent = `DPI: ${dpr.toFixed(2)}x`;
        }

        this.root.width = w / this.zoomScale;
        this.root.height = h / this.zoomScale;
        this.root.scale = dpr * this.zoomScale;
    }

    updateDevicePixelRatio() {
        const dpr = window.devicePixelRatio;
        const mqString = `(resolution: ${dpr}dppx)`;
        const media = matchMedia(mqString);
        media.addEventListener("change", this.updateDevicePixelRatio.bind(this), { once: true });
        this.resizeCanvas();
    }

    /**
     * @param {number} globalTime
     */
    toLocalTime(globalTime) {
        if (this.speed !== 0) {
            return Math.max(0, (globalTime - this.startTime - this.timeOffset) * this.speed);
        } else {
            return this.current;
        }
    }

    /**
     * @param {number} now - 現在時刻(ミリ秒)
     */
    loop(now) {
        if (this.destroyed) return;

        this.animationFrameCount++;

        const t = this.toLocalTime(now);

        const startCalc = performance.now();
        const snapshot = this.root.getSnapshot(t);
        const endCalc = performance.now();

        if (this.root.contentChanged || this.forceRedraw) {
            this.renderer.render(snapshot);
            this.root.contentChanged = false;
            this.forceRedraw = false;
        }

        // 実際にはCanvas APIのドローコールは積まれて実行は後でまとめてされる
        // ので、ここで取った時間は描画全体にかかった時間ではない
        // これはAPIコールにかかった時間の合計
        const endExec = performance.now();

        this.stats.updateTime += endCalc - startCalc;
        this.stats.executionTime += endExec - endCalc;
    }

    destroy() {
        this.destroyed = true;
        this.root.clearChildren();
        this.observer.disconnect();
        this.testArea.innerHTML = "";
        this.controlArea.innerHTML = "";
        // simple is best?
    }

    /**
     * @param {string} label
     * @param {(ev: PointerEvent) => void} onClick
     */
    addButton(label, onClick) {
        const button = document.createElement("button");
        button.textContent = label;
        button.addEventListener("click", onClick);
        this.controlArea.appendChild(button);
    }

    /**
     * @param {string} label
     * @param {boolean} initialState
     * @param {(value: boolean, ev: Event) => void} onChange
     */
    addToggle(label, initialState, onChange) {
        const labelElem = document.createElement("label");
        const checkbox = document.createElement("input");
        const textNode = document.createTextNode(`${label}: ${initialState}`);
        labelElem.style.flexFlow = "row";
        checkbox.type = "checkbox";
        checkbox.checked = initialState;
        checkbox.addEventListener("change", (ev) => {
            textNode.textContent = `${label}: ${checkbox.checked}`;
            onChange(checkbox.checked, ev);
        });
        labelElem.appendChild(textNode);
        labelElem.appendChild(checkbox);
        this.controlArea.appendChild(labelElem);
    }

    /**
     * @param {string} label
     * @param {number} min
     * @param {number} max
     * @param {number} initialValue
     * @param {(value: number, ev?: Event) => void} onChange
     */
    addSlider(label, min, max, initialValue, onChange) {
        const labelElem = document.createElement("label");
        const textNode = document.createTextNode(`${label}: ${initialValue}`);

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = min.toString();
        slider.max = max.toString();
        slider.step = "0.1";
        slider.value = initialValue.toString();
        slider.addEventListener("input", (ev) => {
            textNode.textContent = `${label}: ${slider.value}`;
            onChange(parseFloat(slider.value), ev);
        });
        slider.addEventListener("dblclick", () => {
            slider.value = initialValue.toString();
            textNode.textContent = `${label}: ${initialValue}`;
            onChange(initialValue);
        });

        labelElem.appendChild(textNode);
        labelElem.appendChild(slider);
        this.controlArea.appendChild(labelElem);
    }

    /**
     * @template {string} T
     * @param {string} label
     * @param {readonly T[]} options
     * @param {T} initialValue
     * @param {(value: T, ev: Event) => void} onChange
     */
    addSelector(label, options, initialValue, onChange) {
        const labelElem = document.createElement("label");
        labelElem.textContent = label;

        const select = document.createElement("select");
        options.forEach((option) => {
            const optionElem = document.createElement("option");
            optionElem.value = option;
            optionElem.textContent = option;
            if (option === initialValue) {
                optionElem.selected = true;
            }
            select.appendChild(optionElem);
        });
        select.addEventListener("change", (ev) => {
            const value = select.value;
            if (includes(options, value)) {
                onChange(value, ev);
            }
        });

        labelElem.appendChild(select);
        this.controlArea.appendChild(labelElem);
    }

    /**
     * @param {string} label
     * @param {string} initialText
     * @param {(value: string, ev?: Event) => void} onChange
     */
    addTextInput(label, initialText, onChange) {
        const labelElem = document.createElement("label");
        const textNode = document.createTextNode(`${label}: ${initialText}`);

        const input = document.createElement("input");
        input.type = "text";
        input.value = initialText;
        input.addEventListener("input", (ev) => {
            textNode.textContent = `${label}: ${input.value}`;
            onChange(input.value, ev);
        });
        input.addEventListener("dblclick", () => {
            input.value = initialText;
            textNode.textContent = `${label}: ${initialText}`;
            onChange(initialText);
        });

        labelElem.appendChild(textNode);
        labelElem.appendChild(input);
        this.controlArea.appendChild(labelElem);
    }

    /**
     * @template {GenericDrawObject} T
     * @template {Properties<T>} P
     * @param {string} label
     * @param {number} min
     * @param {number} max
     * @param {T} target
     * @param {P} property
     * @param {(value: number) => T[P]} convert
     */
    addBindSlider(label, min, max, target, property, convert) {
        const currentValue = target[property];
        let initialValue;

        switch (typeof currentValue) {
            case "number":
                initialValue = currentValue;
                break;
            case "string":
                initialValue = parseFloat(currentValue);
                break;
            default:
                initialValue = 0;
                break;
        }

        this.addSlider(label, min, max, initialValue, (value) => target[property] = convert(value));
    }

    /**
     * @template {GenericDrawObject} T
     * @template {Properties<T>} P
     * @param {string} label
     * @param {T} target
     * @param {P} property
     * @param {(value: boolean) => T[P]} convert
     */
    addBindToggle(label, target, property, convert) {
        const currentValue = target[property];
        let initialValue;

        switch (typeof currentValue) {
            case "boolean":
                initialValue = currentValue;
                break;
            default:
                initialValue = false;
                break;
        }

        this.addToggle(label, initialValue, (value) => target[property] = convert(value));
    }
}

// 型ガード関数まで始めちゃったらTSだろ
/**
 * @template {string} T
 * @param {readonly T[]} arr
 * @param {string} item
 * @returns {item is T}
 */
function includes(arr, item) {
    // includesの型が少々早すぎる
    return arr.includes(/** @type {T} */(item));
}

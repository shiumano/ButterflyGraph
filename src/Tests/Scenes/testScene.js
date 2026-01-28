import { HTMLCanvasRenderer } from "../../Graphics/Rendering/HTMLCanvasRenderer.js";
import { Container } from "../../Graphics/Containers/container.js";

/**
 * @import { GenericContainerNode } from "@core/Graphics/Containers/container.js"
 */

/**
 * @extends {Container<GenericContainerNode>}
 */
export class TestScene extends Container {
    testArea;
    controlArea;
    renderer;
    observer;

    destroyed = false;

    /**
     * @param {HTMLElement} testArea
     * @param {HTMLElement} controlArea
     */
    constructor(testArea, controlArea) {
        const canvas = document.createElement("canvas");
        canvas.width = testArea.clientWidth;
        canvas.height = testArea.clientHeight;

        const wrapper = document.createElement("div");
        wrapper.style.width = "100%";
        wrapper.style.height = "100%";
        wrapper.style.contain = "strict";
        wrapper.appendChild(canvas);
        testArea.appendChild(wrapper);

        const renderer = new HTMLCanvasRenderer(canvas, false);
        super({
            width: renderer.width,
            height: renderer.height,
        });

        const observer = new ResizeObserver(() => {
            const rect = wrapper.getBoundingClientRect();

            const w = rect.width;
            const h = rect.height;

            if (canvas.width !== w || canvas.height !== h) {
                renderer.width = w;
                renderer.height = h;
                this.width = w;
                this.height = h;
            }
        });
        observer.observe(wrapper);

        this.testArea = testArea;
        this.controlArea = controlArea;
        this.renderer = renderer;
        this.observer = observer;
    }

    /**
     * @param {string} label
     * @param {() => void} onClick
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
     * @param {(value: boolean) => void} onChange
     */
    addToggle(label, initialState, onChange) {
        const labelElem = document.createElement("label");
        const checkbox = document.createElement("input");
        const textNode = document.createTextNode(`${label}: ${initialState}`);
        labelElem.style.flexFlow = "row";
        checkbox.type = "checkbox";
        checkbox.checked = initialState;
        checkbox.addEventListener("change", () => {
            textNode.textContent = `${label}: ${checkbox.checked}`;
            onChange(checkbox.checked);
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
     * @param {(value: number) => void} onChange
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
        slider.addEventListener("input", () => {
            textNode.textContent = `${label}: ${slider.value}`;
            onChange(parseFloat(slider.value));
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
     * @param {string} label
     * @param {string[]} options
     * @param {string} initialValue
     * @param {(value: string) => void} onChange
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
        select.addEventListener("change", () => {
            onChange(select.value);
        });

        labelElem.appendChild(select);
        this.controlArea.appendChild(labelElem);
    }

    /**
     * @param {string} label
     * @param {string} initialText
     * @param {(value: string) => void} onChange
     */
    addTextInput(label, initialText, onChange) {
        const labelElem = document.createElement("label");
        const textNode = document.createTextNode(`${label}: ${initialText}`);

        const input = document.createElement("input");
        input.type = "text";
        input.value = initialText;
        input.addEventListener("input", () => {
            textNode.textContent = `${label}: ${input.value}`;
            onChange(input.value);
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
     * @param {number} now - 現在時刻(ミリ秒)
     */
    loop(now) {
        if (this.destroyed) return;

        const snapshot = this.getSnapshot(now);
        this.renderer.render(snapshot);
    }

    destroy() {
        this.destroyed = true;
        this.clearChildren();
        this.observer.disconnect();
        this.testArea.innerHTML = "";
        this.controlArea.innerHTML = "";
        // simple is best?
    }
}

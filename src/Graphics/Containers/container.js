import { DrawNode } from "../drawNode.js";
import { DrawObject } from "../drawObject.js";
import { classOf } from "../../Utils/metaPrg.js";
import { nullArray } from "../../Utils/statics.js";

/**
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @import { DrawObjectOptions, RecreateReason } from "@core/Graphics/drawObject.js"
 * @typedef {DrawObjectOptions & {
 *   children?: readonly DrawObject[]
 *   clip?: boolean
 * }} ContainerOptions
 * @typedef {DrawNodeOptions & {
 *   children?: DrawNode[]
 *   clip: boolean
 * }} ContainerNodeOptions
 */

const children_nodes = Symbol();

/**
 * @template {ContainerNode} [T=ContainerNode]
 * @extends {DrawObject<T>}
 */
export class Container extends DrawObject {
    #children;
    #childrenTimed;
    #childrenAnimated;
    #clip;

    /** @type {readonly DrawObject[] | null} */
    #frozenChildren = null;

    /** @type {DrawNode[]} */
    #childrenNodes = [];

    /**
     * @param {ContainerOptions} options
     */
    constructor({
        children,
        clip = false,
        ...options
    } = {}) {
        super(options);

        const myChildren = children?.slice() ?? [];  // Containerの持ち物になった時点で再作成
        this.#children = myChildren;
        this.#clip = clip;

        let childrenTimed = false;
        let childrenAnimated = false;
        let childrenPerfect = true;  // だったらどれほどいいことか

        for (let i = 0; i < myChildren.length; i++) {
            const child = myChildren[i];
            child.parent = this;
            childrenTimed ||= child.timed;
            childrenAnimated ||= child.animated;
            childrenPerfect &&= child.perfectlyOptimized;
        }
        this.#childrenTimed = childrenTimed;
        this.#childrenAnimated = childrenAnimated;
        this.#perfectlyOptimized = this.isPerfectlyOptimized() && childrenPerfect;  // 世話が焼けるわね！
    }

    get width() { return super.width; }
    set width(value) {
        if (super.width === value) return;

        super.width = value;
        const children = this.#children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.anchor.x !== 0) {
                child.requestRecreate(this, "transform");
            }
        }
    }

    get height() { return super.height; }
    set height(value) {
        if (super.height === value) return;

        super.height = value;

        const children = this.#children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.anchor.y !== 0) {
                child.requestRecreate(this, "transform");
            }
        }
    }

    /**
     * tの変化で更新するか否か
     * Containerがtimed = falseなら、その下もtの変化での更新はしない そういうもの
     */
    get timed() { return super.timed && this.#childrenTimed; }
    set timed(value) { super.timed = value; }

    get animated() { return super.animated || this.#childrenAnimated; }

    get clip() { return this.#clip; }
    set clip(value) {
        if (this.#clip === value) return;

        this.#clip = value;
        this.requestRecreate(this, "object");
    }

    /**
     * @param {DrawObject} sender
     * @param {RecreateReason} reason
     */
    requestRecreate(sender, reason) {
        const children = this.#children;

        switch (reason) {
            case "children":
            case "timed":
            case "animationRegister":
                if (sender.parent === this) {
                    // console.log({ reason, cTimed: this.#childrenTimed, sTimed: sender.timed, cAnim: this.#childrenAnimated, sAmin: sender.animated });
                    if (this.#childrenTimed && !sender.timed ||
                        this.#childrenAnimated && !sender.animated
                    ) {
                        let childrenTimed = false;
                        let childrenAnimated = false;
                        for (let i = 0; i < children.length; i++) {
                            const child = children[i];
                            childrenTimed ||= child.timed;
                            childrenAnimated ||= child.animated;
                        }
                        this.#childrenTimed = childrenTimed;
                        this.#childrenAnimated = childrenAnimated;
                    } else {
                        this.#childrenTimed ||= sender.timed;
                        this.#childrenAnimated ||= sender.animated;
                    }

                    if (!this.perfectlyOptimized && sender.perfectlyOptimized) {
                        const thisOptimized = this.isPerfectlyOptimized();
                        let childrenPerfect = true;
                        for (let i = 0; i < children.length; i++) {
                            const child = children[i];
                            childrenPerfect &&= child.perfectlyOptimized;
                        }
                        this.#perfectlyOptimized = thisOptimized && childrenPerfect;
                    } else {
                        this.#perfectlyOptimized &&= sender.perfectlyOptimized;
                    }
                }
                super.requestRecreate(this, "object");
                break;
            case "zIndex":
                if (sender.parent !== this) break;
                this.#frozenChildren = null;  // zIndexの変化でchildrenの順番が変わる可能性があるので、キャッシュを破棄する
                this.#children.sort((a, b) => a.zIndex - b.zIndex);
                super.requestRecreate(this, "object");
                break;
            default:
                if (sender.parent !== this) break;
                super.requestRecreate(this, "object");
                break;
        }

        super.requestRecreate(sender, reason);
    }

    getAllChildren() {
        let frozenChildren = this.#frozenChildren;

        if (frozenChildren === null) {
            // PERF: けっこう無視できないくらいの量の配列コピーが発生する
            //     : クラス外部のどこぞの馬の骨とも知らぬ奴らが何するか
            //     : 分かったもんじゃないからこれで囲ってpublicにしているのであって
            //     : クラス内部でくらいはthis.#childrenを直で扱ってもいい
            //     :     ただし気をつけろよ！
            frozenChildren = Object.freeze(this.#children.slice());
        }

        return frozenChildren;
    }

    /**
     * @param {...DrawObject} children
     */
    addChild(...children) {
        this.#frozenChildren = null;

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const index = this.#children.indexOf(child);
            if (index !== -1) continue;  // 既にあるので、追加する意味はない

            const oldParent = child.parent;
            child.parent = this;

            if (oldParent !== null && oldParent instanceof Container) {
                oldParent.removeChild(child);  // childを奪う そういう仕様とする
            }

            this.#children.push(child);
            this.#children.sort((a, b) => a.zIndex - b.zIndex);
            this.#childrenTimed ||= child.timed;
            this.#childrenAnimated ||= child.animated;
            this.#perfectlyOptimized &&= child.perfectlyOptimized;

            child.parent = this;
        }
        this.requestRecreate(this, "children");
    }

    /**
     * @param {DrawObject} child
     */
    removeChild(child) {
        this.#frozenChildren = null;

        const index = this.#children.indexOf(child);
        if (index === -1) return;  // この Container の子ではない

        if (child.parent === this) {
            child.parent = null;
        }

        const newChildren = [];
        let childrenTimed = false;
        let childrenAnimated = false;
        let childrenPerfect = true;

        for (let i = 0; i < this.#children.length; i++) {
            const obj = this.#children[i];
            if (obj !== child) {
                newChildren.push(obj);
                childrenTimed ||= obj.timed;
                childrenAnimated ||= obj.animated;
                childrenPerfect &&= obj.perfectlyOptimized;
            }
        }

        this.#children = newChildren;
        this.#childrenTimed = childrenTimed;
        this.#childrenAnimated = childrenAnimated;
        this.#perfectlyOptimized = this.isPerfectlyOptimized() && childrenPerfect;

        this.requestRecreate(this, "children");
    }

    clearChildren() {
        this.#children.forEach(child => child.parent = null);  // 関係を切る
        this.#children = [];
        this.#childrenTimed = false;
        this.#childrenAnimated = false;
        this.#perfectlyOptimized = this.isPerfectlyOptimized();
        this.#frozenChildren = nullArray;  // 何もないなら最初から空配列でいい
        this.requestRecreate(this, "children");
    }

    /**
     * @param {number} t
     * @returns {ContainerNodeOptions}
     */
    calculateOptions(t) {
        const baseOptions = super.calculateOptions(t);

        const childObjects = this.#children;
        const children = this.cachedNode?.options.children ?? [];
        children.length = childObjects.length;
        if (this.timed || this.objectChanged) {
            for (let i = 0; i < childObjects.length; i++) {
                children[i] = childObjects[i].getSnapshot(t);
            }
        }

        const options = Object.assign(baseOptions, {
            children: children,
            clip: this.clip
        });

        return options;
    }

    /**
     * @param {number} t
     * @returns {T}
     */
    updateNode(t) {
        this._updateChildren(t);

        // もしContainerNode以外を返したいと思っていたのなら、ちゃんとcreateSnapshot(t)を実装する必要がありますよ
        // BufferedContainerを見習いなさい
        const cachedNode = this.cachedNode ?? /** @type {T} */ (new ContainerNode());

        cachedNode.read(this);
        return cachedNode;
    }

    /**
     * @param {number} t
     */
    _updateChildren(t) {
        const childrenNodes = this.#childrenNodes;
        const childObjects = this.#children;
        for (let i = 0; i < childObjects.length; i++) {
            childrenNodes[i] = childObjects[i].getSnapshot(t);
        }
        childrenNodes.length = childObjects.length;
    }

    get [children_nodes]() { return this.#childrenNodes; }

    toOptions() {
        /** @type {ContainerOptions} */
        const options = super.toOptions();
        if (!super.timed) options.timed = false;
        if (this.#clip) options.clip = true;
        const children = this.getAllChildren();
        if (children.length !== 0) options.children = children;

        return options;
    }

    isPerfectlyOptimized() { return classOf(this) === Container; }

    #perfectlyOptimized;
    get perfectlyOptimized() { return this.#perfectlyOptimized; }
}

/**
 * @template {ContainerNodeOptions} [T=ContainerNodeOptions]
 * @extends {DrawNode<T>}
 */
export class ContainerNode extends DrawNode {
    /** @type {DrawNode[]} */
    #children = [];
    /** @type {Path2D?} */
    #clipPath = null;

    /**
     * @returns {ContainerNodeOptions}
     */
    createDefaultOptions() {
        return Object.assign(super.createDefaultOptions(), {
            children: [],
            clip: false
        });
    }

    /**
     * @param {Readonly<T>} options
     */
    read(options) {
        const children = options instanceof Container ? options[children_nodes] : options.children ?? [];
        const clip = options.clip;

        const tOpt = this.options;

        this.#children = children;

        if (clip) {
            if (!this.options.clip
                || tOpt.width !== options.width
                || tOpt.height !== options.height
            ) {
                const clipPath = new Path2D();
                clipPath.rect(0, 0, options.width, options.height);
                this.#clipPath = clipPath;
            }
        } else {
            this.#clipPath = null;
        }

        tOpt.clip = clip;

        super.read(options);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        if (this.#clipPath !== null) {
            ctx.clip(this.#clipPath);
        }

        for (let i = 0; i < this.#children.length; i++) {
            this.#children[i].render(ctx);
        }
    }
}

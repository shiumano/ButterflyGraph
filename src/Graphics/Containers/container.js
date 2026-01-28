import { DrawNode } from "../drawNode.js";
import { DrawObject } from "../drawObject.js";

/**
 * @import { DrawNodeOptions, GenericDrawNode } from "@core/Graphics/drawNode.js"
 * @import { DrawObjectOptions, RecreateReason, GenericDrawObject } from "@core/Graphics/drawObject.js"
 * @typedef {DrawObjectOptions & {
 *   children?: readonly GenericDrawObject[]
 *   clip?: boolean
 * }} ContainerOptions
 * @typedef {DrawNodeOptions & {
 *   children: readonly GenericDrawNode[]
 *   clip: boolean
 * }} ContainerNodeOptions
 * @typedef {ContainerNode<ContainerNodeOptions>} GenericContainerNode
 * @typedef {Container<GenericContainerNode>} GenericContainer
 */

/**
 * @template {ContainerNode<ContainerNodeOptions>} T
 * @extends {DrawObject<T>}
 */
export class Container extends DrawObject {
    #children;
    #childrenTimed;
    #childrenAnimated;
    #childrenPerfectlyOptimized;  // PERF: まったく世話の焼ける子たちねぇ
    #clip;

    /**
     * @param {ContainerOptions} options
     */
    constructor(options = {}) {
        super(options);

        const children = options.children?.slice() ?? [];  // Containerの持ち物になった時点で再作成
        this.#children = children;
        this.#clip = options.clip ?? false;

        let childrenTimed = false;
        let childrenAnimated = false;
        let childrenPerfect = true;  // だったらどれほどいいことか

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            child.parent = this;
            childrenTimed ||= child.timed;
            childrenAnimated ||= child.animated;
            childrenPerfect &&= child.perfectlyOptimized;
        }
        this.#childrenTimed = childrenTimed;
        this.#childrenAnimated = childrenAnimated;
        this.#childrenPerfectlyOptimized = childrenPerfect;
    }

    get width() { return super.width; }
    set width(value) {
        if (super.width === value) return;

        super.width = value;
        const children = this.getAllChildren();
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.anchor.x !== 0) {
                child.requestRecreate("transform");
            }
        }
    }

    get height() { return super.height; }
    set height(value) {
        if (super.height === value) return;

        super.height = value;

        const children = this.getAllChildren();
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.anchor.y !== 0) {
                child.requestRecreate("transform");
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
        this.requestRecreate("object");
    }

    /**
     * @param {RecreateReason} reason
     */
    requestRecreate(reason) {
        // PERF: reasonにさらに"timed"を追加し、さらにrequester: DrawNodeを追加すればこのforは消せる
        // TODO: やる価値はそこそこありそうかな
        let childrenTimed = false;
        let childrenAnimated = false;
        let childrenPerfect = true;
        for (let i = 0; i < this.#children.length; i++) {
            const child = this.#children[i]
            childrenTimed ||= child.timed;
            childrenAnimated ||= child.animated;
            childrenPerfect &&= child.perfectlyOptimized;
        }
        this.#childrenTimed = childrenTimed;
        this.#childrenAnimated = childrenAnimated;
        this.#childrenPerfectlyOptimized = childrenPerfect;

        super.requestRecreate(reason);
    }

    getAllChildren() {
        return Object.freeze(this.#children.slice());  // PERF: 配列コピーすんのコストなんだわ やめていい？
    }

    /**
     * @param {GenericDrawObject[]} children
     */
    addChild(...children) {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const index = this.#children.indexOf(child);
            if (index !== -1) continue;  // 既にあるので、追加する意味はない

            if (child.parent !== null && child.parent instanceof Container) {
                child.parent.removeChild(child);  // childを奪う そういう仕様とする
            }

            child.parent = this;
            this.#children.push(child);
            this.#childrenTimed ||= child.timed;
            this.#childrenAnimated ||= child.animated;
            this.#childrenPerfectlyOptimized &&= child.perfectlyOptimized;
        }
        this.requestRecreate("object");
    }

    /**
     * @param {GenericDrawObject} child
     */
    removeChild(child) {
        const index = this.#children.indexOf(child);
        if (index === -1) return;  // この Container の子ではない

        child.parent = null;
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
        this.#childrenPerfectlyOptimized = childrenPerfect;

        this.requestRecreate("object");
    }

    clearChildren() {
        this.#children.forEach(child => child.parent = null);  // 関係を切る
        this.#children = []
        this.#childrenTimed = false;
        this.#childrenAnimated = false;
        this.#childrenPerfectlyOptimized = true;
        this.requestRecreate("object");
    }

    /**
     * @param {number} t
     */
    calculateAnimations(t) {
        super.calculateAnimations(t);

        // FIXME: 2回呼ぶはめになる
        if (this.#childrenAnimated) {
            const childObjects = this.getAllChildren();
            if (childObjects.length === 1) {
                childObjects[0].calculateAnimations(t);
            } else {
                for (let i = 0; i < childObjects.length; i++) {
                    const child = childObjects[i];
                    if (child.animated) child.calculateAnimations(t);
                }
            }
        }
    }

    /**
     * @param {number} t
     * @returns {ContainerNodeOptions}
     */
    calculateOptions(t) {
        let options = super.calculateOptions(t);

        let children = this.cachedNode?.options?.children;
        if (children === undefined || this.timed || this.objectChanged) {
            const childObjects = this.getAllChildren();
            if (childObjects.length === 1) {
                const childNode = childObjects[0].getSnapshot(t);
                children = [childNode];
            } else {
                children = childObjects.map(child => child.getSnapshot(t))
                            .sort((a, b) => a.zIndex - b.zIndex);
            }
        }

        return {
            ...options,
            children: children,
            clip: this.clip
        }
    }

    /**
     * @param {number} t
     * @returns {T}
     */
    createSnapshot(t) {
        const options = this.calculateOptions(t);
        // もしContainerNode以外を返したいと思っていたのなら、ちゃんとcreateSnapshot(t)を実装する必要がありますよ
        // BufferedContainerを見習いなさい
        // @ts-expect-error
        return this.cachedNode?.with(options) ?? new ContainerNode(options);
    }

    get childrenPerfectlyOptimized() { return this.#childrenPerfectlyOptimized; }  // 永遠の負債 世話が焼けるわね！
    get perfectlyOptimized() { return this.constructor === Container && this.childrenPerfectlyOptimized; }
}

/**
 * @template {ContainerNodeOptions} T
 * @extends {DrawNode<T>}
 */
export class ContainerNode extends DrawNode {
    #children;
    /** @type {Path2D?} */
    #clipPath = null;
    #single;

    /**
     * @param {T} options
     * @param {ContainerNode<T>?} oldNode
     */
    constructor(options, oldNode = null) {
        super(options, oldNode);

        this.#children = Object.freeze(options.children);

        this.#single = this.#children.length === 1;

        if (
            oldNode instanceof ContainerNode
            && oldNode.options.clip && options.clip
            && oldNode.width === options.width
            && oldNode.height === options.height
        ) {
            this.#clipPath = oldNode.#clipPath;
        } else {
            if (options.clip) {
                const clipPath = new Path2D();
                clipPath.rect(0, 0, options.width, options.height);
                this.#clipPath = clipPath;
            }
        }
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        if (this.#clipPath !== null)
            ctx.clip(this.#clipPath);

        if (this.#single) {  // PERF: ループ回す必要がない マイクロ最適化
            this.#children[0].render(ctx);
        } else {
            for (let i = 0; i < this.#children.length; i++) {
                this.#children[i].render(ctx);
            }
        }
    }
}

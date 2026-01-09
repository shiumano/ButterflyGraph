import { DrawNode } from "../drawNode.js";
import { DrawObject } from "../drawObject.js";

/**
 * @import { DrawNodeOptions } from "@core/Graphics/drawNode.js"
 * @import { DrawObjectOptions, RecreateReason } from "@core/Graphics/drawObject.js"
 * @typedef {DrawObjectOptions & {
 *   children?: readonly DrawObject[]
 *   clip?: boolean
 * }} ContainerOptions
 * @typedef {DrawNodeOptions & {
 *   children: ReadonlyArray<DrawNode>
 *   clip: boolean
 * }} ContainerNodeOptions
 */

export class Container extends DrawObject {
    #children;
    #childrenTimed;
    #childrenPerfectlyOptimized;  // PERF: まったく世話の焼ける子たちねぇ
    #clip;

    /**
     * 
     * @param {ContainerOptions} options 
     */
    constructor(options = {}) {
        super(options);

        const children = options.children?.slice() ?? [];  // Containerの持ち物になった時点で再作成
        this.#children = children;
        this.#clip = options.clip ?? false;

        let childrenTimed = false;
        let childrenPerfect = true;  // だったらどれほどいいことか

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            child.parent = this;
            childrenTimed ||= child.timed;
            childrenPerfect &&= child.perfectlyOptimized;
        }
        this.#childrenTimed = childrenTimed;
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

    get clip() { return this.#clip; }
    set clip(value) { 
        if (this.#clip === value) return;

        this.#clip = value;
        this.requestRecreate("object");
    }

    /**
     * 
     * @param {RecreateReason} reason 
     */
    requestRecreate(reason) {
        // PERF: reasonにさらに"timed"を追加し、さらにrequester: DrawNodeを追加すればこのforは消せる
        // TODO: やる価値はそこそこありそうかな
        let childrenTimed = false;
        let childrenPerfect = true;
        for (let i = 0; i < this.#children.length; i++) {
            childrenTimed ||= this.#children[i].timed;
            childrenPerfect &&= this.#children[i].perfectlyOptimized;
        }
        this.#childrenTimed = childrenTimed;
        this.#childrenPerfectlyOptimized = childrenPerfect;

        super.requestRecreate(reason);
    }

    getAllChildren() { 
        return Object.freeze(this.#children.slice());  // PERF: 配列コピーすんのコストなんだわ やめていい？
    }

    /**
     * 
     * @param {DrawObject} child 
     */
    addChild(child) {
        const index = this.#children.indexOf(child);
        if (index !== -1) return;  // 既にあるので、追加する意味はない

        if (child.parent !== null && child.parent instanceof Container) {
            child.parent.removeChild(child);  // childを奪う そういう仕様とする
        }

        child.parent = this;
        this.#children.push(child);
        this.#childrenTimed ||= child.timed;
        this.requestRecreate("object");
    }

    /**
     * 
     * @param {DrawObject} child 
     */
    removeChild(child) {
        const index = this.#children.indexOf(child);
        if (index === -1) return;  // この Container の子ではない

        child.parent = null;
        const newChildren = [];
        let childrenTimed = false;

        for (let i = 0; i < this.#children.length; i++) {
            const obj = this.#children[i];
            if (obj !== child) {
                newChildren.push(obj);
                childrenTimed ||= obj.timed;
            }
        }

        this.#children = newChildren;
        this.#childrenTimed = childrenTimed;

        this.requestRecreate("object");
    }

    clearChildren() {
        this.#children.forEach(child => child.parent = null);  // 関係を切る
        this.#children = []
        this.#childrenTimed = false;
        this.requestRecreate("object");
    }

    /**
     * 
     * @param {number} t 
     */
    calculateOptions(t) { 
        let options = super.calculateOptions(t);

        /** @type {DrawNode[] | undefined} */ // WARN: optionsがanyなせいで……any解決したらこれは消せ
        let children = this.cachedNode?.options?.children;
        if (children === undefined || this.timed || this.objectChanged) {
            const childObjects = this.getAllChildren();
            if (childObjects.length === 1) {
                const childNode = childObjects[0].getSnapshot(t);
                children = [childNode];
            } else {
                children = childObjects.map(child => child.getSnapshot(t));

                children.sort((a, b) => a.zIndex - b.zIndex);
            }
        }

        return {
            ...options,
            width: this.width,
            height: this.height,
            children: children,
            clip: this.clip
        }
    }

    /**
     * 
     * @param {number} t 
     */
    createSnapshot(t) {
        const options = this.calculateOptions(t);
        return this.cachedNode?.with(options) ?? new ContainerNode(options);
    }

    get childrenPerfectlyOptimized() { return this.#childrenPerfectlyOptimized; }  // 永遠の負債 世話が焼けるわね！
    get perfectlyOptimized() { return this.constructor === Container && this.childrenPerfectlyOptimized; }
}

export class ContainerNode extends DrawNode {
    #children;
    /** @type {Path2D?} */
    #clipPath = null;
    #single;

    /**
     * @param {ContainerNodeOptions} options
     * @param {ContainerNode?} oldNode 
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
     * @param {Partial<ContainerNodeOptions>} options
     */
    with(options) {
        return new ContainerNode({...this.options, ...options}, this)
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

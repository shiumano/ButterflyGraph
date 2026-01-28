import { Anchor } from "./anchor.js";
import { DrawNode } from "./drawNode.js";
import { Gradient } from "./Gradients/gradient.js"
import { AnimationManager } from "./Animations/animationManager.js"

/**
 * @import { Vector2 } from "./vector2.js";
 * @import { DrawNodeOptions, GenericDrawNode, NodeOptions } from "./drawNode.js"
 * @typedef {{
 *   x?: number
 *   y?: number
 *   rotation?: number
 *   width?: number
 *   height?: number
 *   scale?: number
 *   scaleX?: number
 *   scaleY?: number
 *   alpha?: number
 *   anchor?: Readonly<Vector2>
 *   origin?: Readonly<Vector2>
 *   zIndex?: number
 *   visible?: boolean
 *   timed?: boolean
 *   showBounds?: boolean
 *   color?: string | CanvasGradient | CanvasPattern | Gradient
 *   fillStyle?: string | CanvasGradient | CanvasPattern | Gradient
 *   strokeStyle?: string | CanvasGradient | CanvasPattern | Gradient
 * }} DrawObjectOptions
 * @typedef {"transform" | "object"} RecreateReason
 * @typedef {DrawObject<GenericDrawNode>} GenericDrawObject
 */

/**
 * @template {GenericDrawNode} T
 * @typedef {{
 *   t: number | undefined
 *   node: T
 * }} DrawNodeCache t ... number:対応する時刻 undefined:時間的に不変
 */

// FIXME: get-onlyプロパティは弾くことができてない アニメーションのターゲットにしたら実行時エラーでドボン
/**
 * @template T
 * @typedef {{
 *   [K in keyof T]: T[K] extends Function ? never : K
 * }[keyof T]} Properties
 */

/**
 * @template {GenericDrawNode} T
 */
export class DrawObject {
    #x;
    #y;
    #rotation;
    #width;
    #height;
    #scaleX;
    #scaleY;
    #alpha;
    #anchor;
    #origin;
    #zIndex;
    #visible;
    #showBounds;
    #fillStyle;
    #strokeStyle;

    /** @type {DrawObject<T>?} */
    #parent = null;

    #timed = true;

    // 実際は必ずコンストラクタで値が設定されるが、フロー解析が追いつかない
    #originOffsetX = 0;
    #originOffsetY = 0;

    #transformChanged = true;
    #objectChanged = true;
    #contentChanged = true;
    /** @type {DrawNodeCache<T>?} */
    #nodeCache = null;

    /** @type {{[K in keyof this]?: AnimationManager<this[K]>}} */
    #animations = {};

    #animated = false;

    /**
     * @param {DrawObjectOptions} options
     */
    constructor(options = {}) {
        this.#x = options.x ?? 0;
        this.#y = options.y ?? 0;
        this.#rotation = options.rotation ?? 0;

        this.#width = options.width ?? 0;
        this.#height = options.height ?? 0;

        this.#scaleX = options.scaleX ?? options.scale ?? 1;
        this.#scaleY = options.scaleY ?? options.scale ?? 1;

        this.#alpha = options.alpha ?? 1;

        this.#anchor = options.anchor ?? Anchor.topLeft;
        this.#origin = options.origin ?? Anchor.topLeft;

        this.#zIndex = options.zIndex ?? 0;

        this.#visible = options.visible ?? true;

        this.#timed = options.timed ?? true;

        this.#showBounds = options.showBounds ?? false;

        this.#fillStyle = options.fillStyle ?? options.color ?? "#000";
        this.#strokeStyle = options.strokeStyle ?? "#000";

        this.#updateOriginOffset();
    }

    get x() { return this.#x; }
    set x(value) {
        if (this.#x === value) return;

        this.#x = value;
        this.requestRecreate("transform");
    }

    get y() { return this.#y; }
    set y(value) {
        if (this.#y === value) return;

        this.#y = value;
        this.requestRecreate("transform");
    }

    get rotation() { return this.#rotation; }
    set rotation(value) {
        if (this.#rotation === value) return;

        this.#rotation = value;
        this.requestRecreate("transform");
    }

    get width() { return this.#width; }
    set width(value) {
        if (this.#width === value) return;

        this.#width = value;
        this.#updateOriginOffset();
        this.requestRecreate("transform");  // PERF: requestRecreateは安易に呼ばないほうが良いよ width, heightはtransformとobject両方に関わるってのはわかるけども
        this.requestRecreate("object");
    }

    get height() { return this.#height; }
    set height(value) {
        if (this.#height === value) return;

        this.#height = value;
        this.#updateOriginOffset();
        this.requestRecreate("transform");
        this.requestRecreate("object");
    }

    // HACK: 縦横スケールが1:1じゃなかったらどうせ違う 適当に平均を返してあげよう
    get scale() { return (this.scaleX + this.scaleY) / 2; }
    set scale(value) {
        this.scaleX = value;
        this.scaleY = value;
    }

    get scaleX() { return this.#scaleX; }
    set scaleX(value) {
        if (this.#scaleX === value) return;

        this.#scaleX = value;
        this.#updateOriginOffset();
        this.requestRecreate("transform");
    }

    get scaleY() { return this.#scaleY; }
    set scaleY(value) {
        if (this.#scaleY === value) return;

        this.#scaleY = value;
        this.#updateOriginOffset();
        this.requestRecreate("transform");
    }

    get alpha() { return this.#alpha; }
    set alpha(value) {
        if (this.#alpha === value) return;

        this.#alpha = value;
        this.requestRecreate("transform");
    }

    get anchor() { return this.#anchor; }
    set anchor(value) {
        if (this.#anchor.equals(value)) return;

        this.#anchor = value.freeze();
        this.requestRecreate("transform");
    }

    get origin() { return this.#origin; }
    set origin(value) {
        if (this.#origin.equals(value)) return;

        this.#origin = value.freeze();
        this.#updateOriginOffset();
        this.requestRecreate("transform");
    }

    get zIndex() { return this.#zIndex; }
    set zIndex(value) {
        if (this.#zIndex === value) return;

        this.#zIndex = value;
        this.requestRecreate("transform");
    }

    get visible() { return this.#visible; }
    set visible(value) {
        if (this.#visible === value) return;

        this.#visible = value;
        this.requestRecreate("transform");
    }

    get showBounds() { return this.#showBounds; }
    set showBounds(value) {
        if (this.#showBounds === value) return;

        this.#showBounds = value;
        this.requestRecreate("object");
    }

    get color() { return this.fillStyle; }
    set color(value) { this.fillStyle = value; }

    get fillStyle() { return this.#fillStyle; }
    set fillStyle(value) {
        if (this.#fillStyle === value) return;

        this.#fillStyle = value;
        this.requestRecreate("object");
    }

    get strokeStyle() { return this.#strokeStyle; }
    set strokeStyle(value) {
        if (this.#strokeStyle === value) return;

        this.#strokeStyle = value;
        this.requestRecreate("object");
    }

    get parent() { return this.#parent; }
    set parent(value) {
        if (this.#parent === value) return;

        this.#parent = value;
        this.#updateOriginOffset();
        this.requestRecreate("transform");
    }

    get timed() { return this.#timed; }
    set timed(value) {
        if (this.#timed === value) return;

        this.#timed = value;
        this.requestRecreate("object");
    }

    get animated() { return this.#animated; }

    get originOffsetX() { return this.#originOffsetX; }
    get originOffsetY() { return this.#originOffsetY; }

    get transformChanged() { return this.#transformChanged || !this.perfectlyOptimized; }  // 変わったって言われてないかもしれない
    get objectChanged() { return this.#objectChanged || !this.perfectlyOptimized; }

    // ”描画した”という情報はRenderer側のものなので、外部からfalseに変更できるようにしている
    /**
     * オブジェクトの変化があったかどうかの”メモ”
     * Rendererは、このプロパティを参照することで、変化がない場合の再描画をスキップすることができる
     */
    get contentChanged() { return this.#contentChanged || !this.perfectlyOptimized; }
    set contentChanged(value) { this.#contentChanged = value; }

    get cachedNode() { return this.#nodeCache?.node; }

    /**
     * オブジェクトの再生性を要求、情報を親に伝播
     * @param {RecreateReason} reason
     */
    requestRecreate(reason) {
        this.#contentChanged = true;
        // console.log(reason, "changed by", this.constructor.name, performance.now())
        switch (reason) {
            case "transform":
                this.#transformChanged = true;
                break;
            case "object":
                this.#objectChanged = true;
                break;
        }

        this.parent?.requestRecreate("object");
    }

    // IDK: いつか#を_にして半公開するかも
    /**
     * オブジェクトの配置・回転中心を計算しキャッシュする
     */
    #updateOriginOffset() {
        this.#originOffsetX = this.width * this.origin.x * this.scaleX;
        this.#originOffsetY = this.height * this.origin.y * this.scaleY;
    }

    /**
     * AnimationManagerを登録する
     * @template {Properties<this>} P
     * @param {P} target
     * @param {(value: number) => this[P]} applyer
     */
    registerAnimationFor(target, applyer) {
        this.#animated = true;
        this.requestRecreate("object");

        const startValue = this[target];

        const manager = new AnimationManager(typeof startValue === "number" ? startValue : 0, applyer);
        this.#animations[target] = manager;

        return manager;
    }

    /**
     * AnimationManagerを取得する
     * @template {Properties<this>} P
     * @param {P} target
     */
    getAnimationFor(target) {
        return this.#animations[target];
    }

    /**
     * CanvasのstyleもしくはGradientBuilderを取得
     * @param {string | CanvasGradient | CanvasPattern | Gradient} style
     */
    getStyle(style) {
        if (style instanceof Gradient)
            return style.getGradientBuilder();
        else
            return style;
    }

    /**
     * 子オブジェクトのオプションの計算
     * @template {GenericDrawNode} N
     * @param {DrawObject<N>} child
     * @param {number} t
     * @returns {NodeOptions<N>}
     */
    calculateChildOptions(child, t) {
        const childOptions = child.calculateThisOptions(t);
        return {
            ...childOptions,
            x: child.x - child.originOffsetX + this.width * child.anchor.x,
            y: child.y - child.originOffsetY + this.height * child.anchor.y
        };
    }

    /**
     * 自分自身のオプションの計算
     * @param {number} t
     * @returns {NodeOptions<T>}
     */
    calculateThisOptions(t) {
        const hasCache = this.cachedNode !== undefined;
        const cacheOptions = hasCache ? this.cachedNode.options : {};
        const transforms = (!hasCache || this.transformChanged) ? this.calculateTransforms(t) : {};

        // TOOBAD: 実際の流れとしては正しいんだけど、TSが理解できる領域ではないらしい
        // @ts-expect-error
        return {
            ...cacheOptions,
            ...transforms,
            width: this.width,
            height: this.height,
            showBounds: this.showBounds
        };
    }

    /**
     * transformの計算
     * @param {number} t
     */
    calculateTransforms(t) {
        return {
            x: this.x - this.originOffsetX,
            y: this.y - this.originOffsetY,
            rotation: this.rotation,
            scaleX: this.scaleX,
            scaleY: this.scaleY,
            anchor: this.anchor,
            origin: this.origin,
            originOffsetX: this.originOffsetX,
            originOffsetY: this.originOffsetY,
            alpha: this.alpha,
            zIndex: this.zIndex,
            visible: this.visible,
        }
    }

    /**
     * アニメーションによる変化を計算
     * @param {number} t
     */
    calculateAnimations(t) {
        for (const target in this.#animations) {
            const manager = this.#animations[target];
            if (manager === undefined) continue;  // こうしないとTSは信用してくれない

            const calculatedValue = manager.get(t);

            this[target] = calculatedValue;
        }
    }

    /**
     * DrawNodeOptionsを生成
     * @param {number} t
     * @returns {DrawNodeOptions}
     */
    calculateOptions(t) {
        // TODO: objectChangedとtransformChangedを活用し、*ｲﾝﾃﾘｼﾞｪﾝﾄ*な差分更新を行う 関数を分けるのがだるすぎる
        // PERF: 一旦widthとかshowBoundsみたいなobject系もtransformChangedに巻沿い食わせて試したら10~11%→5~7%になった えぐい
        let options;

        if (this.parent != null) {
            options = this.parent.calculateChildOptions(this, t);
        } else {
            options = this.calculateThisOptions(t);
        }

        return options;
    }

    // 派生クラスで実装する必要があるので、あくまでこれはサンプル実装
    /**
     * 時間 t におけるこのオブジェクトの見た目を DrawNode 化する
     * @abstract
     * @param {number} t
     * @returns {T}
     */
    createSnapshot(t) {
        const options = this.calculateOptions(t);
        // new DrawNodeの出処を探してここに来たのかい？本当は別のNodeを返したかったのかな
        // 残念、あんたがcreateSnapshot(t)を定義しなかったせいでDrawNodeが返ってきたんだよ
        // @ts-expect-error
        return this.cachedNode?.with(options) ?? new DrawNode(options);
    }

    /**
     * DrawNodeを取得する
     * キャッシュを利用可能であればキャッシュを返す
     * @param {number} t
     */
    getSnapshot(t) {
        if (this.animated)
            this.calculateAnimations(t);

        let nodeCache = this.#nodeCache;
        if (nodeCache === null
            || (nodeCache.t !== undefined && nodeCache.t !== t)
            || this.transformChanged
            || this.objectChanged
        ) {
            nodeCache = {
                t: this.timed ? t : undefined,
                node: this.createSnapshot(t)
            };
            this.#nodeCache = nodeCache;
            this.#transformChanged = false;
            this.#objectChanged = false;
        }

        return nodeCache.node;
    }

    // requestRecreate(reason)を確実に呼び出し、キャッシュが再利用可能であると保証しますか？
    get perfectlyOptimized() { return this.constructor === DrawObject; }
}

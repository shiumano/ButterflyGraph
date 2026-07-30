import { Vector2 } from "./vector2.js";
import { Anchor } from "./anchor.js";
import { DrawNode } from "./drawNode.js";
import { Gradient } from "./Gradients/gradient.js";
import { AnimationManager } from "./Animations/animationManager.js";
import { direct } from "../Utils/unitConversion.js";
import { getDescriptor, classOf } from "../Utils/metaPrg.js";

/**
 * @import { Pos } from "./vector2.js";
 * @import { DrawNodeOptions } from "./drawNode.js"
 * @import { Properties } from "@core/Utils/metaPrg.js"
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
 *   anchor?: Readonly<Pos>
 *   origin?: Readonly<Pos>
 *   zIndex?: number
 *   visible?: boolean
 *   timed?: boolean
 *   showBounds?: boolean
 *   color?: string | CanvasGradient | CanvasPattern | Gradient
 *   fillStyle?: string | CanvasGradient | CanvasPattern | Gradient
 *   strokeStyle?: string | CanvasGradient | CanvasPattern | Gradient
 *   name?: string
 * }} DrawObjectOptions
 * @typedef {"transform" | "object" | "animationRegister" | "timed" | "children" | "zIndex"} RecreateReason
 */

/**
 * @template {DrawNode} T
 * @typedef {{
 *   t: number
 *   node: T?
 * }} DrawNodeCache
 */

/**
 * @template {DrawNode} [T=DrawNode]
 */
export class DrawObject {
    #name;  // DevToolsでトップに出る

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
    #transformCacheInvalid = true;

    /** @type {DrawNodeCache<T>} */
    #nodeCache = {
        t: NaN,
        node: null
    };

    /** @type {Map<string, AnimationManager>}} */
    #animationsMap = new Map();
    /** @type {AnimationManager[]} */
    #animations = [];

    #animated = false;

    /** @type {RecreateReason?} */
    #lastRecreateReason = null;

    // 名前が激突しないという性善説に基づいています
    /** @type {Map<string, typeof DrawObject>} */
    static #objectTypes = new Map();

    /**
     * @param {string} name
     */
    static getTypeByName(name) {
        return this.#objectTypes.get(name);
    }

    /**
     * @param {DrawObjectOptions} options
     */
    constructor({
        x = 0, y = 0, rotation = 0,
        width = 0, height = 0,
        scaleX, scaleY, scale = 1,
        alpha = 1,
        anchor = Anchor.topLeft, origin = Anchor.topLeft,
        zIndex = 0,
        visible = true,
        timed = true,
        showBounds = false,
        fillStyle, strokeStyle, color,
        name
    } = {}) {
        const thisCls = /** @type {typeof DrawObject} */ (classOf(this));
        // しょうがない: 叶うことならstaticコンストラクタでやりたいところだが、staticコンストラクタは継承しても呼ばれない
        //           : ↓のコストは軽くて無視できるレベルなんで、しょうがないで通す
        DrawObject.#objectTypes.set(thisCls.name, thisCls);

        this.#name = name ?? `${thisCls.name} (${this.#globalId})`;

        this.#x = x;
        this.#y = y;
        this.#rotation = rotation;

        this.#width = width;
        this.#height = height;

        this.#scaleX = scaleX ?? scale;
        this.#scaleY = scaleY ?? scale;

        this.#alpha = alpha;

        this.#anchor = Vector2.newFreeze(anchor);
        this.#origin = Vector2.newFreeze(origin);

        this.#zIndex = zIndex;

        this.#visible = visible;

        this.#timed = timed;

        this.#showBounds = showBounds;

        this.#fillStyle = fillStyle ?? color;
        this.#strokeStyle = strokeStyle;

        if (this.#fillStyle instanceof Gradient) {
            this.#fillStyle.mountTo(this);
        }
        if (this.#strokeStyle instanceof Gradient) {
            this.#strokeStyle.mountTo(this);
        }

        DrawObject.#finalizationRegistory.register(this, this.name);

        this.#updateOriginOffset();
    }

    get name() { return this.#name; }

    get x() { return this.#x; }
    set x(value) {
        if (this.#x === value) return;

        this.#x = value;
        this.requestRecreate(this, "transform");
    }

    get y() { return this.#y; }
    set y(value) {
        if (this.#y === value) return;

        this.#y = value;
        this.requestRecreate(this, "transform");
    }

    get rotation() { return this.#rotation; }
    set rotation(value) {
        if (this.#rotation === value) return;

        this.#rotation = value;
        this.requestRecreate(this, "transform");
    }

    get width() { return this.#width; }
    set width(value) {
        if (this.#width === value) return;

        this.#width = value;
        this.#updateOriginOffset();
        this.requestRecreate(this, "transform");  // PERF: requestRecreateは安易に呼ばないほうが良いよ width, heightはtransformとobject両方に関わるってのはわかるけども
        this.requestRecreate(this, "object");
    }

    get height() { return this.#height; }
    set height(value) {
        if (this.#height === value) return;

        this.#height = value;
        this.#updateOriginOffset();
        this.requestRecreate(this, "transform");
        this.requestRecreate(this, "object");
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
        this.requestRecreate(this, "transform");
    }

    get scaleY() { return this.#scaleY; }
    set scaleY(value) {
        if (this.#scaleY === value) return;

        this.#scaleY = value;
        this.#updateOriginOffset();
        this.requestRecreate(this, "transform");
    }

    get alpha() { return this.#alpha; }
    set alpha(value) {
        if (this.#alpha === value) return;

        this.#alpha = value;
        this.requestRecreate(this, "transform");
    }

    get anchor() { return this.#anchor; }
    set anchor(value) {
        if (this.#anchor.equals(value)) return;

        this.#anchor = value.freeze();
        this.requestRecreate(this, "transform");
    }

    get origin() { return this.#origin; }
    set origin(value) {
        if (this.#origin.equals(value)) return;

        this.#origin = value.freeze();
        this.#updateOriginOffset();
        this.requestRecreate(this, "transform");
    }

    get zIndex() { return this.#zIndex; }
    set zIndex(value) {
        if (this.#zIndex === value) return;

        this.#zIndex = value;
        this.requestRecreate(this, "zIndex");
    }

    get visible() { return this.#visible; }
    set visible(value) {
        if (this.#visible === value) return;

        this.#visible = value;
        this.requestRecreate(this, "transform");
    }

    get showBounds() { return this.#showBounds; }
    set showBounds(value) {
        if (this.#showBounds === value) return;

        this.#showBounds = value;
        this.requestRecreate(this, "object");
    }

    get color() { return this.fillStyle; }
    set color(value) { this.fillStyle = value; }

    get fillStyle() { return this.#fillStyle; }
    set fillStyle(value) {
        if (this.#fillStyle === value) return;

        if (this.#fillStyle instanceof Gradient && this.#fillStyle !== this.#strokeStyle) {
            this.#fillStyle.unmountFrom(this);
        }
        if (value instanceof Gradient) {
            value.mountTo(this);
        }

        this.#fillStyle = value;
        this.requestRecreate(this, "object");
    }

    get strokeStyle() { return this.#strokeStyle; }
    set strokeStyle(value) {
        if (this.#strokeStyle === value) return;

        if (this.#strokeStyle instanceof Gradient && this.#fillStyle !== this.#strokeStyle) {
            this.#strokeStyle.unmountFrom(this);
        }
        if (value instanceof Gradient) {
            value.mountTo(this);
        }

        this.#strokeStyle = value;
        this.requestRecreate(this, "object");
    }

    get parent() { return this.#parent; }
    set parent(value) {
        if (this.#parent === value) return;

        this.#parent = value;
        this.#updateOriginOffset();
        this.requestRecreate(this, "transform");
    }

    get timed() { return this.#timed; }
    set timed(value) {
        if (this.#timed === value) return;

        this.#timed = value;
        this.requestRecreate(this, "timed");
    }

    get animated() { return this.#animated; }

    get originOffsetX() { return this.#originOffsetX; }
    get originOffsetY() { return this.#originOffsetY; }
    get parentWidth() { return this.parent?.width ?? 0; }
    get parentHeight() { return this.parent?.height ?? 0; }

    get transformChanged() { return this.#transformChanged || !this.perfectlyOptimized; }  // 変わったって言われてないかもしれない
    get objectChanged() { return this.#objectChanged || !this.perfectlyOptimized; }

    // ”描画した”という情報はRenderer側のものなので、外部からfalseに変更できるようにしている
    /**
     * オブジェクトの変化があったかどうかの”メモ”
     * Rendererは、このプロパティを参照することで、変化がない場合の再描画をスキップすることができる
     */
    get contentChanged() { return this.#contentChanged || !this.perfectlyOptimized; }
    set contentChanged(value) { this.#contentChanged = value; }

    get transformCacheInvalid() { return this.#transformCacheInvalid || !this.perfectlyOptimized; }
    set transformCacheInvalid(value) { this.#transformCacheInvalid = value; }

    get cachedNode() { return this.#nodeCache.node; }

    /**
     * オブジェクトの再生性を要求、情報を親に伝播
     * @param {DrawObject} sender
     * @param {RecreateReason} reason
     */
    requestRecreate(sender, reason) {
        if (this.#lastRecreateReason === reason) return;
        this.#lastRecreateReason = reason;

        this.#contentChanged = true;
        // console.log(reason, "changed by", this.constructor.name, performance.now())
        switch (reason) {
            case "transform":
                this.#transformChanged = true;
                if (sender === this) {
                    this.#transformCacheInvalid = true;
                }
                break;
            case "object":
                this.#objectChanged = true;
                break;
        }

        this.#parent?.requestRecreate(this, reason);
    }

    // PERF: この4回の乗算のキャッシュがマジで効いた
    //  IDK: いつか#を_にして半公開するかも
    /**
     * オブジェクトの配置・回転中心を計算しキャッシュする
     */
    #updateOriginOffset() {
        this.#originOffsetX = this.width * this.origin.x * this.scaleX;
        this.#originOffsetY = this.height * this.origin.y * this.scaleY;
    }

    /**
     * AnimationManagerを登録する
     * @param {string} key
     * @param {(value: number) => void} applyer
     * @param {number} startValue
     */
    addAnimation(key, applyer, startValue = 0) {
        this.#animated = true;
        this.requestRecreate(this, "animationRegister");

        const manager = new AnimationManager(startValue, applyer);
        this.#animationsMap.set(key, manager);
        this.#animations.push(manager);

        return manager;
    }

    /**
     * AnimationManagerを取得する
     * @param {string} key
     */
    getAnimation(key) {
        return this.#animationsMap.get(key);
    }

    #randomPrefix = Math.random().toFixed(10);
    /** @param {string} key  */
    #animKey(key) { return this.#randomPrefix + key; }
    /**
     * @template {Properties<this>} P
     * @param {P} prop
     * @param {(value: number) => this[P]} convert
     */
    animate(prop, convert) {
        const manager = this.getAnimation(this.#animKey(prop));
        if (manager !== undefined) return manager;

        const descriptor = getDescriptor(this, prop);
        /** @type {(value: this[P]) => void} */
        const apl = descriptor?.set?.bind(this) ?? ((value) => { this[prop] = value; });

        /**
         * TSを丁寧に黙らせる
         * 0. 前提として、unitConversion.js/direct関数は、入力をそのまま出力するだけの関数
         * 1. animateの引数のconvertにnumber => this[P]ではない関数を入れようとしたら、その段階で型エラー
         * 2. direct関数はnumver => numberで、それがまかり通ってる時点でthis[P]はnumber
         * 3. ということでthis[P] => voidであるaplはnumber => voidである
         * 4. addAnimationの引数はnumber => void、そしてaplも前述の理由でnumber => void
         * 5. unitConversion.js/directは入力=出力なので、func(direct(arg))はfunc(arg)と全く同じ結果になる
         * よって、このチェックが通ればaplをそのままaddAnimationの引数に渡してもいい
         * PERF: 案外ここで作った(value) => apl(convert(value))がself timeを食う direct関数のselfはなんと0だが……
         *     : ただし！逆にapplyがmegamorphicになって若干applyのコストが上がる けど無名関数が挟まるよりは少しマシ
         *     : 今後JITが拗ねたら捨てていい
         * @template T
         * @param {(value: number) => T} func
         * @param {Function} _
         * @returns {_ is (value: number) => T}
         */
        const check = (func, _) => func === direct;

        return this.addAnimation(this.#animKey(prop), check(convert, apl) ? apl : (value) => apl(convert(value)));
    }

    /**
     * アニメーションによる変化を計算
     * @param {number} t
     */
    calculateAnimations(t) {
        for (let i = 0; i < this.#animations.length; i++) {
            this.#animations[i].apply(t);
        }
    }

    /**
     * DrawNodeOptionsを生成
     * @param {number} t
     * @returns {DrawNodeOptions}
     */
    calculateOptions(t) {
        return {
            x: this.#x,
            y: this.#y,
            rotation: this.#rotation,
            width: this.#width,
            height: this.#height,
            scaleX: this.#scaleX,
            scaleY: this.#scaleY,
            anchor: this.#anchor,
            origin: this.#origin,
            originOffsetX: this.#originOffsetX,
            originOffsetY: this.#originOffsetY,
            parentWidth: this.parentWidth,
            parentHeight: this.parentHeight,
            alpha: this.#alpha,
            fillStyle: this.#fillStyle,
            strokeStyle: this.#strokeStyle,
            visible: this.#visible,
            showBounds: this.#showBounds,
            transformChanged: this.transformChanged,
            objectChanged: this.objectChanged,
        };
    }

    // 派生クラスで実装する必要があるので、あくまでこれはサンプル実装
    /**
     * 時間 t におけるこのオブジェクトの見た目を DrawNode に適用する
     * @abstract
     * @param {number} t
     * @returns {T}
     */
    updateNode(t) {
        // new DrawNodeの出処を探してここに来たのかい？本当は別のNodeを返したかったのかな
        // 残念、あんたがcreateSnapshot(t)を定義しなかったせいでDrawNodeが返ってきたんだよ
        const node = this.cachedNode ?? /** @type {T} */ (new DrawNode());

        node.read(this);
        return node;
    }

    /**
     * DrawNodeを取得する
     * キャッシュを利用可能であればキャッシュを返す
     * @param {number} t
     */
    getSnapshot(t) {
        const nodeCache = this.#nodeCache;
        if (nodeCache.node === null
            || ((this.#timed || this.#animated) && nodeCache.t !== t)
            || this.transformChanged
            || this.objectChanged
        ) {
            this.calculateAnimations(t);

            nodeCache.t = t;
            nodeCache.node = this.updateNode(t);

            this.#transformChanged = false;
            this.#objectChanged = false;
        }

        this.#lastRecreateReason = null;

        return nodeCache.node;
    }

    toOptions() {
        /** @type {DrawObjectOptions} */
        const options = {};
        if (this.#x !== 0) options.x = this.#x;
        if (this.#y !== 0) options.y = this.#y;
        if (this.#rotation !== 0) options.rotation = this.#rotation;
        if (this.#width !== 0) options.width = this.#width;
        if (this.#height !== 0) options.height = this.#height;
        if (this.#scaleX !== 1) options.scaleX = this.#scaleX;
        if (this.#scaleY !== 1) options.scaleY = this.#scaleY;
        if (this.#alpha !== 1) options.alpha = this.#alpha;
        if (!this.#anchor.equals(Anchor.topLeft)) options.anchor = this.#anchor;  // Vector2.toJSONがあるのでシリアライズ安全
        if (!this.#origin.equals(Anchor.topLeft)) options.origin = this.#origin;
        if (this.#zIndex !== 0) options.zIndex = this.#zIndex;
        if (!this.#visible) options.visible = false;
        if (!this.#timed) options.timed = false;
        if (this.#showBounds) options.showBounds = true;
        if (this.#fillStyle !== undefined) options.fillStyle = this.#fillStyle;
        if (this.#strokeStyle !== undefined) options.strokeStyle = this.#strokeStyle;

        return options;
    }

    toJSON() {
        return {
            type: classOf(this).name,
            options: this.toOptions()
        };
    }

    /**
     * requestRecreate(sender, reason)を確実に呼び出し、キャッシュが再利用可能であると保証しますか？
     */
    isPerfectlyOptimized() { return classOf(this) === DrawObject; }

    #perfectlyOptimized = this.isPerfectlyOptimized();
    get perfectlyOptimized() { return this.#perfectlyOptimized; }

    // スーパー簡易グローバルID
    static #globalCreatedCount = 0;
    static get globalCreatedCount() { return this.#globalCreatedCount; }
    #globalId = DrawObject.#globalCreatedCount++;
    get globalId() { return this.#globalId; }

    static #finalizedCount = 0;
    static #finalizationRegistory = new FinalizationRegistry(() => this.#finalizedCount++);
    static get finalizedCount() { return this.#finalizedCount; }
}

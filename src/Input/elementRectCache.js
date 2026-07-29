export class ElementRectCache {
    #element;
    #cache = { top: 0, bottom: 0, left: 0, right: 0 };
    #dpr = 1;
    // 監視用ハンドラのバインド
    #bindedUpdate = this.#update.bind(this);
    #bindedUpdateDpr = this.#updateDpr.bind(this);

    /** @type {WeakMap<HTMLElement, ElementRectCache>} */
    static #cacheRegistory = new WeakMap();

    // 参考: https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Classes/Private_elements#プライベートコンストラクターをシミュレーション
    static #constructing = false;
    /**
     * @param {HTMLElement} element
     */
    constructor(element) {
        if (!ElementRectCache.#constructing) {
            throw new TypeError("ElementRectCache is not constructible.");
        }
        ElementRectCache.#constructing = false;

        this.#element = element;

        this.#init();
    }

    get rect() { return this.#cache; }
    get dpr() { return this.#dpr; }

    /**
     * @param {HTMLElement} element
     */
    static getCache(element) {
        return this.#cacheRegistory.getOrInsertComputed(element, () => {
            this.#constructing = true;
            return new ElementRectCache(element);
        });
    }

    // キャッシュの更新処理
    #update() {
        const cache = this.#cache;
        const rect = this.#element.getBoundingClientRect();

        cache.top = rect.top;
        cache.bottom = rect.bottom;
        cache.left = rect.left;
        cache.right = rect.right;
    }

    #updateDpr() {
        const dpr = window.devicePixelRatio;
        this.#dpr = dpr;
        const media = matchMedia(`(resolution: ${dpr}dppx)`);
        media.addEventListener("change", this.#bindedUpdateDpr, { once: true });
        this.#update();
    }

    #init() {
        // 2. 要素自身のサイズ変更を監視
        this.resizeObserver = new ResizeObserver(this.#bindedUpdate);
        this.resizeObserver.observe(this.#element);

        // 3. ウィンドウのリサイズやスクロールで位置が変わるため監視
        //    ※パフォーマンス向上のため { passive: true } を指定
        window.addEventListener("resize", this.#bindedUpdate, { passive: true });
        window.addEventListener("scroll", this.#bindedUpdate, { passive: true, capture: true });

        // 1. 初回のキャッシュ作成
        this.#updateDpr();
    }

    // メモリリーク防止用の破棄メソッド
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        window.removeEventListener("resize", this.#bindedUpdate);
        window.removeEventListener("scroll", this.#bindedUpdate, { capture: true });
    }
}

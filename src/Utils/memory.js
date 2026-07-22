/**
 * @template {WeakKey} T
 */
export class WeakArray {
    /** @type {WeakRef<T>[]} */
    #weakRefs = [];

    /**
     * @param {T} obj
     */
    push(obj) {
        this.#weakRefs.push(new WeakRef(obj));
    }

    /**
     * @remarks strongReferenceは強参照を作ります、使い終わったらlengthを0にしましょう
     * @param {T[]} strongReference
     */
    deref(strongReference) {
        const refs = this.#weakRefs;
        let length = 0;

        for (let i = refs.length - 1; i >= 0; i--) {
            const obj = refs[i].deref();
            if (obj !== undefined) {
                strongReference[length] = obj;
                length++;
            } else {
                refs.splice(i, 1);
            }
        }
        strongReference.length = length;

        return length;
    }
}

/**
 * @template {WeakKey} K
 * @template V
 * @param {WeakMap<K, V>} map
 * @param {K} key
 * @param {() => V} create
 */
export function ensureCache(map, key, create) {
    const current = map.get(key);
    if (current !== undefined) return current;

    const created = create();
    map.set(key, created);
    return created;
}

/**
 * @template {WeakKey} T
 */
export class WeakArray {
    /** @type {WeakRef<T>[]} */
    #weakRefs = [];
    /** @type {T[]} */
    #tmpStrongRefs = [];

    /**
     * @param {T} obj
     */
    push(obj) {
        this.#weakRefs.push(new WeakRef(obj));
    }

    // しょうがない: 似たようなコードが大量に出てくるが、WeakRefってのは面倒なものだからこうするしかない
    /**
     * @param {T} obj
     */
    remove(obj) {
        const refs = this.#weakRefs;
        for (let i = 0; i < refs.length; i++) {
            if (refs[i].deref() === obj) {
                refs.splice(i, 1);
                return;
            }
        }
    }

    /**
     * @param {T} obj
     */
    includes(obj) {
        const stringReference = this.#tmpStrongRefs;
        this.deref(stringReference);

        const objIncludes = stringReference.includes(obj);
        stringReference.length = 0;

        return objIncludes;
    }

    /**
     * @param {(value: T) => void} callbackFn
     */
    forEach(callbackFn) {
        const refs = this.#weakRefs;

        for (let i = refs.length - 1; i >= 0; i--) {
            const obj = refs[i].deref();
            if (obj !== undefined) {
                callbackFn(obj);
            } else {
                refs.splice(i, 1);
            }
        }
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
 * @template K
 * @template V
 * @param {K extends WeakKey ? WeakMap<K, V> | Map<K, V> : Map<K, V>} map
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

/**
 * @template K
 * @template V
 * @param {K extends WeakKey ? WeakMap<K, V> | Map<K, V> : Map<K, V>} map
 * @param {K} key
 * @param {() => Promise<V>} create
 */
export async function ensureCacheAsync(map, key, create) {
    const current = map.get(key);
    if (current !== undefined) return current;

    const created = await create();
    map.set(key, created);
    return created;
}

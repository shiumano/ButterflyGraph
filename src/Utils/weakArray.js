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
        const strongReference = this.#tmpStrongRefs;
        this.deref(strongReference);

        const objIncludes = strongReference.includes(obj);
        strongReference.length = 0;

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

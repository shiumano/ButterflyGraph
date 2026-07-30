import { DrawObject } from "../Graphics/drawObject.js";
import { Gradient } from "../Graphics/Gradients/gradient.js";
import { ImageInfo } from "../Graphics/Objects/imageInfo.js";

/**
 * @param {string} text
 * @param {(this: any, key: string, value: any) => Promise<any>} reviver
 */
export async function parseAsync(text, reviver) {
    const root = JSON.parse(text);

    /**
     * @param {any} holder
     * @param {string} key
     */
    async function walk(holder, key) {
        const value = holder[key];
        if (value && typeof value === "object") {
            for (const k of Object.keys(value)) {
                value[k] = await walk(value, k);
            }
        }
        return await reviver.call(holder, key, value);
    }

    return await walk({ "": root }, "");
}

// 何もしとらんやん
/**
 * @param {string} _
 * @param {any} value
 */
export function butterflyGraphReplacer(_, value) {
    return value;
}

/**
 * @param {string} _
 * @param {unknown} value
 */
export async function butterflyGraphReviver(_, value) {
    if (value === null || typeof value !== "object") return value;
    if (!("type" in value) || typeof value.type !== "string") return value;

    const type = value.type;
    console.log(value);
    if (type === ImageInfo.name) {
        if (!("url" in value) || typeof value.url !== "string") throw new Error(`The type was ${type}, but the "url" property is missing.`);

        return await ImageInfo.fromURL(value.url);
    }

    if (Gradient.gradientTypeNames.find((name) => name === type)) {
        const gradientCls = Gradient.getTypeByName(type);

        if (gradientCls === undefined) throw new Error(`Gradient type ${type} was not found.`);
        if (
            !("stops" in value) || !Array.isArray(value.stops) ||
            !("args" in value) || !Array.isArray(value.args)
        ) throw new Error(`The type was ${type}, but the "stops" or "args" property is missing.`);

        return new gradientCls(...value.args, value.stops);

    }

    if (!("options" in value) || typeof value.options !== "object" || value.options === null) return value;

    const { options = {} } = value;
    const cls = DrawObject.getTypeByName(type);

    if (cls === undefined) throw new Error(`DrawObject type ${type} was not found.`);

    return new cls(options);
}


/**
 * @param {DrawObject} drawObject
 * @param {(this: any, key: string, value: any) => any} replacer
 */
export function serialize(drawObject, replacer = butterflyGraphReplacer) {
    return JSON.stringify(drawObject, replacer);
}

/**
 * @param {string} text
 * @param {(this: any, key: string, value: any) => Promise<any>} reviver
 */
export async function deserialize(text, reviver = butterflyGraphReviver) {
    const parsed = /** @type {unknown} */ (await parseAsync(text, reviver));

    // serialize()でシリアライズしたものなら、DrawObjectを引数としているはず
    if (!(parsed instanceof DrawObject)) throw new Error("An object that is not a ButterflyGraph object was parsed.");

    return /** @type {DrawObject} */ (parsed);
}

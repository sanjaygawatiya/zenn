export function canonicalStringify(value) {
    if (value === null)
        return 'null';
    if (value === undefined)
        return 'undefined';
    if (Array.isArray(value)) {
        return '[' + value.map(canonicalStringify).join(',') + ']';
    }
    if (typeof value === 'object') {
        const obj = value;
        const sortedKeys = Object.keys(obj).sort();
        const parts = sortedKeys.map((key) => `"${key}":${canonicalStringify(obj[key])}`);
        return '{' + parts.join(',') + '}';
    }
    return JSON.stringify(value);
}

export function deepFreeze(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj === 'object') {
        const record = obj;
        Object.keys(record).forEach((key) => {
            const value = record[key];
            if (typeof value === 'object' && value !== null) {
                deepFreeze(value);
            }
        });
        Object.freeze(obj);
    }
    return obj;
}

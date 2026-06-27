export function deepFreeze<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'object') {
    const record = obj as Record<string, unknown>;
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

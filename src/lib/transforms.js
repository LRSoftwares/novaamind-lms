export function toCamel(obj) {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, l) => l.toUpperCase()),
      v,
    ])
  );
}

export function toSnake(obj) {
  if (Array.isArray(obj)) return obj.map(toSnake);
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([k]) => k !== 'created_at' && k !== 'createdAt')
      .map(([k, v]) => [
        k.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`),
        v,
      ])
  );
}

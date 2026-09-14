export function pick(obj, fields) {
  if (!fields?.length) return { ...obj };
  const fieldSet = new Set(fields);
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => fieldSet.has(k))
  );
}

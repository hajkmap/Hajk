export function pick(obj, fields) {
  if (!fields?.length) return { ...obj }; // return a copy to avoid mutation
  const fieldSet = new Set(fields); // O(m) to build, O(1) lookup
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => fieldSet.has(k))
  );
}

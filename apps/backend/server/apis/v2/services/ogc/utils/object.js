export function pick(obj, fields) {
  if (!fields?.length) return { ...obj }; // return a copy to avoid mutation
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => fields.includes(k))
  );
}

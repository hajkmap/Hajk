/* === Helpers === */
export const isEditableField = (meta) => !meta.readOnly;

export function getIdsForDeletion(selectedIds, focusedId) {
  if (selectedIds && selectedIds.size) return Array.from(selectedIds);
  return focusedId != null ? [focusedId] : [];
}

export function computeIdsToMarkForDelete(
  selectedIds,
  focusedId,
  tablePendingDeletes
) {
  const ids = selectedIds?.size
    ? Array.from(selectedIds)
    : focusedId != null
      ? [focusedId]
      : [];
  if (!ids.length) return [];
  return ids.filter((id) => !tablePendingDeletes?.has?.(id));
}

export function getNextGeoidSeed(rows) {
  const nums = rows
    .map((r) => Number(r.geoid))
    .filter((n) => Number.isFinite(n));
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

export function isMissingValue(v) {
  return v == null || v === "";
}

export function renderInput(meta, value, onChange, isChanged, s) {
  const inputStyle = isChanged ? s.inputChanged : s.input;
  const common = {
    style: inputStyle,
    value: value ?? "",
    onChange: (e) => onChange(e.target.value),
  };
  if (meta.readOnly) return <input {...common} readOnly />;
  if (meta.type === "textarea") return <textarea {...common} rows={3} />;
  if (meta.type === "select") {
    return (
      <select
        style={inputStyle}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {(meta.options || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  return <input {...common} />;
}

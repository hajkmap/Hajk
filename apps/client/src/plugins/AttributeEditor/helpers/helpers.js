/* === Helpers === */
export const isEditableField = (meta) => !meta?.readOnly;

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

export function renderInput(meta, value, onChange, isChanged, s, opts = {}) {
  const baseStyle = isChanged ? { ...s.input, ...s.inputChanged } : s.input;
  const {
    enterCommits = false,
    multiline = false,
    fieldKey,
    registerTextareaRef,
    requestFocusCaret,
    autoFocus = false,
  } = opts;

  const inputStyle = isChanged ? s.inputChanged : s.input;

  const common = {
    style: inputStyle,
    value: value ?? "",
    onChange: (e) => onChange(e.target.value),
    ...(autoFocus ? { autoFocus: true } : {}),
    onKeyDown: enterCommits
      ? (e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.currentTarget.blur();
            return;
          }
          if (e.key !== "Enter") return;

          if (e.altKey) {
            e.preventDefault();
            const el = e.currentTarget;
            const start = el.selectionStart ?? el.value?.length ?? 0;
            const end = el.selectionEnd ?? el.value?.length ?? 0;
            const next =
              (el.value ?? "").slice(0, start) +
              "\n" +
              (el.value ?? "").slice(end);
            onChange(next);

            if (el.tagName === "INPUT") {
              requestFocusCaret?.(fieldKey, start + 1);
            } else {
              requestAnimationFrame(() => {
                try {
                  el.selectionStart = el.selectionEnd = start + 1;
                } catch {}
              });
            }
            return;
          }
          e.preventDefault();
          e.currentTarget.blur();
        }
      : undefined,
  };

  if (meta.readOnly) return <input {...common} readOnly />;

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

  if (meta.type === "date") {
    return (
      <input
        type="date"
        style={{
          ...baseStyle,
          WebkitAppearance: "none",
          MozAppearance: "textfield",
        }}
        value={String(value ?? "").slice(0, 10)}
        onChange={(e) => onChange(e.target.value || null)}
      />
    );
  }

  return multiline ? (
    <textarea
      {...common}
      rows={8}
      ref={(el) => registerTextareaRef?.(fieldKey, el)}
    />
  ) : (
    <input {...common} />
  );
}

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

export function renderTableCellDisplay({ meta, value, s }) {
  if (meta.type === "boolean") {
    const checked =
      value === true || value === "true" || value === 1 || value === "1";
    return (
      <span
        style={{
          display: "inline-flex",
          gap: 6,
          alignItems: "center",
          whiteSpace: "nowrap",
        }}
      >
        <input type="checkbox" checked={checked} readOnly />
        <span>{checked ? "Ja" : "Nej"}</span>
      </span>
    );
  }

  // DATE
  if (meta.type === "date") {
    return <span>{String(value ?? "").slice(0, 10)}</span>;
  }

  // DATETIME
  if (meta.type === "datetime") {
    const sVal = String(value ?? "");
    return <span>{sVal ? sVal.slice(0, 16).replace("T", " ") : ""}</span>;
  }

  // MULTISELECT
  if (meta.type === "multiselect") {
    const arr = Array.isArray(value)
      ? value
      : value
        ? String(value)
            .split(",")
            .map((s) => s.trim())
        : [];
    return <span>{arr.join(", ")}</span>;
  }

  // Standard
  return <span>{value == null ? "" : String(value)}</span>;
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

  if (
    meta.type === "select" ||
    (Array.isArray(meta.options) && meta.options.length && !meta?.multiple)
  ) {
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

  // boolean (checkbox)
  if (meta.type === "boolean") {
    const checked =
      value === true || value === "true" || value === 1 || value === "1";
    return (
      <label
        style={{
          display: "inline-flex",
          gap: "0.5rem",
          alignItems: "center",
          whiteSpace: "nowrap",
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{checked ? "Ja" : "Nej"}</span>
      </label>
    );
  }

  // integer / number
  if (meta.type === "integer" || meta.type === "number") {
    return (
      <input
        type="number"
        style={inputStyle}
        value={value ?? ""}
        step={meta.type === "integer" ? 1 : "any"}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") return onChange("");
          const num = meta.type === "integer" ? parseInt(v, 10) : parseFloat(v);
          onChange(Number.isFinite(num) ? num : "");
        }}
      />
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

  // datetime/timestamp
  if (meta.type === "datetime") {
    const toLocal = (val) => (!val ? "" : String(val).slice(0, 16)); // YYYY-MM-DDTHH:mm
    return (
      <input
        type="datetime-local"
        style={inputStyle}
        value={toLocal(value)}
        onChange={(e) => onChange(e.target.value || null)}
      />
    );
  }

  if (
    meta.type === "multiselect" ||
    (meta?.multiple && Array.isArray(meta.options))
  ) {
    const arr = Array.isArray(value)
      ? value
      : value
        ? String(value)
            .split(",")
            .map((s) => s.trim())
        : [];
    return (
      <select
        multiple
        style={{ ...inputStyle, height: "8rem" }}
        value={arr}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions).map(
            (o) => o.value
          );
          onChange(selected);
        }}
      >
        {(meta.options || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
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

function ensureArray(val) {
  if (Array.isArray(val)) return val;
  if (val == null || val === "") return [];
  return String(val)
    .split(",")
    .map((s) => s.trim());
}

function withUnknown(options = [], currentVals = []) {
  const opts = Array.isArray(options) ? options : [];
  const curr = Array.isArray(currentVals) ? currentVals : [currentVals];
  const unknown = curr.filter((v) => v && !opts.includes(v));
  return {
    optionsWithUnknown: [...unknown, ...opts],
    unknownSet: new Set(unknown),
  };
}

/**
 * Renders a cell editor for TableMode based on the FIELD_META type.
 * - Handles multiselect/select (including "unknown value")
 * - Supports date/datetime/boolean/integer/number/textarea/text
 */
export function renderTableCellEditor({
  meta,
  editingValue,
  editorProps, // {...editorProps} from TableMode
  applyChange, // (nextVal) => void
  s, // styles-object
  useTextarea,
}) {
  // MULTISELECT
  if (
    meta.type === "multiselect" ||
    (meta?.multiple && Array.isArray(meta.options))
  ) {
    const current = ensureArray(editingValue);
    const { optionsWithUnknown, unknownSet } = withUnknown(
      meta.options,
      current
    );

    return (
      <select
        {...editorProps}
        multiple
        value={current}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions).map(
            (o) => o.value
          );
          applyChange(selected);
        }}
        style={{ ...s.cellInput, height: "10rem" }}
      >
        {optionsWithUnknown.map((opt) => (
          <option key={opt} value={opt}>
            {unknownSet.has(opt) ? `${opt} (okänt värde)` : opt}
          </option>
        ))}
      </select>
    );
  }

  // SINGLE SELECT
  if (
    meta.type === "select" ||
    (Array.isArray(meta.options) && meta.options.length)
  ) {
    const val = editingValue ?? "";
    const opts = Array.isArray(meta.options) ? meta.options : [];
    const hasVal = val !== "" && opts.includes(String(val));
    const optionsWithUnknown = hasVal
      ? opts
      : val
        ? [String(val), ...opts]
        : opts;

    return (
      <select
        {...editorProps}
        value={val}
        onChange={(e) => applyChange(e.target.value)}
        style={s.cellInput}
      >
        {optionsWithUnknown.map((opt) => (
          <option key={opt} value={opt}>
            {!hasVal && String(val) === String(opt)
              ? `${opt} (okänt värde)`
              : opt}
          </option>
        ))}
      </select>
    );
  }

  // BOOLEAN
  if (meta.type === "boolean") {
    const checked =
      editingValue === true ||
      editingValue === "true" ||
      editingValue === 1 ||
      editingValue === "1";
    return (
      <label
        style={{
          display: "inline-flex",
          gap: 8,
          alignItems: "center",
          whiteSpace: "nowrap",
        }}
      >
        <input
          {...editorProps}
          type="checkbox"
          checked={checked}
          onChange={(e) => applyChange(e.target.checked)}
        />
        <span>{checked ? "Ja" : "Nej"}</span>
      </label>
    );
  }

  // DATE
  if (meta.type === "date") {
    return (
      <input
        {...editorProps}
        type="date"
        value={String(editingValue ?? "").slice(0, 10)}
        onChange={(e) => applyChange(e.target.value || null)}
      />
    );
  }

  // DATETIME
  if (meta.type === "datetime") {
    const toLocal = (val) => (!val ? "" : String(val).slice(0, 16)); // YYYY-MM-DDTHH:mm
    return (
      <input
        {...editorProps}
        type="datetime-local"
        value={toLocal(editingValue)}
        onChange={(e) => applyChange(e.target.value || null)}
      />
    );
  }

  // NUMBER/INTEGER
  if (meta.type === "integer" || meta.type === "number") {
    return (
      <input
        {...editorProps}
        type="number"
        step={meta.type === "integer" ? 1 : "any"}
        value={editingValue ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") return applyChange("");
          const num = meta.type === "integer" ? parseInt(v, 10) : parseFloat(v);
          applyChange(Number.isFinite(num) ? num : "");
        }}
      />
    );
  }

  // TEXT / TEXTAREA
  if (useTextarea) {
    return <textarea {...editorProps} rows={8} />;
  }
  return <input {...editorProps} type="text" />;
}

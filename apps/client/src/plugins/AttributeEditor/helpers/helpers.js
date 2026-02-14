/* === Helpers === */
const idAliasCache = new Map();
const CACHE_MAX_SIZE = 10000;

export const isEditableField = (meta) => !meta?.readOnly;

/**
 * Extracts the canonical ID from an OpenLayers Feature.
 * Handles different ID property locations consistently.
 * @param {Feature} feature - OL Feature object
 * @param {string} [idField] - Optional custom ID field name from configuration
 * @returns {string|number|null} The feature ID or null
 */
export function getFeatureId(feature, idField) {
  if (!feature) return null;
  // If a custom idField is configured, try that first
  if (idField) {
    const customId = feature.get?.(idField);
    if (customId != null) return customId;
  }
  // Fallback to standard ID properties
  return (
    feature.get?.("id") ?? feature.get?.("@_fid") ?? feature.getId?.() ?? null
  );
}

/**
 * Normalizes an ID for comparison (handles string/number mismatches).
 * Returns the value as-is — kept for backward compatibility.
 * @param {string|number} id
 * @returns {string|number}
 */
export function normalizeId(id) {
  if (id == null) return "";
  return id;
}

/**
 * Checks whether an ID represents a draft (temporary, unsaved) feature.
 * Drafts have negative numeric IDs (e.g. -1, -2, or "-1").
 * Works with both number and string types.
 * @param {string|number} id
 * @returns {boolean}
 */
export function isDraftId(id) {
  const n = Number(id);
  return Number.isFinite(n) && n < 0;
}

/**
 * Compares two IDs for equality, handling type coercion.
 * @param {string|number} a
 * @param {string|number} b
 * @returns {boolean}
 */
export function idsEqual(a, b) {
  if (a == null || b == null) return a === b;
  return String(a) === String(b);
}

/**
 * Finds a feature/row by ID in an array, with type-safe comparison.
 * @param {Array} items - Array of objects with 'id' property
 * @param {string|number} targetId - ID to find
 * @returns {Object|undefined}
 */
export function findById(items, targetId) {
  if (!Array.isArray(items) || targetId == null) return undefined;
  const targetStr = String(targetId);
  return items.find((item) => String(item?.id) === targetStr);
}

/**
 * Creates an effective row by merging base data with pending edits.
 * @param {Object} base - Base row data
 * @param {Object} pendingEdits - Object keyed by ID with edit objects
 * @returns {Object} Merged row
 */
export function getEffectiveRow(base, pendingEdits) {
  if (!base) return null;
  const edits = pendingEdits?.[base.id];
  return edits ? { ...base, ...edits } : base;
}

/**
 * Creates a Map for O(1) lookups from an array of items with 'id' property.
 * @param {Array} items - Array of objects with 'id' property
 * @returns {Map}
 */
export function createIdMap(items) {
  const map = new Map();
  if (!Array.isArray(items)) return map;
  for (const item of items) {
    if (item?.id != null) {
      map.set(item.id, item);
      map.set(String(item.id), item);
    }
  }
  return map;
}

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

/**
 * Checks if a value is considered "missing" or empty.
 * Consistent check across the codebase.
 * @param {*} v - Value to check
 * @returns {boolean}
 */
export function isMissingValue(v) {
  return v == null || v === "";
}

/**
 * Normalizes a value to an empty string if null/undefined.
 * Use for consistent display/comparison.
 * @param {*} v - Value to normalize
 * @returns {string}
 */
export function normalizeValue(v) {
  return v == null ? "" : v;
}

/**
 * Compares two values for equality, treating null/undefined/"" as equivalent.
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
export function valuesEqual(a, b) {
  const normA = a == null ? "" : a;
  const normB = b == null ? "" : b;
  return normA === normB;
}

/**
 * Determines if a value should be rendered as a multiline textarea.
 * Checks for newlines, long text, or long tokens (e.g., URLs).
 */
export function autoIsMultiline(val, meta) {
  const s = String(val ?? "");
  if (!s) return false;
  if (s.includes("\n")) return true;
  const limit = meta.wrapCh ?? 100;
  if (s.length >= limit) return true;
  const hasLongToken = s
    .split(/\s+/)
    .some((tok) => tok.length >= Math.max(30, Math.floor(limit * 0.6)));
  return hasLongToken;
}

export function renderTableCellDisplay({
  meta,
  value,
  s,
  selected = true,
  columnWidth,
}) {
  // Calculate max length based on column width (roughly 7-8px per character)
  // Default to 30 characters if no width is provided
  const MAX_LENGTH = columnWidth ? Math.floor(columnWidth / 7.5) : 30;

  const truncate = (str) => {
    if (selected || !str || str.length <= MAX_LENGTH) return str;
    return str.slice(0, MAX_LENGTH) + "...";
  };

  // URL (clickable in display mode)
  if (meta.type === "url") {
    const str = String(value ?? "");
    if (!str) return <span />;
    const href = /^(https?:)?\/\//i.test(str) ? str : `https://${str}`;
    const displayText = truncate(str);
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" title={str}>
        {displayText}
      </a>
    );
  }

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
    return <span>{sVal ? sVal.slice(0, 19).replace("T", " ") : ""}</span>;
  }

  // MULTISELECT
  if (meta.type === "multiselect") {
    const arr = Array.isArray(value)
      ? value
      : value
        ? String(value)
            .split(";")
            .map((s) => s.trim())
        : [];
    const joined = arr.join(";");
    return <span>{truncate(joined)}</span>;
  }

  // Standard
  const str = value == null ? "" : String(value);
  return <span>{truncate(str)}</span>;
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
        <option value="" disabled>
          -- Välj {meta.label?.toLowerCase() || "värde"} --
        </option>

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
    const toLocal = (val) => (!val ? "" : String(val).slice(0, 19)); // YYYY-MM-DDTHH:mm:ss
    return (
      <input
        type="datetime-local"
        style={inputStyle}
        value={toLocal(value)}
        step="1" // seconds
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
            .split(";")
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
    .split(";")
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
        <option value="" disabled>
          -- Välj {meta.label?.toLowerCase() || "värde"} --
        </option>

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
    const toLocal = (val) => (!val ? "" : String(val).slice(0, 19)); // YYYY-MM-DDTHH:mm:ss
    return (
      <input
        {...editorProps}
        type="datetime-local"
        step="1" // seconds
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

export function idAliases(x) {
  if (x == null) return [];

  const s = String(x);

  // Check the cache first
  if (idAliasCache.has(s)) {
    return idAliasCache.get(s);
  }

  const out = new Set();

  // Always include the original string representation
  out.add(s);

  // If it's purely numeric, also add as number
  if (/^-?\d+$/.test(s)) {
    out.add(Number(s));
  }

  // If it has a dot AND the suffix is numeric, add BOTH full string and numeric suffix
  const lastDot = s.lastIndexOf(".");
  if (lastDot > 0) {
    const tail = s.slice(lastDot + 1);
    if (/^-?\d+$/.test(tail)) {
      // Only add numeric suffix if we're confident it won't collide
      // (i.e., only for known service patterns like "servicename.123")
      out.add(Number(tail));
    }
  }

  const result = Array.from(out);

  if (idAliasCache.size >= CACHE_MAX_SIZE) {
    // Remove oldest entry (first in Map)
    const firstKey = idAliasCache.keys().next().value;
    idAliasCache.delete(firstKey);
  }
  idAliasCache.set(s, result);

  return result;
}

export function pickPreferredId(aliases) {
  // Prefer numbers over strings for consistency
  const num = aliases.find((a) => typeof a === "number");
  return num ?? aliases[0] ?? null;
}

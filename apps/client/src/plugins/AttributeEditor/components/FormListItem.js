import React from "react";

const FormListItem = ({
  row,
  idx,
  FIELD_META,
  s,
  selected,
  isFocused,
  isPendingDelete,
  hasPendingEdits,
  hasGeomChange,
  isDraftAdd,
  onFormRowClick,
  selectedRowRefs,
}) => {
  const makeRowPreview = (row, FIELD_META) => {
    const keys = FIELD_META.map((m) => m.key);
    const contentKeys = keys.filter(
      (k) => !["id", "geoid", "oracle_geoid"].includes(k)
    );
    const parts = [];
    if (row.id != null && row.id !== "") parts.push(String(row.id));
    for (const k of contentKeys) {
      const v = row[k];
      if (v != null && v !== "") {
        parts.push(String(v));
        if (parts.length >= 3) break;
      }
    }
    return parts.join(" • ");
  };

  const status = isPendingDelete
    ? "delete"
    : hasGeomChange
      ? "geom"
      : hasPendingEdits
        ? "edit"
        : isDraftAdd
          ? "add"
          : null;

  return (
    <div
      ref={(el) => {
        if ((selected || isFocused) && selectedRowRefs) {
          selectedRowRefs.current.set(row.id, el);
        } else if (selectedRowRefs) {
          selectedRowRefs.current.delete(row.id);
        }
      }}
      data-row-id={row.id}
      style={s.listRow(selected, status, isFocused, false)}
      onClick={(e) => onFormRowClick(row.id, idx, e)}
    >
      <div>
        <div style={s.listRowText}>
          <div style={s.listRowTitle}>
            {makeRowPreview(row, FIELD_META)}
            {hasPendingEdits && (
              <span style={s.labelChanged}>&nbsp;• ändrad</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
/*},
  (prevProps, nextProps) => {
    // Re-render if relevant data changes

    // Row ID changed
    if (prevProps.row.id !== nextProps.row.id) return false;

    // Selection state changed
    if (prevProps.selected !== nextProps.selected) return false;

    // Focus state changed
    if (prevProps.isFocused !== nextProps.isFocused) return false;

    // Pending states changed
    if (prevProps.isPendingDelete !== nextProps.isPendingDelete) return false;
    if (prevProps.hasPendingEdits !== nextProps.hasPendingEdits) return false;
    if (prevProps.hasGeomChange !== nextProps.hasGeomChange) return false;
    if (prevProps.isDraftAdd !== nextProps.isDraftAdd) return false;

    // Check if preview data changed (first 3 non-ID fields)
    const prevKeys = prevProps.FIELD_META.map((m) => m.key)
      .filter((k) => !["id", "geoid", "oracle_geoid"].includes(k))
      .slice(0, 3);

    for (const key of prevKeys) {
      if (prevProps.row[key] !== nextProps.row[key]) {
        return false;
      }
    }

    // Nothing changed → skip re-render
    return true;
  }
);*/

FormListItem.displayName = "FormListItem";

export default FormListItem;

import React from "react";

// Helper
function makeRowPreview(row, FIELD_META) {
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
      if (parts.length >= 5) break;
    }
  }
  return parts.join(" • ");
}

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
  handleRowHover,
  handleRowLeave,
  isViewedRow,
}) => {
  const [isHovering, setIsHovering] = React.useState(false);

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
      style={{
        ...s.listRow(selected, status, isFocused, false, isViewedRow),
        // Use hover style from theme (via trHover) ONLY when:
        // - hovering AND not selected AND not focused AND no pending status
        // This prevents hover from overwriting add/delete/edit colors
        ...(isHovering && !selected && !isFocused && !status ? s.trHover : {}),
      }}
      onClick={(e) => onFormRowClick(row.id, idx, e)}
      onMouseEnter={() => {
        setIsHovering(true);
        if (handleRowHover) {
          handleRowHover(row.id);
        }
      }}
      onMouseLeave={() => {
        setIsHovering(false);
        if (handleRowLeave) {
          handleRowLeave();
        }
      }}
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

FormListItem.displayName = "FormListItem";

export default FormListItem;

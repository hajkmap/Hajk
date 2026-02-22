import React from "react";
import {
  renderTableCellEditor,
  renderTableCellDisplay,
} from "../helpers/helpers";

const DEFAULT_WRAP_CH = 100;

const TableRow = ({
  row,
  idx,
  FIELD_META,
  s,
  features,
  featuresMap,
  selected,
  pendingKind,
  tablePendingEdits,
  tablePendingAdds,
  tableEditing,
  isMissingValue,
  handleRowClick,
  openSelectedInFormFromTable,
  openInFormFromTable,
  tableSelectedIds,
  setTableEditing,
  setTablePendingAdds,
  setTablePendingEdits,
  pushTableUndo,
  syncFilterOnCellChange,
  isEditableField,
  caretStoreRef,
  shouldUseTextarea,
  selectedRowRefs,
  handleRowHover,
  handleRowLeave,
  colWidths,
  isViewedRow,
}) => {
  const [isHovering, setIsHovering] = React.useState(false);
  const rowHasEdits =
    !row.__pending &&
    tablePendingEdits[row.id] &&
    Object.keys(tablePendingEdits[row.id]).length > 0;

  return (
    <tr
      ref={(el) => {
        if (selected && selectedRowRefs) {
          selectedRowRefs.current.set(row.id, el);
        } else if (selectedRowRefs) {
          selectedRowRefs.current.delete(row.id);
        }
      }}
      style={{
        ...s.tr(selected, pendingKind, isViewedRow),
        ...(rowHasEdits && !pendingKind && !isViewedRow ? s.trEditOutline : {}),
        ...(isHovering && !selected && !pendingKind ? s.trHover : {}),
      }}
      aria-selected={selected}
      onClick={(e) => handleRowClick(row.id, idx, e)}
      onMouseEnter={() => {
        setIsHovering(true);
        handleRowHover?.(row.id);
      }}
      onMouseLeave={() => {
        setIsHovering(false);
        handleRowLeave?.();
      }}
      onDoubleClick={(e) => {
        if (tableEditing) return;
        const td = e.target.closest?.("td");
        if (td?.dataset?.editable === "true") return;
        if (tableSelectedIds.size > 1) openSelectedInFormFromTable();
        else openInFormFromTable(row.id);
      }}
      title="Klick: markera • Dubbelklick: öppna i formulär"
    >
      {FIELD_META.map((meta) => {
        const patch = tablePendingEdits[row.id];
        const patchedValue =
          patch && meta.key in patch ? patch[meta.key] : undefined;
        const effectiveValue =
          patchedValue !== undefined ? patchedValue : row[meta.key];

        const isPlaceholder =
          row.__pending && meta.readOnly && isMissingValue(effectiveValue);

        const isEditedCell = !row.__pending && patch && meta.key in patch;

        const isEditing =
          !!tableEditing &&
          tableEditing.id === row.id &&
          tableEditing.key === meta.key;

        const editable = !meta.readOnly && row.__pending !== "delete";

        const tdBase = isEditing
          ? s.tdEdited
          : isPlaceholder
            ? s.tdPlaceholder
            : isEditedCell
              ? s.tdEdited
              : s.td;

        const beginEdit = () => {
          if (!editable) return;
          setTableEditing({
            id: row.id,
            key: meta.key,
            startValue: effectiveValue ?? "",
          });
        };

        const applyChange = (newVal) => {
          if (row.__pending) {
            setTablePendingAdds((prev) =>
              prev.map((d) =>
                d.id === row.id ? { ...d, [meta.key]: newVal } : d
              )
            );
          } else {
            setTablePendingEdits((prev) => {
              const next = { ...prev };
              const current = next[row.id] ? { ...next[row.id] } : {};
              const original = featuresMap.get(row.id)?.[meta.key];
              if ((newVal ?? "") === (original ?? "")) {
                delete current[meta.key];
              } else {
                current[meta.key] = newVal;
              }
              if (Object.keys(current).length) next[row.id] = current;
              else delete next[row.id];
              return next;
            });
          }
        };

        const finishEdit = () => {
          const ed = tableEditing;
          setTableEditing(null);
          if (!ed || ed.id !== row.id || ed.key !== meta.key) return;

          let currentVal;
          const p = tablePendingEdits[row.id];
          if (p && meta.key in p) currentVal = p[meta.key];
          else {
            const draft = tablePendingAdds?.find?.((d) => d.id === row.id);
            if (draft) currentVal = draft[meta.key];
            else currentVal = featuresMap.get(row.id)?.[meta.key];
          }

          const prevVal = ed.startValue ?? "";
          if (currentVal !== prevVal) {
            const isDraft = row.__pending === "add" || ed.id < 0;
            pushTableUndo({
              type: "edit_cell",
              id: ed.id,
              key: meta.key,
              prevValue: prevVal,
              isDraft,
            });

            syncFilterOnCellChange(meta.key, prevVal, currentVal, row.id);
          }
        };

        const cancelEdit = () => {
          const ed = tableEditing;
          if (!ed) return;
          if (row.__pending) {
            setTablePendingAdds((prev) =>
              prev.map((d) =>
                d.id === row.id ? { ...d, [meta.key]: ed.startValue } : d
              )
            );
          } else {
            setTablePendingEdits((prev) => {
              const next = { ...prev };
              const current = { ...(next[row.id] || {}) };
              const original = featuresMap.get(row.id)?.[meta.key];
              const revertTo = ed.startValue;
              if ((revertTo ?? "") === (original ?? "")) {
                delete current[meta.key];
              } else {
                current[meta.key] = revertTo;
              }
              if (Object.keys(current).length) next[row.id] = current;
              else delete next[row.id];
              return next;
            });
          }
          setTableEditing(null);
        };

        const isDeletedRow = row.__pending === "delete";
        const wrapCh = meta.wrapCh ?? DEFAULT_WRAP_CH;
        const editingValue = effectiveValue ?? "";
        const useTextarea = shouldUseTextarea(meta, editingValue);
        const hasNl = /\n/.test(String(effectiveValue ?? ""));
        const cellKey = `${row.id}::${meta.key}`;
        const flowStyle = wrapCh
          ? s.tdWrap(wrapCh)
          : hasNl
            ? s.textFlowFallback
            : s.tdNowrap;

        let editorNode = null;

        const editorProps = {
          className: undefined,
          style: s.cellInput,
          value: effectiveValue ?? "",
          autoFocus: true,
          ref: (el) => {
            editorNode = el;
            if (!el) return;
            const savedPos = caretStoreRef.current.get(cellKey);
            if (savedPos != null) {
              try {
                el.focus();
                el.selectionStart = el.selectionEnd = savedPos;
              } catch {}
              caretStoreRef.current.delete(cellKey);
            }
          },

          onChange: (e) => {
            const val = e.target.value;
            const willSwap = !useTextarea && shouldUseTextarea(meta, val);
            if (willSwap) {
              const pos = e.target.selectionEnd ?? val.length;
              caretStoreRef.current.set(cellKey, pos);
            }
            applyChange(val);
          },

          onClick: (e) => e.stopPropagation(),
          onDoubleClick: (e) => e.stopPropagation(),

          onKeyDown: (e) => {
            e.stopPropagation();
            if (e.key === "Escape") {
              e.preventDefault();
              cancelEdit();
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
              caretStoreRef.current.set(cellKey, start + 1);
              applyChange(next);
              requestAnimationFrame(() => {
                try {
                  (editorNode ?? el).focus();
                  (editorNode ?? el).selectionStart = (
                    editorNode ?? el
                  ).selectionEnd = start + 1;
                } catch {}
              });
              return;
            }

            e.preventDefault();
            finishEdit();
          },

          onBlur: finishEdit,
        };

        return (
          <td
            key={meta.key}
            data-editable={String(isEditableField(meta))}
            style={{
              ...tdBase,
              ...(isDeletedRow ? s.tdStrike : null),
              ...(meta.wrapCh ? s.tdWidth(meta.wrapCh) : null),
              ...flowStyle,
            }}
            onDoubleClick={(e) => {
              if (!editable) return;
              e.stopPropagation();
              beginEdit();
            }}
            title={editable ? "Dubbelklicka för att redigera" : "Ej redigerbar"}
          >
            {isEditing
              ? renderTableCellEditor({
                  meta,
                  editingValue,
                  editorProps,
                  applyChange,
                  s,
                  useTextarea,
                })
              : isPlaceholder
                ? "#saknas"
                : renderTableCellDisplay({
                    meta,
                    value: effectiveValue,
                    s,
                    selected,
                    columnWidth: colWidths?.[meta.key],
                  })}
          </td>
        );
      })}
    </tr>
  );
};

TableRow.displayName = "TableRow";

export default TableRow;

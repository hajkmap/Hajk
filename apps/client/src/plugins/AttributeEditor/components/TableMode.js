import React from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditNoteIcon from "@mui/icons-material/EditNote";
import SaveIcon from "@mui/icons-material/Save";
import UndoIcon from "@mui/icons-material/Undo";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ConfirmSaveDialog from "./ConfirmSaveDialog";

export default function TableMode(props) {
  const {
    s,
    theme,
    FIELD_META,
    isMobile,
    features,
    filteredAndSorted,

    // selection & pending
    tableSelectedIds,
    tableHasPending,

    // actions (top bar)
    duplicateSelectedRows,
    openSelectedInFormFromTable,
    commitTableEdits,
    setDeleteState,
    tablePendingDeletes,
    pushTableUndo,
    tablePendingAdds,
    tableUndoStack,
    undoLatestTableChange,
    formUndoStack,
    canUndo,

    // filters & sorting
    columnFilters,
    setColumnFilters,
    openFilterColumn,
    setOpenFilterColumn,
    getUniqueColumnValues,
    toggleSort,
    sort,

    // editing
    tableEditing,
    setTableEditing,
    tablePendingEdits,
    setTablePendingEdits,
    setTablePendingAdds,

    // helpers
    isEditableField,
    isMissingValue,
    handleRowClick,
    openInFormFromTable,

    // refs
    firstColumnRef,
    filterOverlayRef,
  } = props;

  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [savingNow, setSavingNow] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState(null);

  function ColumnFilter({ columnKey, placement }) {
    const uniqueValues = getUniqueColumnValues(columnKey);
    const selectedValues = columnFilters[columnKey] || [];

    const anchorStyle =
      placement === "right"
        ? { left: 0, right: "auto", transform: "none" }
        : placement === "left"
          ? { right: 0, left: "auto", transform: "none" }
          : { left: "50%", right: "auto", transform: "translateX(-50%)" };

    return (
      <div
        ref={(el) => {
          if (filterOverlayRef) filterOverlayRef.current = el;
        }}
        style={{ ...s.filterOverlay, ...anchorStyle }}
      >
        <div style={s.filterOverlayButtons}>
          <button
            style={s.btnSmall}
            onClick={() =>
              setColumnFilters((prev) => ({ ...prev, [columnKey]: [] }))
            }
          >
            Rensa
          </button>
          <button
            style={s.btnSmall}
            onClick={() =>
              setColumnFilters((prev) => ({
                ...prev,
                [columnKey]: uniqueValues,
              }))
            }
          >
            Välj alla
          </button>
        </div>

        {uniqueValues.map((value) => (
          <label key={value} style={s.filterCheckbox}>
            <input
              type="checkbox"
              checked={selectedValues.includes(value)}
              onChange={(e) => {
                setColumnFilters((prev) => {
                  const current = prev[columnKey] || [];
                  return e.target.checked
                    ? { ...prev, [columnKey]: [...current, value] }
                    : {
                        ...prev,
                        [columnKey]: current.filter((v) => v !== value),
                      };
                });
              }}
            />
            {value}
          </label>
        ))}
      </div>
    );
  }

  const summary = React.useMemo(
    () => ({
      adds: tablePendingAdds?.length ?? 0,
      // number of rows with pending edits (not number of fields)
      edits: tablePendingEdits ? Object.keys(tablePendingEdits).length : 0,
      deletes: tablePendingDeletes?.size ?? 0,
    }),
    [tablePendingAdds, tablePendingEdits, tablePendingDeletes]
  );

  async function confirmSave() {
    try {
      setErrorMsg(null);
      setSavingNow(true);
      await Promise.resolve(commitTableEdits());
      setSaveDialogOpen(false);
    } catch (err) {
      setErrorMsg(err?.message || "Kunde inte spara.");
    } finally {
      setSavingNow(false);
    }
  }

  return (
    <div style={s.tableWrap}>
      <div style={s.tableHeaderBar}>
        <span style={s.tableHeaderTitle}>Alla objekt</span>
        <div style={s.spacer} />

        <>
          {tablePendingDeletes.size > 0 && (
            <span style={{ ...s.toolbarStats, color: theme.danger }}>
              {tablePendingDeletes.size} markerade för radering
            </span>
          )}
          {tableHasPending && (
            <span style={{ ...s.toolbarStats, color: theme.warning }}>
              Osparade ändringar
            </span>
          )}

          <button
            style={tableSelectedIds.size === 0 ? s.iconBtnDisabled : s.iconBtn}
            disabled={tableSelectedIds.size === 0}
            onClick={duplicateSelectedRows}
            title={
              tableSelectedIds.size
                ? `Duplicera ${tableSelectedIds.size} markerade`
                : "Markera rader först"
            }
            aria-label="Duplicera val"
          >
            <ContentCopyIcon fontSize="small" />
          </button>

          <button
            style={tableSelectedIds.size === 0 ? s.iconBtnDisabled : s.iconBtn}
            disabled={tableSelectedIds.size === 0}
            onClick={openSelectedInFormFromTable}
            title={
              tableSelectedIds.size
                ? "Öppna de markerade i formulärläge"
                : "Markera rader först"
            }
            aria-label="Redigera val i formulär"
          >
            <EditNoteIcon fontSize="small" />
          </button>

          <button
            style={tableSelectedIds.size === 0 ? s.iconBtnDisabled : s.iconBtn}
            disabled={tableSelectedIds.size === 0}
            onClick={() => setDeleteState([...tableSelectedIds], "toggle")}
            title={
              tableSelectedIds.size
                ? "Markera valda för radering"
                : "Markera rader först"
            }
            aria-label="Markera för radering"
          >
            <DeleteOutlineIcon fontSize="small" />
          </button>

          <button
            disabled={
              canUndo === undefined
                ? !(tableUndoStack?.length || formUndoStack?.length)
                : !canUndo
            }
            style={
              (
                canUndo === undefined
                  ? tableUndoStack?.length || formUndoStack?.length
                  : canUndo
              )
                ? s.iconBtn
                : s.iconBtnDisabled
            }
            onClick={undoLatestTableChange}
            title="Ångra senaste ändring"
            aria-label="Ångra senaste"
          >
            <UndoIcon fontSize="small" />
          </button>

          <button
            style={!tableHasPending ? s.iconBtnDisabled : s.iconBtn}
            disabled={!tableHasPending}
            onClick={() => setSaveDialogOpen(true)}
            title="Spara"
            aria-label="Spara"
          >
            <SaveIcon fontSize="small" />
          </button>
        </>

        {isMobile && (
          <span style={s.toolbarStats}>
            {filteredAndSorted.length}/{features.length}
          </span>
        )}
      </div>

      <div style={s.tableViewport}>
        <div style={s.tableInner}>
          <table style={s.table}>
            <thead>
              <tr>
                {FIELD_META.map((f, index) => {
                  const hasActiveFilter =
                    (columnFilters[f.key] || []).length > 0;
                  const totalCols = FIELD_META.length;
                  const placement =
                    index < 2
                      ? "right"
                      : index >= totalCols - 1
                        ? "left"
                        : "center";

                  const isFirstColumn = index === 0;

                  return (
                    <th
                      key={f.key}
                      style={s.th}
                      ref={isFirstColumn ? firstColumnRef : null}
                    >
                      <div style={s.thContent}>
                        <div style={s.thControls}>
                          <button
                            onClick={() => toggleSort(f.key)}
                            title="Klicka för att sortera"
                            style={s.sortButton}
                          >
                            {sort.key === f.key
                              ? sort.dir === "asc"
                                ? "▲"
                                : "▼"
                              : "↕"}
                          </button>

                          <span
                            onClick={() => toggleSort(f.key)}
                            style={s.columnHeader}
                          >
                            {f.label}
                          </span>

                          <button
                            data-filter-btn={f.key}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenFilterColumn(
                                openFilterColumn === f.key ? null : f.key
                              );
                            }}
                            style={s.filterButton(hasActiveFilter)}
                            title={
                              hasActiveFilter
                                ? `Filter aktivt (${(columnFilters[f.key] || []).length} val)`
                                : "Filtrera"
                            }
                            aria-pressed={openFilterColumn === f.key}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke={
                                hasActiveFilter
                                  ? theme.primary
                                  : theme.textMuted
                              }
                              strokeWidth="2"
                            >
                              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                            </svg>
                          </button>

                          {openFilterColumn === f.key && (
                            <ColumnFilter
                              columnKey={f.key}
                              placement={placement}
                            />
                          )}
                        </div>

                        <div style={s.spacer} />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {filteredAndSorted.map((row, idx) => {
                const selected = tableSelectedIds.has(row.id);

                return (
                  <tr
                    key={row.id}
                    style={s.tr(selected, row.__pending)}
                    aria-selected={selected}
                    onClick={(e) => handleRowClick(row.id, idx, e)}
                    onDoubleClick={(e) => {
                      if (tableEditing) return;
                      const td = e.target.closest?.("td");
                      if (td?.dataset?.editable === "true") return;
                      if (tableSelectedIds.size > 1)
                        openSelectedInFormFromTable();
                      else openInFormFromTable(row.id);
                    }}
                    title="Klick: markera • Dubbelklick: öppna i formulär"
                  >
                    {FIELD_META.map((meta) => {
                      const patch = tablePendingEdits[row.id];
                      const patchedValue =
                        patch && meta.key in patch
                          ? patch[meta.key]
                          : undefined;
                      const effectiveValue =
                        patchedValue !== undefined
                          ? patchedValue
                          : row[meta.key];

                      const isPlaceholder =
                        row.__pending &&
                        meta.readOnly &&
                        isMissingValue(effectiveValue);

                      const isEditedCell =
                        !row.__pending && patch && meta.key in patch;

                      const isEditing =
                        !!tableEditing &&
                        tableEditing.id === row.id &&
                        tableEditing.key === meta.key;

                      const tdBase = isEditing
                        ? s.tdEdited
                        : isPlaceholder
                          ? s.tdPlaceholder
                          : isEditedCell
                            ? s.tdEdited
                            : s.td;

                      const beginEdit = () => {
                        if (!isEditableField(meta)) return;
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
                            const current = next[row.id]
                              ? { ...next[row.id] }
                              : {};
                            const original = features.find(
                              (f) => f.id === row.id
                            )?.[meta.key];
                            if (newVal === original) {
                              delete current[meta.key];
                            } else {
                              current[meta.key] = newVal;
                            }
                            if (Object.keys(current).length)
                              next[row.id] = current;
                            else delete next[row.id];
                            return next;
                          });
                        }
                      };

                      const finishEdit = () => {
                        const ed = tableEditing; // { id, key, startValue }
                        setTableEditing(null);
                        if (!ed || ed.id !== row.id || ed.key !== meta.key)
                          return;

                        let currentVal;
                        const patch = tablePendingEdits[row.id];
                        if (patch && meta.key in patch) {
                          currentVal = patch[meta.key];
                        } else {
                          const draft = tablePendingAdds?.find?.(
                            (d) => d.id === row.id
                          );
                          if (draft) currentVal = draft[meta.key];
                          else
                            currentVal = features.find(
                              (f) => f.id === row.id
                            )?.[meta.key];
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
                        }
                      };

                      const cancelEdit = () => {
                        const ed = tableEditing;
                        if (!ed) return;
                        if (row.__pending) {
                          setTablePendingAdds((prev) =>
                            prev.map((d) =>
                              d.id === row.id
                                ? { ...d, [meta.key]: ed.startValue }
                                : d
                            )
                          );
                        } else {
                          setTablePendingEdits((prev) => {
                            const next = { ...prev };
                            const current = { ...(next[row.id] || {}) };
                            const original = features.find(
                              (f) => f.id === row.id
                            )?.[meta.key];
                            const revertTo = ed.startValue;
                            if (revertTo === original) {
                              delete current[meta.key];
                            } else {
                              current[meta.key] = revertTo;
                            }
                            if (Object.keys(current).length)
                              next[row.id] = current;
                            else delete next[row.id];
                            return next;
                          });
                        }
                        setTableEditing(null);
                      };

                      const isDeletedRow = row.__pending === "delete";

                      const editorProps = {
                        className: undefined,
                        style: s.cellInput,
                        value: effectiveValue ?? "",
                        autoFocus: true,
                        onChange: (e) => applyChange(e.target.value),
                        onClick: (e) => e.stopPropagation(),
                        onDoubleClick: (e) => e.stopPropagation(),
                        onKeyDown: (e) => {
                          if (e.key === "Escape") {
                            e.preventDefault();
                            cancelEdit();
                            return;
                          }

                          if (e.key !== "Enter") return;

                          if (e.altKey) {
                            e.preventDefault();
                            e.stopPropagation();

                            const el = e.currentTarget;
                            const start =
                              el.selectionStart ?? el.value?.length ?? 0;
                            const end =
                              el.selectionEnd ?? el.value?.length ?? 0;

                            const next =
                              (el.value ?? "").slice(0, start) +
                              "\n" +
                              (el.value ?? "").slice(end);

                            applyChange(next);

                            const restore = () => {
                              const active = document.activeElement;
                              if (active && "selectionStart" in active) {
                                try {
                                  active.focus();
                                  active.selectionStart = active.selectionEnd =
                                    start + 1;
                                } catch {}
                              }
                            };
                            requestAnimationFrame(() => {
                              restore();
                              setTimeout(restore);
                            });

                            return;
                          }
                          e.preventDefault();
                          finishEdit();
                        },
                        onBlur: finishEdit,
                      };

                      const wrapCh =
                        meta.wrapCh ?? (meta.type === "textarea" ? 40 : null);
                      const flowStyle = wrapCh ? s.tdWrap(wrapCh) : s.tdNowrap;

                      return (
                        <td
                          key={meta.key}
                          data-editable={String(isEditableField(meta))}
                          style={{
                            ...tdBase,
                            ...(isDeletedRow ? s.tdStrike : null),
                            ...flowStyle,
                          }}
                          onDoubleClick={(e) => {
                            if (!isEditableField(meta)) return;
                            e.stopPropagation();
                            beginEdit();
                          }}
                          title={
                            isEditableField(meta)
                              ? "Dubbelklicka för att redigera"
                              : "Ej redigerbar"
                          }
                        >
                          {isEditing ? (
                            meta.type === "select" ? (
                              <select {...editorProps}>
                                {(meta.options || []).map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : meta.type === "date" ? (
                              <input
                                {...editorProps}
                                type="date"
                                value={String(effectiveValue ?? "").slice(
                                  0,
                                  10
                                )} // YYYY-MM-DD
                                onChange={(e) =>
                                  applyChange(e.target.value || null)
                                }
                              />
                            ) : /\n/.test(String(effectiveValue ?? "")) ? (
                              <textarea {...editorProps} rows={4} />
                            ) : (
                              <input {...editorProps} />
                            )
                          ) : isPlaceholder ? (
                            "#saknas"
                          ) : (
                            String(effectiveValue ?? "")
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {filteredAndSorted.length === 0 && (
                <tr>
                  <td style={s.tdEmpty} colSpan={FIELD_META.length}>
                    Inga rader matchar sökningen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmSaveDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onConfirm={confirmSave}
        summary={summary}
        saving={savingNow}
        error={errorMsg}
        title="Spara ändringar"
        body="Det finns osparade ändringar i tabellen. Vill du spara nu?"
        primaryLabel="Spara"
      />
    </div>
  );
}

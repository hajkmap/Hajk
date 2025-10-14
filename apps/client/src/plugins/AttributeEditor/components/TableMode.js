import React from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditNoteIcon from "@mui/icons-material/EditNote";
import SaveIcon from "@mui/icons-material/Save";
import UndoIcon from "@mui/icons-material/Undo";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ConfirmSaveDialog from "./ConfirmSaveDialog";
import { editBus } from "../../../buses/editBus";
import useCookieStatus from "../../../hooks/useCookieStatus";
import {
  renderTableCellEditor,
  renderTableCellDisplay,
} from "../helpers/helpers";

const ColumnFilter = React.memo(function ColumnFilter({
  s,
  columnKey,
  placement,
  uniqueValues,
  selectedValues,
  q,
  setQ,
  showAll,
  setShowAll,
  onToggleValue,
  onSelectFiltered,
  onClearFilter,
  filterOverlayRef,
}) {
  const anchorStyle =
    placement === "right"
      ? { left: 0, right: "auto", transform: "none" }
      : placement === "left"
        ? { right: 0, left: "auto", transform: "none" }
        : { left: "50%", right: "auto", transform: "translateX(-50%)" };

  const query = q.trim().toLowerCase();
  const filtered = query
    ? uniqueValues.filter((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(query)
      )
    : uniqueValues;

  const MAX_SHOWN = 200;
  const list = showAll ? filtered : filtered.slice(0, MAX_SHOWN);

  return (
    <div
      ref={(el) => {
        if (filterOverlayRef) filterOverlayRef.current = el;
      }}
      style={{ ...s.filterOverlay, ...anchorStyle }}
    >
      <input
        style={s.filterSearch}
        placeholder="Sök i värden…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setShowAll(false);
        }}
        aria-label="Sök i filtervärden"
      />
      <div style={s.filterOverlayButtons}>
        <button style={s.btnSmall} onClick={onClearFilter}>
          Rensa
        </button>
        <button style={s.btnSmall} onClick={onSelectFiltered}>
          Välj filtrerade ({filtered.length})
        </button>
        {filtered.length > MAX_SHOWN && !showAll && (
          <button style={s.btnSmall} onClick={() => setShowAll(true)}>
            Visa alla ({filtered.length})
          </button>
        )}
      </div>
      <div style={s.filterListScroll}>
        {list.map((value) => {
          const str = String(value ?? "");
          const checked = selectedValues.includes(value);
          return (
            <label key={str} style={s.filterCheckbox} title={str}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onToggleValue(value, e.target.checked)}
              />
              <span style={s.filterCheckboxText}>{str}</span>
            </label>
          );
        })}
        {filtered.length === 0 && <div style={s.listEmpty}>Inga träffar.</div>}
      </div>
    </div>
  );
});

export default function TableMode(props) {
  const {
    s,
    theme,
    FIELD_META,
    isMobile,
    features,
    filteredAndSorted,
    columnFilterUI,
    setColumnFilterUI,
    serviceId,

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
    isEditableField,

    // helpers
    isMissingValue,
    handleRowClick,
    openInFormFromTable,
    app,

    // refs
    firstColumnRef,
    filterOverlayRef,
  } = props;

  const DEFAULT_WRAP_CH = 100;

  const { functionalCookiesOk } = useCookieStatus(app.globalObserver);
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [savingNow, setSavingNow] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState(null);
  const caretStoreRef = React.useRef(new Map());
  const setQFor = (key, val) =>
    setColumnFilterUI((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), q: val },
    }));

  const setShowAllFor = (key, val) =>
    setColumnFilterUI((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), showAll: val },
    }));

  const MIN_W = 80; // px
  const MAX_W = 720; // px

  const STORAGE_KEY = React.useMemo(
    () => `ae_colwidths_${serviceId}`,
    [serviceId]
  );

  const [colWidths, setColWidths] = React.useState(() => {
    // read from localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const syncFilterOnCellChange = React.useCallback(
    (columnKey, fromValue, toValue, rowId) => {
      const active = columnFilters?.[columnKey];
      if (!Array.isArray(active) || active.length === 0) return;

      const fromStr = String(fromValue ?? "");
      const toStr = String(toValue ?? "");

      // Build an "effective" set of all rows (base + pending), excluding rows marked for deletion
      const effectiveAll = [
        ...features.map((f) => ({
          ...f,
          ...(tablePendingEdits?.[f.id] || {}),
        })),
        ...(tablePendingAdds || []),
      ].filter((r) => !tablePendingDeletes?.has?.(r.id));

      setColumnFilters((prev) => {
        const before = prev?.[columnKey] || [];
        const nextSet = new Set(before.map(String));

        if (toStr !== "") nextSet.add(toStr);

        if (fromStr !== "" && fromStr !== toStr) {
          const stillUsed = effectiveAll.some(
            (r) => r.id !== rowId && String(r?.[columnKey] ?? "") === fromStr
          );
          if (!stillUsed) nextSet.delete(fromStr);
        }

        return { ...(prev || {}), [columnKey]: Array.from(nextSet) };
      });
    },
    [
      columnFilters,
      setColumnFilters,
      features,
      tablePendingEdits,
      tablePendingAdds,
      tablePendingDeletes,
    ]
  );

  React.useEffect(() => {
    // only when the table actually shows something
    if (!filteredAndSorted.length) return;
    if (tableSelectedIds.size === 0) return;

    // is any selected id still visible in the current filtered list?
    const selectedVisible = filteredAndSorted.some((r) =>
      tableSelectedIds.has(r.id)
    );

    if (!selectedVisible) {
      const firstId = filteredAndSorted[0]?.id;
      if (firstId != null) {
        editBus.emit("attrib:select-ids", {
          ids: [firstId],
          source: "view",
          mode: "replace",
        });
      }
    }
  }, [filteredAndSorted, tableSelectedIds]);

  React.useEffect(() => {
    if (!functionalCookiesOk) {
      setColWidths({});
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      setColWidths(saved);
    } catch {
      setColWidths({});
    }
  }, [STORAGE_KEY, functionalCookiesOk]);

  React.useEffect(() => {
    if (!functionalCookiesOk) return;
    // Save changes with a service-specific key
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(colWidths));
    } catch {}
  }, [colWidths, STORAGE_KEY, functionalCookiesOk]);

  const resizingRef = React.useRef(null); // { key, startX, startW }

  React.useEffect(() => {
    function onMove(e) {
      const r = resizingRef.current;
      if (!r) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const dx = clientX - r.startX;
      const next = Math.max(MIN_W, Math.min(MAX_W, r.startW + dx));
      setColWidths((prev) => ({ ...prev, [r.key]: next }));
    }
    function onUp() {
      resizingRef.current = null;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  const shouldUseTextarea = (meta, val) => {
    const s = String(val ?? "");
    const wrap =
      meta.wrapCh ??
      (meta.type === "textarea" ? DEFAULT_WRAP_CH : DEFAULT_WRAP_CH);
    return (
      meta.type === "textarea" ||
      /\n/.test(s) ||
      (wrap != null && s.length >= wrap)
    );
  };

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
            onClick={() => {
              const ids = Array.from(tableSelectedIds);
              if (ids.length > 0) {
                editBus.emit("attrib:zoom-to-features", { ids });
              }
            }}
            title={
              tableSelectedIds.size
                ? `Zooma till ${tableSelectedIds.size} objekt`
                : "Markera rader först"
            }
            aria-label="Zooma till valda"
          >
            <CenterFocusStrongIcon fontSize="small" />
          </button>
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
            <colgroup>
              {FIELD_META.map((meta) => (
                <col
                  key={meta.key}
                  style={{
                    width:
                      (colWidths[meta.key] ?? meta.initialWidth ?? 220) + "px",
                  }}
                />
              ))}
            </colgroup>
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
                      style={{
                        ...s.th,
                        ...(f.wrapCh ? s.thWidth(f.wrapCh) : null),
                      }}
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
                              s={s}
                              columnKey={f.key}
                              placement={placement}
                              uniqueValues={getUniqueColumnValues(f.key)}
                              selectedValues={columnFilters[f.key] || []}
                              q={columnFilterUI[f.key]?.q ?? ""}
                              setQ={(val) => setQFor(f.key, val)}
                              showAll={columnFilterUI[f.key]?.showAll ?? false}
                              setShowAll={(val) => setShowAllFor(f.key, val)}
                              onToggleValue={(value, checked) => {
                                setColumnFilters((prev) => {
                                  const current = prev[f.key] || [];
                                  return checked
                                    ? { ...prev, [f.key]: [...current, value] }
                                    : {
                                        ...prev,
                                        [f.key]: current.filter(
                                          (v) => v !== value
                                        ),
                                      };
                                });
                              }}
                              onSelectFiltered={() => {
                                const query = (columnFilterUI[f.key]?.q ?? "")
                                  .trim()
                                  .toLowerCase();
                                const filtered = getUniqueColumnValues(
                                  f.key
                                ).filter((v) =>
                                  String(v ?? "")
                                    .toLowerCase()
                                    .includes(query)
                                );
                                setColumnFilters((prev) => ({
                                  ...prev,
                                  [f.key]: filtered,
                                }));
                              }}
                              onClearFilter={() => {
                                setColumnFilters((prev) => ({
                                  ...prev,
                                  [f.key]: [],
                                }));
                                setQFor(f.key, "");
                                setShowAllFor(f.key, false);
                              }}
                              filterOverlayRef={filterOverlayRef}
                            />
                          )}
                        </div>

                        <div style={s.spacer} />
                      </div>
                      <div
                        style={s.thResizer}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const w =
                            colWidths[f.key] ??
                            (e.currentTarget.parentElement?.offsetWidth || 220);
                          resizingRef.current = {
                            key: f.key,
                            startX: e.clientX,
                            startW: w,
                          };
                        }}
                        onTouchStart={(e) => {
                          if (!e.touches || !e.touches[0]) return;
                          const t = e.touches[0];
                          const parent = e.currentTarget
                            ? e.currentTarget.parentElement
                            : null;
                          const ow =
                            parent && parent.offsetWidth
                              ? parent.offsetWidth
                              : 220;
                          const w = colWidths[f.key] ?? ow;
                          resizingRef.current = {
                            key: f.key,
                            startX: t.clientX,
                            startW: w,
                          };
                        }}
                        title="Dra för att ändra kolumnbredd"
                        aria-label={`Ändra bredd för kolumn ${f.label}`}
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {filteredAndSorted.map((row, idx) => {
                const selected = tableSelectedIds.has(row.id);
                const pendingKind =
                  row.__pending || (row.__geom__ != null ? "geom" : null);

                return (
                  <tr
                    key={row.id}
                    style={s.tr(selected, pendingKind)}
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

                      const editable =
                        !meta.readOnly && row.__pending !== "delete";

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
                            const current = next[row.id]
                              ? { ...next[row.id] }
                              : {};
                            const original = features.find(
                              (f) => f.id === row.id
                            )?.[meta.key];
                            if ((newVal ?? "") === (original ?? "")) {
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
                        const ed = tableEditing;
                        setTableEditing(null);
                        if (!ed || ed.id !== row.id || ed.key !== meta.key)
                          return;

                        let currentVal;
                        const p = tablePendingEdits[row.id];
                        if (p && meta.key in p) currentVal = p[meta.key];
                        else {
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

                          // Only update filter if this column is currently filtered ***
                          syncFilterOnCellChange(
                            meta.key,
                            prevVal,
                            currentVal,
                            row.id
                          );
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
                            if ((revertTo ?? "") === (original ?? "")) {
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
                      const wrapCh = meta.wrapCh ?? DEFAULT_WRAP_CH;
                      const editingValue = effectiveValue ?? "";
                      const useTextarea = shouldUseTextarea(meta, editingValue);
                      const hasNl = /\n/.test(String(effectiveValue ?? ""));
                      const cellKey = `${row.id}::${meta.key}`;
                      const flowStyle = wrapCh
                        ? s.tdWrap(wrapCh) // wrap to N ch if provided
                        : hasNl
                          ? {
                              // show newlines even without wrapCh
                              whiteSpace: "pre-wrap",
                              overflowWrap: "anywhere",
                              wordBreak: "break-word",
                              verticalAlign: "top",
                            }
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

                          // Will we switch from input -> textarea on the next render?
                          const willSwap =
                            !useTextarea && shouldUseTextarea(meta, val);

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
                            const start =
                              el.selectionStart ?? el.value?.length ?? 0;
                            const end =
                              el.selectionEnd ?? el.value?.length ?? 0;
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
                          title={
                            editable
                              ? "Dubbelklicka för att redigera"
                              : "Ej redigerbar"
                          }
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
                                })}
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

import React from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import SaveIcon from "@mui/icons-material/Save";
import UndoIcon from "@mui/icons-material/Undo";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import DescriptionIcon from "@mui/icons-material/Description";
import CircularProgress from "@mui/material/CircularProgress";
import ConfirmSaveDialog from "./ConfirmSaveDialog";
import ConfirmationDialog from "../../../components/ConfirmationDialog";
import { editBus } from "../../../buses/editBus";
import useCookieStatus from "../../../hooks/useCookieStatus";
import TableRow from "./TableRow";
import { usePagination, SHOW_ALL_VALUE } from "../hooks/usePagination";
import { useScrollToSelectedRow } from "../hooks/useScrollToSelectedRow";

const DEFAULT_WRAP_CH = 100;
const SHOW_ALL_WARNING_THRESHOLD = 100;
const MIN_W = 80; // px
const MAX_W = 720; // px

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

  // O(1) lookup
  const selectedSet = React.useMemo(
    () => new Set(selectedValues),
    [selectedValues]
  );

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
          const checked = selectedSet.has(value);
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
    featuresMap,
    filteredAndSorted,
    columnFilterUI,
    setColumnFilterUI,
    serviceId,

    // selection & pending
    tableSelectedIds,
    tableHasPending,

    // actions (top bar)
    duplicateSelectedRows,
    splitFeature,
    canSplitGeometry,
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

    handleRowHover,
    handleRowLeave,

    // export
    exportToExcel,
  } = props;

  const { functionalCookiesOk } = useCookieStatus(app.globalObserver);
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [savingNow, setSavingNow] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState(null);
  const caretStoreRef = React.useRef(new Map());

  // State for "show all" confirmation dialog
  const [showAllConfirmOpen, setShowAllConfirmOpen] = React.useState(false);

  // Shared pagination hook
  const {
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    totalRows,
    totalPages,
    startIndex,
    endIndex,
    paginatedItems: paginatedRows,
    isShowingAll,
    showPagination,
  } = usePagination(filteredAndSorted, {
    storageKey: "ae_rows_per_page",
    defaultPerPage: 20,
    functionalCookiesOk,
  });

  // Reset to first page when filters or sort change
  React.useEffect(() => {
    setCurrentPage(0);
  }, [columnFilters, sort, setCurrentPage]);

  // Shared scroll-to-selected hook
  const {
    scrollToSelectedRow,
    selectedRowRefs,
    currentScrollIndex,
    viewedRowId,
  } = useScrollToSelectedRow({
    selectedIds: tableSelectedIds,
    items: filteredAndSorted,
    rowsPerPage,
    currentPage,
    setCurrentPage,
    handleRowHover,
    handleRowLeave,
  });

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
    // If nothing is selected, nothing to do
    if (tableSelectedIds.size === 0) return;

    // Get IDs that are visible in the current filtered list
    const visibleSelectedIds = Array.from(tableSelectedIds).filter((id) =>
      filteredAndSorted.some((r) => r.id === id)
    );

    // If some selected features got filtered out, update selection to only visible ones
    if (visibleSelectedIds.length !== tableSelectedIds.size) {
      editBus.emit("attrib:select-ids", {
        ids: visibleSelectedIds,
        source: "view",
        mode: "replace",
      });
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
      adds:
        tablePendingAdds?.filter((d) => d.__pending !== "delete").length ?? 0,
      // number of rows with pending edits (not number of fields)
      edits: tablePendingEdits ? Object.keys(tablePendingEdits).length : 0,
      deletes:
        (tablePendingDeletes?.size ?? 0) +
        (tablePendingAdds?.filter((d) => d.__pending === "delete").length ?? 0),
    }),
    [tablePendingAdds, tablePendingEdits, tablePendingDeletes]
  );

  // Handler for rows per page dropdown change
  const handleRowsPerPageChange = (e) => {
    const newValue = Number(e.target.value);

    if (newValue === SHOW_ALL_VALUE && totalRows > SHOW_ALL_WARNING_THRESHOLD) {
      setShowAllConfirmOpen(true);
    } else {
      setRowsPerPage(newValue);
    }
  };

  const handleShowAllConfirm = () => {
    setRowsPerPage(SHOW_ALL_VALUE);
    setShowAllConfirmOpen(false);
  };

  const handleShowAllAbort = () => {
    setShowAllConfirmOpen(false);
  };

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
            style={
              filteredAndSorted.length === 0 ? s.iconBtnDisabled : s.iconBtn
            }
            disabled={filteredAndSorted.length === 0}
            onClick={() => exportToExcel(filteredAndSorted)}
            title={
              filteredAndSorted.length
                ? `Exportera till Excel (${filteredAndSorted.length} rader)`
                : "Inga rader att exportera"
            }
            aria-label="Exportera till Excel"
          >
            <DescriptionIcon fontSize="small" />
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
              tableSelectedIds.size > 1
                ? `Zooma till ${tableSelectedIds.size} objekt i kartan`
                : tableSelectedIds.size === 1
                  ? "Zooma till valt objekt i kartan"
                  : "Markera rader först"
            }
            aria-label="Zooma till valda"
          >
            <CenterFocusStrongIcon fontSize="small" />
          </button>
          <button
            style={tableSelectedIds.size === 0 ? s.iconBtnDisabled : s.iconBtn}
            disabled={tableSelectedIds.size === 0}
            onClick={scrollToSelectedRow}
            title={
              tableSelectedIds.size > 1
                ? `Skrolla till markerad rad (${currentScrollIndex + 1}/${tableSelectedIds.size})`
                : tableSelectedIds.size === 1
                  ? "Skrolla till markerad rad i tabellen"
                  : "Markera rader först"
            }
            aria-label="Skrolla till markerad"
          >
            <VisibilityIcon fontSize="small" />
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
            style={
              tableSelectedIds.size !== 1 || !canSplitGeometry
                ? s.iconBtnDisabled
                : s.iconBtn
            }
            disabled={tableSelectedIds.size !== 1 || !canSplitGeometry}
            onClick={splitFeature}
            title={
              tableSelectedIds.size !== 1
                ? "Markera exakt en rad för att dela"
                : !canSplitGeometry
                  ? "Endast Polygon och LineString kan delas"
                  : "Dela valt objekt med en klipplinje"
            }
            aria-label="Dela objekt"
          >
            <CallSplitIcon fontSize="small" />
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

                          {f.description && f.description.trim() && (
                            <button
                              style={s.descriptionIcon}
                              title={f.description}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Information om ${f.label}`}
                            >
                              <InfoOutlinedIcon style={{ fontSize: "16px" }} />
                            </button>
                          )}

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
              {paginatedRows.map((row, idx) => {
                const selected = tableSelectedIds.has(row.id);
                const pendingKind =
                  row.__pending || (row.__geom__ != null ? "geom" : null);

                // Use stable composite key: drafts get prefix to avoid collision
                const stableKey = row.id < 0 ? `draft_${row.id}` : row.id;

                return (
                  <TableRow
                    key={stableKey}
                    row={row}
                    idx={startIndex + idx}
                    FIELD_META={FIELD_META}
                    s={s}
                    features={features}
                    featuresMap={featuresMap}
                    selected={selected}
                    pendingKind={pendingKind}
                    tablePendingEdits={tablePendingEdits}
                    tablePendingAdds={tablePendingAdds}
                    tableEditing={tableEditing}
                    isMissingValue={isMissingValue}
                    handleRowClick={handleRowClick}
                    openSelectedInFormFromTable={openSelectedInFormFromTable}
                    openInFormFromTable={openInFormFromTable}
                    tableSelectedIds={tableSelectedIds}
                    setTableEditing={setTableEditing}
                    setTablePendingAdds={setTablePendingAdds}
                    setTablePendingEdits={setTablePendingEdits}
                    pushTableUndo={pushTableUndo}
                    syncFilterOnCellChange={syncFilterOnCellChange}
                    isEditableField={isEditableField}
                    caretStoreRef={caretStoreRef}
                    shouldUseTextarea={shouldUseTextarea}
                    selectedRowRefs={selectedRowRefs}
                    handleRowHover={handleRowHover}
                    handleRowLeave={handleRowLeave}
                    colWidths={colWidths}
                    isViewedRow={row.id === viewedRowId}
                  />
                );
              })}

              {filteredAndSorted.length === 0 && (
                <tr>
                  <td style={s.tdEmpty} colSpan={FIELD_META.length}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      Laddning pågår...
                      <CircularProgress size={16} />
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPagination && (
        <div style={s.tableFooter}>
          <div style={s.paginationInfo}>
            {isShowingAll
              ? `Visar alla ${totalRows} objekt`
              : `Visar ${startIndex + 1}-${endIndex} av ${totalRows}`}
          </div>

          <div style={s.spacer} />

          <div style={s.paginationControls}>
            <label style={s.rowsPerPageLabel}>
              Rader per sida:
              <select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                style={s.rowsPerPageSelect}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={SHOW_ALL_VALUE}>Alla</option>
              </select>
            </label>

            <button
              style={currentPage === 0 ? s.iconBtnDisabled : s.iconBtn}
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(0)}
              title="Första sidan"
              aria-label="Första sidan"
            >
              <FirstPageIcon fontSize="small" />
            </button>

            <button
              style={currentPage === 0 ? s.iconBtnDisabled : s.iconBtn}
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
              title="Föregående sida"
              aria-label="Föregående sida"
            >
              <NavigateBeforeIcon fontSize="small" />
            </button>

            <span style={s.pageIndicator}>
              Sida {currentPage + 1} av {totalPages}
            </span>

            <button
              style={
                currentPage >= totalPages - 1 ? s.iconBtnDisabled : s.iconBtn
              }
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(currentPage + 1)}
              title="Nästa sida"
              aria-label="Nästa sida"
            >
              <NavigateNextIcon fontSize="small" />
            </button>

            <button
              style={
                currentPage >= totalPages - 1 ? s.iconBtnDisabled : s.iconBtn
              }
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(totalPages - 1)}
              title="Sista sidan"
              aria-label="Sista sidan"
            >
              <LastPageIcon fontSize="small" />
            </button>
          </div>
        </div>
      )}

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

      <ConfirmationDialog
        open={showAllConfirmOpen}
        titleName="Visa alla objekt"
        contentDescription="Om du väljer att visa alla objekt kan systemet bli långsammare. Vill du fortsätta?"
        cancel="Avbryt"
        confirm="Fortsätt"
        handleConfirm={handleShowAllConfirm}
        handleAbort={handleShowAllAbort}
      />
    </div>
  );
}

import React from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import MergeTypeIcon from "@mui/icons-material/MergeType";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import SaveIcon from "@mui/icons-material/Save";
import UndoIcon from "@mui/icons-material/Undo";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import DescriptionIcon from "@mui/icons-material/Description";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import CircularProgress from "@mui/material/CircularProgress";
import ConfirmSaveDialog from "./ConfirmSaveDialog";
import ConfirmationDialog from "../../../components/ConfirmationDialog";
import { editBus } from "../../../buses/editBus";
import useCookieStatus from "../../../hooks/useCookieStatus";
import TableRow from "./TableRow";
import { usePagination, SHOW_ALL_VALUE } from "../hooks/usePagination";
import { useScrollToSelectedRow } from "../hooks/useScrollToSelectedRow";
import { normalizeFilterValue } from "../helpers/helpers";
import i18n from "src/i18n";

const DEFAULT_WRAP_CH = 100;
const SHOW_ALL_WARNING_THRESHOLD = 100;
const MIN_W = 80; // px
const MAX_W = 720; // px

const ColumnFilter = React.memo(function ColumnFilter({
  s,
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
  const anchorStyle = s.filterAnchor(placement);

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
        placeholder={i18n.t("attributeEditor.filter.searchValues")}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setShowAll(false);
        }}
        aria-label={i18n.t("attributeEditor.filter.searchValuesAria")}
      />
      <div style={s.filterOverlayButtons}>
        <button style={s.btnSmall} onClick={onClearFilter}>
          {i18n.t("common.clear")}
        </button>
        <button style={s.btnSmall} onClick={onSelectFiltered}>
          {i18n.t("attributeEditor.filter.selectFiltered", {
            number: filtered.length,
          })}
        </button>
        {filtered.length > MAX_SHOWN && !showAll && (
          <button style={s.btnSmall} onClick={() => setShowAll(true)}>
            {i18n.t("attributeEditor.filter.showAll", {
              number: filtered.length,
            })}
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
        {filtered.length === 0 && (
          <div style={s.listEmpty}>
            {i18n.t("attributeEditor.filter.noHits")}
          </div>
        )}
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
    splitMultiFeature,
    canSplitMultiFeature,
    mergeFeatures,
    canMergeFeatures,
    openSelectedInFormFromTable,
    commitTableEdits,
    summary,
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

    // GPS
    addFeatureFromGps,
    gpsLoading,
    supportsPointGeometry,
    onDiscard,
  } = props;

  const { functionalCookiesOk } = useCookieStatus(app.globalObserver);
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [savingNow, setSavingNow] = React.useState(false);
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

  // Reset to first page when filters or sort change — except when the change
  // comes from syncFilterOnCellChange keeping an active filter in step with a
  // cell edit; resetting then would throw the user to page 1 mid-editing.
  const suppressFilterPageResetRef = React.useRef(false);
  React.useEffect(() => {
    if (suppressFilterPageResetRef.current) {
      suppressFilterPageResetRef.current = false;
      return;
    }
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

      // Shared filter-space normalization (datetime reduction, boolean
      // Ja/Nej) — the form-edit sync in the View uses the same function.
      const colType = FIELD_META.find((m) => m.key === columnKey)?.type;
      const norm = (v) => normalizeFilterValue(colType, v);

      const fromStr = norm(fromValue);
      const toStr = norm(toValue);

      // Build an "effective" set of all rows (base + pending), excluding rows marked for deletion
      const effectiveAll = [
        ...features.map((f) => ({
          ...f,
          ...(tablePendingEdits?.[f.id] || {}),
        })),
        ...(tablePendingAdds || []),
      ].filter((r) => !tablePendingDeletes?.has?.(r.id));

      // This filter update only mirrors the cell edit (it is not a user-made
      // filter choice) — keep the user's current page.
      suppressFilterPageResetRef.current = true;
      setColumnFilters((prev) => {
        const before = prev?.[columnKey] || [];
        const nextSet = new Set(before.map((v) => norm(v)));

        if (toStr !== "") nextSet.add(toStr);

        if (fromStr !== "" && fromStr !== toStr) {
          const stillUsed = effectiveAll.some(
            (r) => r.id !== rowId && norm(r?.[columnKey]) === fromStr
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
      FIELD_META,
    ]
  );

  React.useEffect(() => {
    // If nothing is selected, nothing to do
    if (tableSelectedIds.size === 0) return;

    // Get IDs that are visible in the current filtered list
    // Use String() comparison to handle mixed types (string from GML vs number for drafts)
    const visibleSelectedIds = Array.from(tableSelectedIds).filter((id) =>
      filteredAndSorted.some((r) => String(r.id) === String(id))
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
    } catch {
      /* ignore */
    }
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
    // Note: commitTableEdits handles its own errors (snackbar) and never
    // throws, so there is no error branch here.
    try {
      setSavingNow(true);
      await Promise.resolve(commitTableEdits());
      setSaveDialogOpen(false);
    } finally {
      setSavingNow(false);
    }
  }

  return (
    <div style={s.tableWrap}>
      <div style={s.tableHeaderBar}>
        <span style={s.tableHeaderTitle}>
          {i18n.t("attributeEditor.table.allFeatures")}
        </span>
        <div style={s.spacer} />

        <>
          {tablePendingDeletes.size > 0 && (
            <span style={s.toolbarStatsColor(theme.danger)}>
              {i18n.t("attributeEditor.table.markedForDeletion", {
                count: tablePendingDeletes.size,
              })}
            </span>
          )}
          {tableHasPending && (
            <span style={s.toolbarStatsColor(theme.warning)}>
              {i18n.t("attributeEditor.unsavedChanges")}
            </span>
          )}

          <button
            style={
              !supportsPointGeometry || gpsLoading
                ? s.iconBtnDisabled
                : s.iconBtn
            }
            disabled={!supportsPointGeometry || gpsLoading}
            onClick={addFeatureFromGps}
            title={
              !supportsPointGeometry
                ? i18n.t("attributeEditor.actions.gpsNoPointLayer")
                : gpsLoading
                  ? i18n.t("attributeEditor.actions.gpsLoading")
                  : i18n.t("attributeEditor.actions.gpsCreate")
            }
            aria-label={i18n.t("attributeEditor.actions.gpsPoint")}
          >
            {gpsLoading ? (
              <CircularProgress size={18} />
            ) : (
              <GpsFixedIcon fontSize="small" />
            )}
          </button>

          <button
            style={
              filteredAndSorted.length === 0 ? s.iconBtnDisabled : s.iconBtn
            }
            disabled={filteredAndSorted.length === 0}
            onClick={() => exportToExcel(filteredAndSorted)}
            title={
              filteredAndSorted.length
                ? i18n.t("attributeEditor.actions.exportExcelRows", {
                    count: filteredAndSorted.length,
                  })
                : i18n.t("attributeEditor.actions.noRowsToExport")
            }
            aria-label={i18n.t("attributeEditor.actions.exportExcel")}
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
                ? i18n.t("attributeEditor.actions.zoomToCount", {
                    count: tableSelectedIds.size,
                  })
                : tableSelectedIds.size === 1
                  ? i18n.t("attributeEditor.actions.zoomToOne")
                  : i18n.t("attributeEditor.actions.selectRowsFirst")
            }
            aria-label={i18n.t("attributeEditor.actions.zoomToSelected")}
          >
            <CenterFocusStrongIcon fontSize="small" />
          </button>
          <button
            style={tableSelectedIds.size === 0 ? s.iconBtnDisabled : s.iconBtn}
            disabled={tableSelectedIds.size === 0}
            onClick={scrollToSelectedRow}
            title={
              tableSelectedIds.size > 1
                ? i18n.t("attributeEditor.actions.showSelectedRowIndex", {
                    index: currentScrollIndex + 1,
                    total: tableSelectedIds.size,
                  })
                : tableSelectedIds.size === 1
                  ? i18n.t("attributeEditor.actions.showSelectedRowInTable")
                  : i18n.t("attributeEditor.actions.selectRowsFirst")
            }
            aria-label={i18n.t("attributeEditor.actions.showSelected")}
          >
            <VisibilityIcon fontSize="small" />
          </button>
          <button
            style={tableSelectedIds.size === 0 ? s.iconBtnDisabled : s.iconBtn}
            disabled={tableSelectedIds.size === 0}
            onClick={duplicateSelectedRows}
            title={
              tableSelectedIds.size
                ? i18n.t("attributeEditor.actions.duplicateSelected", {
                    count: tableSelectedIds.size,
                  })
                : i18n.t("attributeEditor.actions.selectRowsFirst")
            }
            aria-label={i18n.t("attributeEditor.actions.duplicate")}
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
                ? i18n.t("attributeEditor.actions.splitSelectOneRow")
                : !canSplitGeometry
                  ? i18n.t("attributeEditor.actions.splitOnlyPolygonLine")
                  : i18n.t("attributeEditor.actions.splitWithLine")
            }
            aria-label={i18n.t("attributeEditor.actions.split")}
          >
            <CallSplitIcon fontSize="small" />
          </button>

          <button
            style={
              !canSplitMultiFeature && !canMergeFeatures
                ? s.iconBtnDisabled
                : s.iconBtn
            }
            disabled={!canSplitMultiFeature && !canMergeFeatures}
            onClick={canSplitMultiFeature ? splitMultiFeature : mergeFeatures}
            title={
              canSplitMultiFeature
                ? i18n.t("attributeEditor.actions.splitMultiTooltip")
                : canMergeFeatures
                  ? i18n.t("attributeEditor.actions.mergeTooltip")
                  : tableSelectedIds.size === 1
                    ? i18n.t("attributeEditor.actions.splitOrMergeRows")
                    : tableSelectedIds.size < 2
                      ? i18n.t("attributeEditor.actions.splitOrMergeSelect")
                      : i18n.t("attributeEditor.actions.mergeSameType")
            }
            aria-label={
              canSplitMultiFeature
                ? i18n.t("attributeEditor.actions.splitMulti")
                : i18n.t("attributeEditor.actions.merge")
            }
          >
            {canSplitMultiFeature ? (
              <AccountTreeIcon fontSize="small" />
            ) : (
              <MergeTypeIcon fontSize="small" />
            )}
          </button>

          <button
            style={tableSelectedIds.size === 0 ? s.iconBtnDisabled : s.iconBtn}
            disabled={tableSelectedIds.size === 0}
            onClick={() => setDeleteState([...tableSelectedIds], "toggle")}
            title={
              tableSelectedIds.size
                ? i18n.t("attributeEditor.actions.markSelectedForDelete")
                : i18n.t("attributeEditor.actions.selectRowsFirst")
            }
            aria-label={i18n.t("attributeEditor.actions.markForDelete")}
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
            title={i18n.t("attributeEditor.actions.undoLatest")}
            aria-label={i18n.t("attributeEditor.actions.undoLatestAria")}
          >
            <UndoIcon fontSize="small" />
          </button>

          <button
            style={!tableHasPending ? s.iconBtnDisabled : s.iconBtn}
            disabled={!tableHasPending}
            onClick={() => setSaveDialogOpen(true)}
            title={i18n.t("common.save")}
            aria-label={i18n.t("common.save")}
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
                            title={i18n.t("attributeEditor.table.clickToSort")}
                            style={s.sortButton}
                          >
                            {sort.key === f.key
                              ? sort.dir === "asc"
                                ? "▲"
                                : "▼"
                              : "↕"}
                          </button>

                          {/* Redundant pointer target: the sort button above
                              is the accessible control for the same action,
                              so a second keyboard/tab stop here would only
                              duplicate it. */}
                          {/* eslint-disable-next-line jsx-a11y-x/click-events-have-key-events, jsx-a11y-x/no-static-element-interactions */}
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
                                ? i18n.t("attributeEditor.table.filterActive", {
                                    number: (columnFilters[f.key] || []).length,
                                  })
                                : i18n.t("attributeEditor.table.filter")
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
                              aria-label={i18n.t("attributeEditor.fieldInfo", {
                                field: f.label,
                              })}
                            >
                              <InfoOutlinedIcon style={{ fontSize: "16px" }} />
                            </button>
                          )}

                          {openFilterColumn === f.key && (
                            <ColumnFilter
                              s={s}
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
                      {/* Pointer-only affordance for column resizing (drag
                          handle); column widths are cosmetic and all data
                          stays reachable without it. */}
                      {/* eslint-disable-next-line jsx-a11y-x/no-static-element-interactions */}
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
                        title={i18n.t("attributeEditor.table.resizeColumn")}
                        aria-label={i18n.t(
                          "attributeEditor.table.resizeColumnAria",
                          {
                            field: f.label,
                          }
                        )}
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
                    <span style={s.inlineFlexCenter}>
                      {props.isLoading ? (
                        <>
                          {i18n.t("attributeEditor.loading")}
                          <CircularProgress size={16} />
                        </>
                      ) : (
                        i18n.t("attributeEditor.noFeatures")
                      )}
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
              ? i18n.t("attributeEditor.table.showingAll", {
                  count: totalRows,
                })
              : i18n.t("attributeEditor.table.showingRange", {
                  from: startIndex + 1,
                  to: endIndex,
                  total: totalRows,
                })}
          </div>

          <div style={s.spacer} />

          <div style={s.paginationControls}>
            <label style={s.rowsPerPageLabel}>
              {i18n.t("attributeEditor.pagination.rowsPerPage")}
              <select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                style={s.rowsPerPageSelect}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={SHOW_ALL_VALUE}>
                  {i18n.t("attributeEditor.pagination.all")}
                </option>
              </select>
            </label>

            <button
              style={currentPage === 0 ? s.iconBtnDisabled : s.iconBtn}
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(0)}
              title={i18n.t("attributeEditor.pagination.first")}
              aria-label={i18n.t("attributeEditor.pagination.first")}
            >
              <FirstPageIcon fontSize="small" />
            </button>

            <button
              style={currentPage === 0 ? s.iconBtnDisabled : s.iconBtn}
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
              title={i18n.t("attributeEditor.pagination.previous")}
              aria-label={i18n.t("attributeEditor.pagination.previous")}
            >
              <NavigateBeforeIcon fontSize="small" />
            </button>

            <span style={s.pageIndicator}>
              {i18n.t("attributeEditor.pagination.page", {
                page: currentPage + 1,
                total: totalPages,
              })}
            </span>

            <button
              style={
                currentPage >= totalPages - 1 ? s.iconBtnDisabled : s.iconBtn
              }
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(currentPage + 1)}
              title={i18n.t("attributeEditor.pagination.next")}
              aria-label={i18n.t("attributeEditor.pagination.next")}
            >
              <NavigateNextIcon fontSize="small" />
            </button>

            <button
              style={
                currentPage >= totalPages - 1 ? s.iconBtnDisabled : s.iconBtn
              }
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(totalPages - 1)}
              title={i18n.t("attributeEditor.pagination.last")}
              aria-label={i18n.t("attributeEditor.pagination.last")}
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
        onDiscard={onDiscard}
        summary={summary}
        saving={savingNow}
        title={i18n.t("attributeEditor.dialog.saveTitle")}
        body={i18n.t("attributeEditor.dialog.saveBodyTable")}
        primaryLabel={i18n.t("common.save")}
      />

      <ConfirmationDialog
        open={showAllConfirmOpen}
        titleName={i18n.t("attributeEditor.dialog.showAllTitle")}
        contentDescription={i18n.t("attributeEditor.dialog.showAllText")}
        cancel={i18n.t("common.cancel")}
        confirm={i18n.t("common.continue")}
        handleConfirm={handleShowAllConfirm}
        handleAbort={handleShowAllAbort}
      />
    </div>
  );
}

import React from "react";
import UndoIcon from "@mui/icons-material/Undo";
import SaveIcon from "@mui/icons-material/Save";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import MergeTypeIcon from "@mui/icons-material/MergeType";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import VisibilityIcon from "@mui/icons-material/Visibility";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import DescriptionIcon from "@mui/icons-material/Description";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import CircularProgress from "@mui/material/CircularProgress";
import {
  getIdsForDeletion,
  isMissingValue,
  autoIsMultiline,
} from "../helpers/helpers";
import ConfirmSaveDialog from "./ConfirmSaveDialog";
import ConfirmationDialog from "../../../components/ConfirmationDialog";
import { editBus } from "../../../buses/editBus";
import FormListItem from "./FormListItem";
import useCookieStatus from "../../../hooks/useCookieStatus";
import { usePagination, SHOW_ALL_VALUE } from "../hooks/usePagination";
import { useScrollToSelectedRow } from "../hooks/useScrollToSelectedRow";
import i18n from "src/i18n";

const RESIZER_KEY = "ae_df_leftw";
const SHOW_ALL_WARNING_THRESHOLD = 100;
const MIN_LEFT = 220; // px
const MAX_LEFT = 800; // px

export default function DesktopForm({
  s,
  filterPageResetSuppressRef,
  // left list
  visibleFormList,
  selectedIds,
  onFormRowClick,
  focusedId,
  focusPrev,
  focusNext,

  // right form
  focusedFeature,
  FIELD_META,
  changedFields,
  editValues,
  handleFieldChange,
  renderInput,
  dirty,
  resetEdits,
  saveChanges,
  setDeleteState,
  tablePendingDeletes,
  tableHasPending,
  commitTableEdits,
  summary,
  tableUndoStack,
  undoLatestTableChange,
  formUndoStack,
  undoLatestFormChange,
  tablePendingEdits,
  tablePendingAdds,
  duplicateInForm,
  splitFeature,
  canSplitGeometry,
  splitMultiFeature,
  canSplitMultiFeature,
  mergeFeatures,
  canMergeFeatures,
  hasGeomUndo,
  columnFilters,
  setColumnFilters,
  handleRowHover,
  handleRowLeave,
  app,
  exportToExcel,
  addFeatureFromGps,
  gpsLoading,
  supportsPointGeometry,
  isLoading,
  onDiscard,
}) {
  const { functionalCookiesOk } = useCookieStatus(app.globalObserver);

  const [leftW, setLeftW] = React.useState(() => {
    const saved = Number(localStorage.getItem(RESIZER_KEY));
    return Number.isFinite(saved) && saved >= MIN_LEFT ? saved : 360; // default
  });

  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [savingNow, setSavingNow] = React.useState(false);

  // State for "show all" confirmation dialog
  const [showAllConfirmOpen, setShowAllConfirmOpen] = React.useState(false);

  const textareaRefs = React.useRef({});
  const [pendingCaret, setPendingCaret] = React.useState(null);
  const saveLeftWTimer = React.useRef(null);

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
  } = usePagination(visibleFormList, {
    storageKey: "ae_rows_per_page",
    defaultPerPage: 20,
    functionalCookiesOk,
  });

  // Reset to first page when filters change — except when the change comes
  // from the View's form-edit filter sync (it sets the suppress ref):
  // resetting then would yank the list to page 1 on every keystroke in a
  // filtered column.
  React.useEffect(() => {
    if (filterPageResetSuppressRef?.current) {
      filterPageResetSuppressRef.current = false;
      return;
    }
    setCurrentPage(0);
  }, [columnFilters, setCurrentPage, filterPageResetSuppressRef]);

  // Navigate to the page containing focusedId when it actually changes
  // (e.g. via focusPrev/focusNext). We track the previous value so that
  // re-renders caused by visibleFormList updates (bulk edits etc.) don't
  // snap the user back to focusedId's page. Starts as null so the mount
  // itself counts as a focus change and jumps to the focused row's page.
  // String comparison bridges mixed id types.
  const prevFocusedIdRef = React.useRef(null);
  React.useEffect(() => {
    if (focusedId == null || isShowingAll) return;
    if (String(focusedId) === String(prevFocusedIdRef.current)) return;
    prevFocusedIdRef.current = focusedId;

    const rowIndex = visibleFormList.findIndex(
      (r) => String(r.id) === String(focusedId)
    );
    if (rowIndex === -1) return;

    const targetPage = Math.floor(rowIndex / rowsPerPage);
    setCurrentPage((prev) => (prev !== targetPage ? targetPage : prev));
  }, [focusedId, visibleFormList, rowsPerPage, isShowingAll, setCurrentPage]);

  // Shared scroll-to-selected hook
  const {
    scrollToSelectedRow,
    selectedRowRefs,
    currentScrollIndex,
    viewedRowId,
  } = useScrollToSelectedRow({
    selectedIds,
    focusedId,
    items: visibleFormList,
    rowsPerPage,
    currentPage,
    setCurrentPage,
    handleRowHover,
    handleRowLeave,
  });

  const registerTextareaRef = React.useCallback((key, el) => {
    if (el) textareaRefs.current[key] = el;
  }, []);

  const requestFocusCaret = React.useCallback((key, pos) => {
    setPendingCaret({ key, pos });
  }, []);

  const prevMultilineRef = React.useRef({});

  const resizeRef = React.useRef(null); // { startX, startW }

  const activeFilterCount = React.useMemo(() => {
    if (!columnFilters) return 0;
    return Object.values(columnFilters).filter(
      (arr) => Array.isArray(arr) && arr.length > 0
    ).length;
  }, [columnFilters]);

  const clearColumnFilters = React.useCallback(() => {
    setColumnFilters({});
  }, [setColumnFilters]);

  React.useEffect(() => {
    function onMove(e) {
      const r = resizeRef.current;
      if (!r) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const dx = clientX - r.startX;
      const next = Math.max(MIN_LEFT, Math.min(MAX_LEFT, r.startW + dx));
      setLeftW(next);
      // prevent text selection on touch
      if (e.cancelable) e.preventDefault?.();
    }
    function onUp() {
      resizeRef.current = null;
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

  React.useEffect(() => {
    try {
      if (saveLeftWTimer.current) clearTimeout(saveLeftWTimer.current);
      saveLeftWTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(RESIZER_KEY, String(Math.round(leftW)));
        } catch {
          /* ignore */
        }
      }, 150);
    } catch {
      /* ignore */
    }
    return () => {
      if (saveLeftWTimer.current) clearTimeout(saveLeftWTimer.current);
    };
  }, [leftW]);

  const prevCaretFocusIdRef = React.useRef(null);
  React.useEffect(() => {
    if (!focusedFeature) return;

    // The caret handoff below is only for a field that grows into a textarea
    // WHILE the user types in it (the input element is replaced, so focus
    // must be moved into the textarea). When the focused feature changes we
    // only re-baseline which fields are multiline — setting the caret then
    // would steal focus to the last multiline field on every object switch.
    const sameFeature =
      prevCaretFocusIdRef.current != null &&
      String(prevCaretFocusIdRef.current) === String(focusedId);
    prevCaretFocusIdRef.current = focusedId;

    FIELD_META.forEach((meta) => {
      const key = meta.key;
      const val = editValues?.[key];
      const nowMultiline =
        meta.type === "textarea" || autoIsMultiline(val, meta);
      const wasMultiline = !!prevMultilineRef.current[key];

      // transition: input -> textarea
      if (sameFeature && !wasMultiline && nowMultiline) {
        const pos = String(val ?? "").length; // caret last
        setPendingCaret({ key, pos });
      }
      prevMultilineRef.current[key] = nowMultiline;
    });
  }, [FIELD_META, editValues, focusedFeature, focusedId]);

  React.useEffect(() => {
    if (focusedId != null) {
      editBus.emit("attrib:focus-id", { id: focusedId, source: "view" });
    }
  }, [focusedId]);

  React.useEffect(() => {
    if (!pendingCaret) return;
    const el = textareaRefs.current[pendingCaret.key];
    if (el) {
      try {
        el.focus();
        el.selectionStart = el.selectionEnd = pendingCaret.pos;
      } catch {
        /* ignore */
      }
    }
    setPendingCaret(null);
  }, [pendingCaret]);

  const handleDeleteClick = () => {
    const ids = getIdsForDeletion(selectedIds, focusedId);
    if (!ids.length) return;

    // Mark all ids for deletion (drafts + existing)
    // – this keeps the row (struck-through) and removes the sketch geometry
    //   via the back-sync you already have for drafts (__pending === 'delete').
    setDeleteState(ids, "toggle");
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
    try {
      setSavingNow(true);

      if (dirty) {
        saveChanges({ toPending: true });
      }

      await Promise.resolve(commitTableEdits());
    } finally {
      setSavingNow(false);
      setSaveDialogOpen(false);
    }
  }

  const canUndo = !!(
    tableUndoStack?.length ||
    formUndoStack?.length ||
    hasGeomUndo ||
    dirty
  );

  return (
    <div
      style={{
        ...s.paneWrap,
        display: "grid",
        gridTemplateColumns: `${leftW}px 8px 1fr`,
        alignItems: "stretch",
      }}
    >
      {/* Left: Object list */}
      <div
        style={s.pane}
        aria-label={i18n.t("attributeEditor.form.featureList")}
      >
        <div style={s.list}>
          {paginatedRows.map((f, idx) => {
            const selected =
              selectedIds.has(f.id) || selectedIds.has(String(f.id));
            const isFocused = String(focusedId) === String(f.id);
            const isPendingDelete =
              f.__pending === "delete" || tablePendingDeletes?.has?.(f.id);
            const hasPendingEdits = !!tablePendingEdits?.[f.id];
            const hasGeomChange = !!tablePendingEdits?.[f.id]?.__geom__;
            const isDraftAdd =
              f.__pending === "add" ||
              tablePendingAdds?.some?.(
                (d) => d.id === f.id && d.__pending !== "delete"
              );

            // Use stable composite key: drafts get prefix to avoid collision
            const stableKey = f.id < 0 ? `draft_${f.id}` : f.id;

            return (
              <FormListItem
                key={stableKey}
                row={f}
                idx={startIndex + idx}
                FIELD_META={FIELD_META}
                s={s}
                selected={selected}
                isFocused={isFocused}
                isPendingDelete={isPendingDelete}
                hasPendingEdits={hasPendingEdits}
                hasGeomChange={hasGeomChange}
                isDraftAdd={isDraftAdd}
                onFormRowClick={onFormRowClick}
                selectedRowRefs={selectedRowRefs}
                handleRowHover={handleRowHover}
                handleRowLeave={handleRowLeave}
                isViewedRow={f.id === viewedRowId}
              />
            );
          })}
          {visibleFormList.length === 0 && (
            <div style={s.listEmptyFlex}>
              {isLoading ? (
                <>
                  {i18n.t("attributeEditor.loading")}
                  <CircularProgress size={16} />
                </>
              ) : (
                i18n.t("attributeEditor.noFeatures")
              )}
            </div>
          )}
        </div>

        {/* List footer with pagination */}
        <div style={s.listFooterCompact}>
          <div style={s.paginationInfo}>
            {isShowingAll
              ? i18n.t("attributeEditor.pagination.allCount", {
                  number: totalRows,
                })
              : i18n.t("attributeEditor.pagination.range", {
                  from: startIndex + 1,
                  to: endIndex,
                  total: totalRows,
                })}
          </div>
          {showPagination && (
            <>
              <div style={s.spacer} />
              <div style={s.paginationControlsCompact}>
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

                <span style={s.pageIndicatorCompact}>
                  {currentPage + 1}/{totalPages}
                </span>

                <button
                  style={
                    currentPage >= totalPages - 1
                      ? s.iconBtnDisabled
                      : s.iconBtn
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
                    currentPage >= totalPages - 1
                      ? s.iconBtnDisabled
                      : s.iconBtn
                  }
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage(totalPages - 1)}
                  title={i18n.t("attributeEditor.pagination.last")}
                  aria-label={i18n.t("attributeEditor.pagination.last")}
                >
                  <LastPageIcon fontSize="small" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* This is the WAI-ARIA "window splitter" pattern: a focusable
          separator resized with the arrow keys. jsx-a11y's default config
          does not model focusable separators, so it flags the listeners and
          tabIndex even though the element is fully keyboard-accessible. */}
      {/* eslint-disable jsx-a11y-x/no-noninteractive-element-interactions,
          jsx-a11y-x/no-noninteractive-tabindex */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuemin={MIN_LEFT}
        aria-valuemax={MAX_LEFT}
        aria-valuenow={Math.round(leftW)}
        tabIndex={0}
        title={i18n.t("attributeEditor.form.resizePanel")}
        onMouseDown={(e) => {
          e.preventDefault();
          resizeRef.current = { startX: e.clientX, startW: leftW };
        }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          resizeRef.current = { startX: t.clientX, startW: leftW };
        }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 40 : 10;
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            setLeftW((w) => Math.max(MIN_LEFT, w - step));
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            setLeftW((w) => Math.min(MAX_LEFT, w + step));
          }
        }}
        style={s.resizerGrip}
      />
      {/* eslint-enable jsx-a11y-x/no-noninteractive-element-interactions,
          jsx-a11y-x/no-noninteractive-tabindex */}

      {/* Right: Form */}
      <div style={s.pane} aria-label={i18n.t("attributeEditor.form.form")}>
        {activeFilterCount > 0 && (
          <div style={s.filterWarningBanner}>
            <svg
              style={s.filterWarningIcon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
            <span style={s.spacer}>
              {i18n.t("attributeEditor.form.columnFiltersActive", {
                count: activeFilterCount,
              })}
            </span>
            <button
              style={s.btnSmall}
              onClick={clearColumnFilters}
              title={i18n.t("attributeEditor.form.clearAllFilters")}
            >
              {i18n.t("attributeEditor.form.clearFilters")}
            </button>
          </div>
        )}
        {selectedIds.size > 1 && (
          <div style={s.bulkEditWarning}>
            <svg
              style={s.bulkEditWarningIcon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              {i18n.t("attributeEditor.form.bulkEditWarning", {
                count: selectedIds.size,
              })}
            </span>
          </div>
        )}
        <div style={s.paneHeaderWithActions}>
          <span>{i18n.t("attributeEditor.form.editAttributes")}</span>
          <div style={s.spacer} />
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
            style={visibleFormList.length === 0 ? s.iconBtnDisabled : s.iconBtn}
            disabled={visibleFormList.length === 0}
            onClick={() => exportToExcel(visibleFormList)}
            aria-label={i18n.t("attributeEditor.actions.exportExcel")}
            title={
              visibleFormList.length
                ? i18n.t("attributeEditor.actions.exportExcelRows", {
                    count: visibleFormList.length,
                  })
                : i18n.t("attributeEditor.actions.noRowsToExport")
            }
          >
            <DescriptionIcon fontSize="small" />
          </button>
          <button
            style={
              selectedIds.size === 0 && focusedId == null
                ? s.iconBtnDisabled
                : s.iconBtn
            }
            disabled={selectedIds.size === 0 && focusedId == null}
            onClick={() => {
              const ids =
                selectedIds.size > 0
                  ? Array.from(selectedIds)
                  : focusedId != null
                    ? [focusedId]
                    : [];
              if (ids.length > 0) {
                editBus.emit("attrib:zoom-to-features", { ids });
              }
            }}
            aria-label={i18n.t("attributeEditor.actions.zoomToSelected")}
            title={
              selectedIds.size > 1
                ? i18n.t("attributeEditor.actions.zoomToCount", {
                    count: selectedIds.size,
                  })
                : selectedIds.size === 1 || focusedId != null
                  ? i18n.t("attributeEditor.actions.zoomToOne")
                  : i18n.t("attributeEditor.actions.chooseFeaturesFirst")
            }
          >
            <CenterFocusStrongIcon fontSize="small" />
          </button>
          <button
            style={
              selectedIds.size === 0 && focusedId == null
                ? s.iconBtnDisabled
                : s.iconBtn
            }
            disabled={selectedIds.size === 0 && focusedId == null}
            onClick={scrollToSelectedRow}
            title={
              selectedIds.size > 1
                ? i18n.t("attributeEditor.actions.showSelectedRowWithTooltip", {
                    index: currentScrollIndex + 1,
                    total: selectedIds.size,
                  })
                : selectedIds.size === 1 || focusedId != null
                  ? i18n.t("attributeEditor.actions.showSelectedRowInList")
                  : i18n.t("attributeEditor.actions.selectFeaturesFirst")
            }
            aria-label={i18n.t("attributeEditor.actions.showSelected")}
          >
            <VisibilityIcon fontSize="small" />
          </button>
          <button
            style={
              selectedIds.size === 0 && focusedId == null
                ? s.iconBtnDisabled
                : s.iconBtn
            }
            disabled={selectedIds.size === 0 && focusedId == null}
            onClick={duplicateInForm}
            aria-label={i18n.t("attributeEditor.actions.duplicateAria")}
            title={
              selectedIds.size
                ? i18n.t("attributeEditor.actions.duplicateCount", {
                    count: selectedIds.size,
                  })
                : focusedId != null
                  ? i18n.t("attributeEditor.actions.duplicateOne")
                  : i18n.t("attributeEditor.actions.chooseFeaturesFirst")
            }
          >
            <ContentCopyIcon fontSize="small" />
          </button>

          <button
            style={
              selectedIds.size !== 1 || !canSplitGeometry
                ? s.iconBtnDisabled
                : s.iconBtn
            }
            disabled={selectedIds.size !== 1 || !canSplitGeometry}
            onClick={splitFeature}
            aria-label={i18n.t("attributeEditor.actions.split")}
            title={
              selectedIds.size !== 1
                ? i18n.t("attributeEditor.actions.splitSelectOneFeature")
                : !canSplitGeometry
                  ? i18n.t("attributeEditor.actions.splitOnlyPolygonLine")
                  : i18n.t("attributeEditor.actions.splitWithLine")
            }
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
            aria-label={
              canSplitMultiFeature
                ? i18n.t("attributeEditor.actions.splitMulti")
                : i18n.t("attributeEditor.actions.merge")
            }
            title={
              canSplitMultiFeature
                ? i18n.t("attributeEditor.actions.splitMultiTooltip")
                : canMergeFeatures
                  ? i18n.t("attributeEditor.actions.mergeTooltip")
                  : selectedIds.size === 1
                    ? i18n.t("attributeEditor.actions.splitOrMergeFeatures")
                    : selectedIds.size < 2
                      ? i18n.t("attributeEditor.actions.splitOrMergeSelect")
                      : i18n.t("attributeEditor.actions.mergeSameType")
            }
          >
            {canSplitMultiFeature ? (
              <AccountTreeIcon fontSize="small" />
            ) : (
              <MergeTypeIcon fontSize="small" />
            )}
          </button>

          <button
            style={
              selectedIds.size === 0 && focusedId == null
                ? s.iconBtnDisabled
                : s.iconBtn
            }
            disabled={selectedIds.size === 0 && focusedId == null}
            onClick={handleDeleteClick}
            aria-label={i18n.t("attributeEditor.actions.markForDelete")}
            title={
              selectedIds.size
                ? i18n.t("attributeEditor.actions.markCountForDelete", {
                    count: selectedIds.size,
                  })
                : focusedId != null
                  ? i18n.t("attributeEditor.actions.markOneForDelete")
                  : i18n.t("attributeEditor.actions.selectFeaturesFirst")
            }
          >
            <DeleteOutlineIcon fontSize="small" />
          </button>

          <button
            style={canUndo ? s.iconBtn : s.iconBtnDisabled}
            disabled={!canUndo}
            onClick={() => {
              if (tableUndoStack?.length) {
                // includes possible __geom__ entries in the model's stack
                undoLatestTableChange();
                return;
              }
              if (formUndoStack?.length) {
                undoLatestFormChange();
                return;
              }
              if (hasGeomUndo) {
                // let the time-based dispatcher handle geometry undo here
                undoLatestTableChange();
                return;
              }
              if (dirty) {
                resetEdits();
                return;
              }
            }}
            aria-label={i18n.t("common.undo")}
            title={i18n.t("common.undo")}
          >
            <UndoIcon fontSize="small" />
          </button>

          <button
            style={!(dirty || tableHasPending) ? s.iconBtnDisabled : s.iconBtn}
            onClick={() => setSaveDialogOpen(true)}
            disabled={!(dirty || tableHasPending)}
            aria-label={i18n.t("common.save")}
            title={i18n.t("common.save")}
          >
            <SaveIcon fontSize="small" />
          </button>
        </div>

        {!focusedFeature ? (
          <div style={s.formEmpty}>
            {i18n.t("attributeEditor.form.selectToEditLeft")}
          </div>
        ) : (
          <>
            <div style={s.form}>
              {FIELD_META.map((meta) => {
                const changed = changedFields.has(meta.key);
                const val = editValues?.[meta.key];
                const isMultiline =
                  meta.type === "textarea" || autoIsMultiline(val, meta);

                return (
                  <div key={meta.key} style={s.field}>
                    <label style={s.label}>
                      {meta.label}
                      {meta.description && meta.description.trim() && (
                        <button
                          style={s.descriptionIcon}
                          title={meta.description}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={i18n.t("attributeEditor.fieldInfo", {
                            field: meta.label,
                          })}
                        >
                          <InfoOutlinedIcon style={{ fontSize: "16px" }} />
                        </button>
                      )}
                      {changed && (
                        <span style={s.labelChanged}>
                          {i18n.t("attributeEditor.form.changedParens")}
                        </span>
                      )}
                    </label>

                    {renderInput(
                      meta,
                      meta.readOnly && isMissingValue(val)
                        ? i18n.t("attributeEditor.missingValue")
                        : val,
                      (v) => handleFieldChange(meta.key, v),
                      changed,
                      s,
                      {
                        enterCommits: true,
                        multiline: isMultiline,
                        fieldKey: meta.key,
                        registerTextareaRef,
                        requestFocusCaret,
                      }
                    )}
                  </div>
                );
              })}
            </div>
            <div
              style={
                dirty || tableHasPending ? s.formFooterDirty : s.formFooter
              }
            >
              <button style={s.btn} onClick={focusPrev}>
                &larr; {i18n.t("attributeEditor.form.previousFeature")}
              </button>
              <button style={s.btn} onClick={focusNext}>
                {i18n.t("attributeEditor.form.nextFeature")}&rarr;
              </button>
              <div style={s.spacer} />
              {dirty
                ? i18n.t("attributeEditor.form.unsavedFields", {
                    count: changedFields.size,
                  })
                : tableHasPending
                  ? i18n.t("attributeEditor.form.buffered")
                  : i18n.t("attributeEditor.form.allSaved")}
            </div>
          </>
        )}

        <ConfirmSaveDialog
          open={saveDialogOpen}
          onClose={() => setSaveDialogOpen(false)}
          onConfirm={confirmSave}
          onDiscard={onDiscard}
          summary={summary}
          saving={savingNow}
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
    </div>
  );
}

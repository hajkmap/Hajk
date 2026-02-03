import React from "react";
import UndoIcon from "@mui/icons-material/Undo";
import SaveIcon from "@mui/icons-material/Save";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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

const RESIZER_KEY = "ae_df_leftw";
const SHOW_ALL_WARNING_THRESHOLD = 100;
const MIN_LEFT = 220; // px
const MAX_LEFT = 800; // px

export default function DesktopForm({
  s,
  theme,
  // left list
  visibleFormList,
  selectedIds,
  onFormRowClick,
  focusedId,
  lastEditTargetIdsRef,
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

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(0);
  }, [columnFilters, setCurrentPage]);

  // Navigate to the page containing focusedId when it changes (e.g. via focusPrev/focusNext)
  React.useEffect(() => {
    if (focusedId == null || isShowingAll) return;

    const rowIndex = visibleFormList.findIndex((r) => r.id === focusedId);
    if (rowIndex === -1) return;

    const targetPage = Math.floor(rowIndex / rowsPerPage);
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
    }
  }, [
    focusedId,
    visibleFormList,
    rowsPerPage,
    currentPage,
    isShowingAll,
    setCurrentPage,
  ]);

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
        } catch {}
      }, 150);
    } catch {}
    return () => {
      if (saveLeftWTimer.current) clearTimeout(saveLeftWTimer.current);
    };
  }, [leftW]);

  React.useEffect(() => {
    if (!focusedFeature) return;

    FIELD_META.forEach((meta) => {
      const key = meta.key;
      const val = editValues?.[key];
      const nowMultiline =
        meta.type === "textarea" || autoIsMultiline(val, meta);
      const wasMultiline = !!prevMultilineRef.current[key];

      // transition: input -> textarea
      if (!wasMultiline && nowMultiline) {
        const pos = String(val ?? "").length; // caret last
        setPendingCaret({ key, pos });
      }
      prevMultilineRef.current[key] = nowMultiline;
    });
  }, [FIELD_META, editValues, focusedFeature]);

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
      } catch {}
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

  const summary = React.useMemo(
    () => ({
      adds:
        tablePendingAdds?.filter((d) => d.__pending !== "delete").length ?? 0,
      edits:
        (tablePendingEdits ? Object.keys(tablePendingEdits).length : 0) +
        (dirty ? changedFields.size : 0),
      deletes:
        (tablePendingDeletes?.size ?? 0) +
        (tablePendingAdds?.filter((d) => d.__pending === "delete").length ?? 0),
    }),
    [
      tablePendingAdds,
      tablePendingEdits,
      tablePendingDeletes,
      dirty,
      changedFields,
    ]
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
      setSavingNow(true);

      // reset the summary of pending changes
      if (dirty) {
        saveChanges({
          toPending: true,
          targetIds: lastEditTargetIdsRef.current || undefined,
        });
      }

      // save all pending changes (table + form) – this prop is sync; Promise.resolve makes await work seamlessly
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
      <div style={s.pane} aria-label="Objektlista">
        <div style={s.list}>
          {paginatedRows.map((f, idx) => {
            const selected = selectedIds.has(f.id);
            const isFocused = focusedId === f.id;
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
            <div
              style={{
                ...s.listEmpty,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Laddning pågår...
              <CircularProgress size={16} />
            </div>
          )}
        </div>

        {/* List footer with pagination */}
        <div style={s.listFooterCompact}>
          <div style={s.paginationInfo}>
            {isShowingAll
              ? `Alla ${totalRows}`
              : `${startIndex + 1}-${endIndex} av ${totalRows}`}
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
                  <option value={SHOW_ALL_VALUE}>Alla</option>
                </select>

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
                  title="Nästa sida"
                  aria-label="Nästa sida"
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
                  title="Sista sidan"
                  aria-label="Sista sidan"
                >
                  <LastPageIcon fontSize="small" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuemin={MIN_LEFT}
        aria-valuemax={MAX_LEFT}
        aria-valuenow={Math.round(leftW)}
        tabIndex={0}
        title="Dra för att ändra panelbredd"
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
        style={{
          cursor: "col-resize",
          // snappy grip: a thin vertical line
          background:
            "linear-gradient(to right, transparent 0, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 5px, transparent 5px)",
          width: "8px",
          userSelect: "none",
          touchAction: "none",
        }}
      />

      {/* Right: Form */}
      <div style={s.pane} aria-label="Formulär">
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
            <span style={{ flex: 1 }}>
              Kolumnfilter från tabellläget är aktiva ({activeFilterCount}{" "}
              filter påverkar kartan)
            </span>
            <button
              style={s.btnSmall}
              onClick={clearColumnFilters}
              title="Rensa alla kolumnfilter"
            >
              Rensa filter
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
              OBS! Nu redigerar du {selectedIds.size} objekt samtidigt
            </span>
          </div>
        )}
        <div style={s.paneHeaderWithActions}>
          <span>Redigera attribut</span>
          <div style={s.spacer} />
          <button
            style={visibleFormList.length === 0 ? s.iconBtnDisabled : s.iconBtn}
            disabled={visibleFormList.length === 0}
            onClick={() => exportToExcel(visibleFormList)}
            aria-label="Exportera till Excel"
            title={
              visibleFormList.length
                ? `Exportera till Excel (${visibleFormList.length} rader)`
                : "Inga rader att exportera"
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
            aria-label="Zooma till valda"
            title={
              selectedIds.size > 1
                ? `Zooma till ${selectedIds.size} objekt i kartan`
                : selectedIds.size === 1 || focusedId != null
                  ? "Zooma till valt objekt i kartan"
                  : "Välj objekt först"
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
                ? `Skrolla till markerad rad med tooltip (${currentScrollIndex + 1}/${selectedIds.size})`
                : selectedIds.size === 1 || focusedId != null
                  ? "Skrolla till markerad rad i listan och visa på kartan"
                  : "Markera objekt först"
            }
            aria-label="Skrolla till markerad"
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
            aria-label="Duplicera"
            title={
              selectedIds.size
                ? `Duplicera ${selectedIds.size} objekt`
                : focusedId != null
                  ? "Duplicera valt objekt"
                  : "Välj objekt först"
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
            aria-label="Dela objekt"
            title={
              selectedIds.size !== 1
                ? "Markera exakt ett objekt för att dela"
                : !canSplitGeometry
                  ? "Endast Polygon och LineString kan delas"
                  : "Dela valt objekt med en klipplinje"
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
              canSplitMultiFeature ? "Dela upp multi-objekt" : "Slå ihop objekt"
            }
            title={
              canSplitMultiFeature
                ? "Dela upp multi-objekt till enskilda objekt"
                : canMergeFeatures
                  ? "Slå ihop markerade objekt till ett multi-objekt"
                  : selectedIds.size === 1
                    ? "Markera ett multi-objekt för att dela upp, eller flera objekt för att slå ihop"
                    : selectedIds.size < 2
                      ? "Markera objekt för att dela upp eller slå ihop"
                      : "Objekten måste ha samma geometrityp för att slås ihop"
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
            aria-label="Markera för radering"
            title={
              selectedIds.size
                ? `Markera ${selectedIds.size} objekt för radering`
                : focusedId != null
                  ? "Markera valt objekt för radering"
                  : "Markera objekt först"
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
            aria-label="Ångra"
            title="Ångra"
          >
            <UndoIcon fontSize="small" />
          </button>

          <button
            style={!(dirty || tableHasPending) ? s.iconBtnDisabled : s.iconBtn}
            onClick={() => setSaveDialogOpen(true)}
            disabled={!(dirty || tableHasPending)}
            aria-label="Spara"
            title="Spara"
          >
            <SaveIcon fontSize="small" />
          </button>
        </div>

        {!focusedFeature ? (
          <div style={s.formEmpty}>
            Markera ett objekt i listan till vänster för att börja redigera.
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
                          aria-label={`Information om ${meta.label}`}
                        >
                          <InfoOutlinedIcon style={{ fontSize: "16px" }} />
                        </button>
                      )}
                      {changed && <span style={s.labelChanged}>(ändrad)</span>}
                    </label>

                    {renderInput(
                      meta,
                      meta.readOnly && isMissingValue(val) ? "#saknas" : val,
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
                &larr; Föregående objekt
              </button>
              <button style={s.btn} onClick={focusNext}>
                Nästa objekt&rarr;
              </button>
              <div style={s.spacer} />
              {dirty
                ? `Osparade ändringar (${changedFields.size} fält)`
                : tableHasPending
                  ? "Ändringar buffrade (ej sparade)"
                  : "Allt sparat"}
            </div>
            <ConfirmSaveDialog
              open={saveDialogOpen}
              onClose={() => setSaveDialogOpen(false)}
              onConfirm={confirmSave}
              summary={summary}
              saving={savingNow}
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
          </>
        )}
      </div>
    </div>
  );
}

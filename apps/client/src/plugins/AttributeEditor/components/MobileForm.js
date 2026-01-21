import React from "react";
import UndoIcon from "@mui/icons-material/Undo";
import SaveIcon from "@mui/icons-material/Save";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DescriptionIcon from "@mui/icons-material/Description";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ConfirmSaveDialog from "./ConfirmSaveDialog";
import {
  getIdsForDeletion,
  isMissingValue,
  autoIsMultiline,
} from "../helpers/helpers";
import { editBus } from "../../../buses/editBus";

export default function MobileForm({
  s,
  mobileActiveTab,
  setMobileActiveTab,

  // list
  visibleFormList,
  selectedIds,
  onFormRowClick,
  focusedId,
  handleBeforeChangeFocus,

  // form
  lastEditTargetIdsRef,
  focusedFeature,
  FIELD_META,
  changedFields,
  editValues,
  handleFieldChange,
  renderInput,
  dirty,
  resetEdits,
  saveChanges,

  // pending & commit
  tableHasPending,
  commitTableEdits,
  tablePendingDeletes,
  setDeleteState,
  tableUndoStack,
  undoLatestTableChange,
  formUndoStack,
  undoLatestFormChange,
  tablePendingEdits,
  tablePendingAdds,
  duplicateInForm,
  splitFeature,
  canSplitGeometry,
  hasGeomUndo,
  columnFilters,
  setColumnFilters,
  exportToExcel,
}) {
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [savingNow, setSavingNow] = React.useState(false);

  // Helpers

  const activeFilterCount = React.useMemo(() => {
    if (!columnFilters) return 0;
    return Object.values(columnFilters).filter(
      (arr) => Array.isArray(arr) && arr.length > 0
    ).length;
  }, [columnFilters]);

  const clearColumnFilters = React.useCallback(() => {
    setColumnFilters({});
  }, [setColumnFilters]);

  const handleDeleteClick = () => {
    const ids = getIdsForDeletion(selectedIds, focusedId);
    if (!ids.length) return;
    setDeleteState(ids, "toggle");
  };

  const handleDuplicateClick = () => {
    if (typeof duplicateInForm === "function") {
      duplicateInForm();
    }
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

  async function confirmSave() {
    try {
      setSavingNow(true);
      if (dirty) {
        saveChanges({
          toPending: true,
          targetIds: lastEditTargetIdsRef.current || undefined,
        });
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
    <>
      <div style={s.mobileTabBar}>
        <button
          style={s.mobileTab(mobileActiveTab === "list")}
          onClick={() => setMobileActiveTab("list")}
        >
          Objekt ({visibleFormList.length})
        </button>
        <button
          style={s.mobileTab(mobileActiveTab === "form")}
          onClick={() => setMobileActiveTab("form")}
        >
          Redigera {focusedId ? `(#${focusedId})` : ""}
        </button>
      </div>

      <div style={s.mobilePaneContainer}>
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
              Kolumnfilter aktiva ({activeFilterCount})
            </span>
            <button style={s.btnSmall} onClick={clearColumnFilters}>
              Rensa
            </button>
          </div>
        )}
        {mobileActiveTab === "list" ? (
          <>
            <div style={{ overflowX: "auto", flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {FIELD_META.map((meta) => (
                      <th
                        key={meta.key}
                        style={{
                          padding: "8px",
                          borderBottom: "2px solid #ddd",
                          textAlign: "left",
                          fontSize: "12px",
                          fontWeight: "600",
                          whiteSpace: "nowrap",
                          position: "sticky",
                          top: 0,
                          backgroundColor: "#fff",
                          zIndex: 1,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>{meta.label}</span>
                          {meta.description && meta.description.trim() && (
                            <button
                              style={s.descriptionIcon}
                              title={meta.description}
                              onClick={(e) => {
                                e.stopPropagation();
                                alert(`${meta.label}\n\n${meta.description}`);
                              }}
                              aria-label={`Information om ${meta.label}`}
                            >
                              <InfoOutlinedIcon style={{ fontSize: "14px" }} />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleFormList.map((f, idx) => {
                    const selected = selectedIds.has(f.id);
                    const isPendingDelete =
                      f.__pending === "delete" ||
                      tablePendingDeletes?.has?.(f.id);
                    const hasPendingEdits = !!tablePendingEdits?.[f.id];
                    const hasGeomChange = !!tablePendingEdits?.[f.id]?.__geom__;
                    const isDraftAdd =
                      f.__pending === "add" ||
                      tablePendingAdds?.some?.(
                        (d) => d.id === f.id && d.__pending !== "delete"
                      );

                    const bgColor = isPendingDelete
                      ? "#ffe0e0"
                      : hasGeomChange
                        ? "#fff4e0"
                        : hasPendingEdits
                          ? "#fff8dc"
                          : isDraftAdd
                            ? "#e0f7fa"
                            : selected
                              ? "#e3f2fd"
                              : "#fff";

                    // Use stable composite key: drafts get prefix to avoid collision
                    const stableKey = f.id < 0 ? `draft_${f.id}` : f.id;

                    return (
                      <tr
                        key={stableKey}
                        data-row-id={f.id}
                        onClick={(e) => onFormRowClick(f.id, idx, e)}
                        style={{
                          backgroundColor: bgColor,
                          cursor: "pointer",
                        }}
                      >
                        {FIELD_META.map((meta) => (
                          <td
                            key={meta.key}
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
                              fontSize: "13px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {f[meta.key] ?? ""}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {visibleFormList.length === 0 && (
                    <tr>
                      <td
                        colSpan={FIELD_META.length}
                        style={{
                          padding: "20px",
                          textAlign: "center",
                          color: "#999",
                        }}
                      >
                        Inga objekt i listan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={s.listFooter}>
              <button
                style={
                  visibleFormList.length === 0 ? s.iconBtnDisabled : s.iconBtn
                }
                disabled={visibleFormList.length === 0}
                onClick={() => exportToExcel(visibleFormList)}
                title={
                  visibleFormList.length
                    ? `Exportera till Excel (${visibleFormList.length} rader)`
                    : "Inga rader att exportera"
                }
                aria-label="Exportera till Excel"
              >
                <DescriptionIcon fontSize="small" />
              </button>

              <button
                style={selectedIds.size === 0 ? s.iconBtnDisabled : s.iconBtn}
                disabled={selectedIds.size === 0}
                onClick={() => {
                  const ids = Array.from(selectedIds);
                  if (ids.length > 0) {
                    editBus.emit("attrib:zoom-to-features", { ids });
                  }
                }}
                title={
                  selectedIds.size
                    ? `Zooma till ${selectedIds.size} objekt i kartan`
                    : "Markera rader först"
                }
                aria-label="Zooma till valda"
              >
                <CenterFocusStrongIcon fontSize="small" />
              </button>

              <button
                style={selectedIds.size === 0 ? s.iconBtnDisabled : s.iconBtn}
                disabled={selectedIds.size === 0}
                onClick={() => {
                  const ids = Array.from(selectedIds);
                  if (ids.length > 0) {
                    const firstId = ids[0];
                    const el = document.querySelector(
                      `[data-row-id="${firstId}"]`
                    );
                    if (el) {
                      el.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                  }
                }}
                title={
                  selectedIds.size
                    ? "Skrolla till markerad rad"
                    : "Markera rader först"
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
                onClick={handleDuplicateClick}
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
                    undoLatestTableChange();
                    return;
                  }
                  if (formUndoStack?.length) {
                    undoLatestFormChange();
                    return;
                  }
                  if (hasGeomUndo) {
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
                style={
                  !(dirty || tableHasPending) ? s.iconBtnDisabled : s.iconBtn
                }
                onClick={() => setSaveDialogOpen(true)}
                disabled={!(dirty || tableHasPending)}
                aria-label="Spara"
                title="Spara"
              >
                <SaveIcon fontSize="small" />
              </button>
            </div>
          </>
        ) : (
          <>
            {!focusedFeature ? (
              <div style={s.formEmpty}>
                Markera ett objekt i listan för att börja redigera.
              </div>
            ) : (
              <>
                {selectedIds.size > 1 && (
                  <div style={s.bulkEditWarning}>
                    <svg
                      style={s.bulkEditWarningIcon}
                      width="16"
                      height="16"
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
                <div style={s.form}>
                  {FIELD_META.map((meta) => {
                    const changed = changedFields.has(meta.key);
                    const val = editValues?.[meta.key];
                    const forceTextarea = meta.type === "textarea";
                    const multiline =
                      forceTextarea || autoIsMultiline(val, meta);

                    return (
                      <div key={meta.key} style={s.field}>
                        <label style={s.label}>
                          {meta.label}
                          {meta.description && meta.description.trim() && (
                            <button
                              style={s.descriptionIcon}
                              title={meta.description}
                              onClick={(e) => {
                                e.stopPropagation();
                                alert(`${meta.label}\n\n${meta.description}`);
                              }}
                              aria-label={`Information om ${meta.label}`}
                            >
                              <InfoOutlinedIcon style={{ fontSize: "16px" }} />
                            </button>
                          )}
                          {changed && (
                            <span style={s.labelChanged}>(ändrad)</span>
                          )}
                        </label>
                        {renderInput(
                          meta,
                          meta.readOnly && isMissingValue(val)
                            ? "#saknas"
                            : val,
                          (v) => handleFieldChange(meta.key, v),
                          changed,
                          s,
                          {
                            enterCommits: false,
                            multiline,
                            fieldKey: meta.key,
                          }
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={s.mobileFormActions}>
                  <div style={s.spacer} />
                  <button
                    style={canUndo ? s.iconBtn : s.iconBtnDisabled}
                    disabled={!canUndo}
                    onClick={() => {
                      if (formUndoStack?.length) {
                        undoLatestFormChange();
                        return;
                      }
                      if (tableUndoStack?.length) {
                        undoLatestTableChange();
                        return;
                      }
                      if (hasGeomUndo) {
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
                    style={
                      !(dirty || tableHasPending)
                        ? s.iconBtnDisabled
                        : s.iconBtn
                    }
                    onClick={() => setSaveDialogOpen(true)}
                    disabled={!(dirty || tableHasPending)}
                    aria-label="Spara"
                    title="Spara"
                  >
                    <SaveIcon fontSize="small" />
                  </button>
                </div>

                <div
                  style={
                    dirty || tableHasPending ? s.formFooterDirty : s.formFooter
                  }
                >
                  {dirty
                    ? `Osparade ändringar (${changedFields.size} fält)`
                    : tableHasPending
                      ? "Ändringar buffrade (ej sparade)"
                      : "Allt sparat"}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <ConfirmSaveDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onConfirm={confirmSave}
        summary={summary}
        saving={savingNow}
      />
    </>
  );
}

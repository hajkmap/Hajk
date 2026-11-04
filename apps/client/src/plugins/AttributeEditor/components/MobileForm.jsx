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
import DescriptionIcon from "@mui/icons-material/Description";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import CircularProgress from "@mui/material/CircularProgress";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ConfirmSaveDialog from "./ConfirmSaveDialog";
import {
  getIdsForDeletion,
  isMissingValue,
  autoIsMultiline,
  renderTableCellDisplay,
} from "../helpers/helpers";
import { editBus } from "../../../buses/editBus";
import i18n from "src/i18n";

export default function MobileForm({
  s,
  mobileActiveTab,
  setMobileActiveTab,

  // list
  visibleFormList,
  selectedIds,
  onFormRowClick,
  focusedId,

  // form
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
  summary,
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
  splitMultiFeature,
  canSplitMultiFeature,
  mergeFeatures,
  canMergeFeatures,
  hasGeomUndo,
  columnFilters,
  setColumnFilters,
  exportToExcel,
  addFeatureFromGps,
  gpsLoading,
  supportsPointGeometry,
  isLoading,
  onDiscard,
}) {
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [savingNow, setSavingNow] = React.useState(false);

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
    <>
      <div style={s.mobileTabBar}>
        <button
          style={s.mobileTab(mobileActiveTab === "list")}
          onClick={() => setMobileActiveTab("list")}
        >
          {i18n.t("attributeEditor.form.featuresTab", {
            number: visibleFormList.length,
          })}
        </button>
        <button
          style={s.mobileTab(mobileActiveTab === "form")}
          onClick={() => setMobileActiveTab("form")}
        >
          {focusedId
            ? i18n.t("attributeEditor.form.editTabWithId", { id: focusedId })
            : i18n.t("attributeEditor.form.editTab")}
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
            <span style={s.spacer}>
              {i18n.t("attributeEditor.form.columnFiltersActiveShort", {
                number: activeFilterCount,
              })}
            </span>
            <button style={s.btnSmall} onClick={clearColumnFilters}>
              {i18n.t("common.clear")}
            </button>
          </div>
        )}
        {mobileActiveTab === "list" ? (
          <>
            <div style={s.mobileTableScroll}>
              <table style={s.mobileTable}>
                <thead>
                  <tr>
                    {FIELD_META.map((meta) => (
                      <th key={meta.key} style={s.mobileTableTh}>
                        <div style={s.mobileTableThContent}>
                          <span>{meta.label}</span>
                          {meta.description && meta.description.trim() && (
                            <button
                              style={s.descriptionIcon}
                              title={meta.description}
                              onClick={(e) => {
                                e.stopPropagation();
                                alert(`${meta.label}\n\n${meta.description}`);
                              }}
                              aria-label={i18n.t("attributeEditor.fieldInfo", {
                                field: meta.label,
                              })}
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

                    const status = isPendingDelete
                      ? "delete"
                      : hasGeomChange
                        ? "geom"
                        : hasPendingEdits
                          ? "edit"
                          : isDraftAdd
                            ? "add"
                            : null;

                    // Use stable composite key: drafts get prefix to avoid collision
                    const stableKey = f.id < 0 ? `draft_${f.id}` : f.id;

                    return (
                      <tr
                        key={stableKey}
                        data-row-id={f.id}
                        onClick={(e) => onFormRowClick(f.id, idx, e)}
                        style={s.mobileTableTrBg(status, selected)}
                      >
                        {FIELD_META.map((meta) => (
                          <td key={meta.key} style={s.mobileTableTd}>
                            <div style={s.mobileTableTdInner}>
                              {renderTableCellDisplay({
                                meta,
                                value: f[meta.key],
                                s,
                                selected: true,
                              })}
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {visibleFormList.length === 0 && (
                    <tr>
                      <td
                        colSpan={FIELD_META.length}
                        style={s.mobileTableTdEmpty}
                      >
                        {isLoading ? (
                          <span style={s.inlineFlexCenter}>
                            {i18n.t("attributeEditor.loading")}
                            <CircularProgress size={16} />
                          </span>
                        ) : (
                          i18n.t("attributeEditor.noFeatures")
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={s.listFooter}>
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
                  visibleFormList.length === 0 ? s.iconBtnDisabled : s.iconBtn
                }
                disabled={visibleFormList.length === 0}
                onClick={() => exportToExcel(visibleFormList)}
                title={
                  visibleFormList.length
                    ? i18n.t("attributeEditor.actions.exportExcelRows", {
                        count: visibleFormList.length,
                      })
                    : i18n.t("attributeEditor.actions.noRowsToExport")
                }
                aria-label={i18n.t("attributeEditor.actions.exportExcel")}
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
                    ? i18n.t("attributeEditor.actions.zoomToCount", {
                        count: selectedIds.size,
                      })
                    : i18n.t("attributeEditor.actions.selectRowsFirst")
                }
                aria-label={i18n.t("attributeEditor.actions.zoomToSelected")}
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
                    ? i18n.t("attributeEditor.actions.showSelectedRow")
                    : i18n.t("attributeEditor.actions.selectRowsFirst")
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
                onClick={handleDuplicateClick}
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
                onClick={
                  canSplitMultiFeature ? splitMultiFeature : mergeFeatures
                }
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
                aria-label={i18n.t("common.undo")}
                title={i18n.t("common.undo")}
              >
                <UndoIcon fontSize="small" />
              </button>

              <button
                style={
                  !(dirty || tableHasPending) ? s.iconBtnDisabled : s.iconBtn
                }
                onClick={() => setSaveDialogOpen(true)}
                disabled={!(dirty || tableHasPending)}
                aria-label={i18n.t("common.save")}
                title={i18n.t("common.save")}
              >
                <SaveIcon fontSize="small" />
              </button>
            </div>
          </>
        ) : (
          <>
            {!focusedFeature ? (
              <div style={s.formEmpty}>
                {i18n.t("attributeEditor.form.selectToEdit")}
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
                      {i18n.t("attributeEditor.form.bulkEditWarning", {
                        count: selectedIds.size,
                      })}
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
                    aria-label={i18n.t("common.undo")}
                    title={i18n.t("common.undo")}
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
                    aria-label={i18n.t("common.save")}
                    title={i18n.t("common.save")}
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
                    ? i18n.t("attributeEditor.form.unsavedFields", {
                        count: changedFields.size,
                      })
                    : tableHasPending
                      ? i18n.t("attributeEditor.form.buffered")
                      : i18n.t("attributeEditor.form.allSaved")}
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
        onDiscard={onDiscard}
        summary={summary}
        saving={savingNow}
      />
    </>
  );
}

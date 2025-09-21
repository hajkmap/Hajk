import React from "react";
import UndoIcon from "@mui/icons-material/Undo";
import SaveIcon from "@mui/icons-material/Save";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ConfirmSaveDialog from "./ConfirmSaveDialog";
import { getIdsForDeletion } from "../helpers/helpers";

export default function MobileForm({
  s,
  isMobile,
  mode,
  mobileActiveTab,
  setMobileActiveTab,

  // list
  visibleFormList,
  selectedIds,
  onFormRowClick,
  focusedId,
  focusPrev,
  focusNext,

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
}) {
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [savingNow, setSavingNow] = React.useState(false);

  const isActive = isMobile && mode === "form";

  // Helpers
  function autoIsMultiline(val, meta) {
    const sVal = String(val ?? "");
    if (!sVal) return false;
    if (sVal.includes("\n")) return true;
    const limit = meta.wrapCh ?? 60;
    if (sVal.length >= limit) return true;
    const hasLongToken = sVal
      .split(/\s+/)
      .some((tok) => tok.length >= Math.max(30, Math.floor(limit * 0.6)));
    return hasLongToken;
  }

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
        if (parts.length >= 3) break;
      }
    }
    return parts.join(" • ");
  }

  const handleDeleteClick = () => {
    const ids = getIdsForDeletion(selectedIds, focusedId);
    if (!ids.length) return;
    setDeleteState(ids, "mark");
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

  if (!isActive) return null;

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
        {mobileActiveTab === "list" ? (
          <>
            <div style={s.list}>
              {visibleFormList.map((f, idx) => {
                const selected = selectedIds.has(f.id);
                const isFocused = focusedId === f.id;
                const isPendingDelete = tablePendingDeletes?.has?.(f.id);
                const hasPendingEdits = !!tablePendingEdits?.[f.id];
                const isDraftAdd = tablePendingAdds?.some?.(
                  (d) => d.id === f.id && d.__pending !== "delete"
                );
                const status = isPendingDelete
                  ? "delete"
                  : hasPendingEdits
                    ? "edit"
                    : isDraftAdd
                      ? "add"
                      : null;

                return (
                  <div
                    key={f.id}
                    data-row-id={f.id}
                    style={s.listRow(selected, status, isFocused, false)}
                    onClick={(e) => onFormRowClick(f.id, idx, e)}
                  >
                    <div>
                      <div style={s.listRowText}>
                        <div style={s.listRowTitle}>
                          {makeRowPreview(f, FIELD_META)}
                          {hasPendingEdits && (
                            <span style={s.labelChanged}>&nbsp;• ändrad</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {visibleFormList.length === 0 && (
                <div style={s.listEmpty}>Inga objekt i listan.</div>
              )}
            </div>

            <div style={s.listFooter}>
              <button style={s.btn} onClick={focusPrev}>
                &larr; Föreg.
              </button>
              <button style={s.btn} onClick={focusNext}>
                Nästa &rarr;
              </button>
              <div style={s.spacer} />
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
                style={
                  !(tableUndoStack?.length || formUndoStack?.length || dirty)
                    ? s.iconBtnDisabled
                    : s.iconBtn
                }
                onClick={() => {
                  if (tableUndoStack?.length) undoLatestTableChange();
                  else if (formUndoStack?.length) undoLatestFormChange();
                  else if (dirty) resetEdits();
                }}
                disabled={
                  !(tableUndoStack?.length || formUndoStack?.length || dirty)
                }
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
                          {changed && (
                            <span style={s.labelChanged}>(ändrad)</span>
                          )}
                        </label>
                        {renderInput(
                          meta,
                          val,
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
                    style={
                      !(
                        tableUndoStack?.length ||
                        formUndoStack?.length ||
                        dirty
                      )
                        ? s.iconBtnDisabled
                        : s.iconBtn
                    }
                    onClick={() => {
                      if (formUndoStack?.length) undoLatestFormChange();
                      else if (tableUndoStack?.length) undoLatestTableChange();
                      else if (dirty) resetEdits();
                    }}
                    disabled={
                      !(
                        tableUndoStack?.length ||
                        formUndoStack?.length ||
                        dirty
                      )
                    }
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
        summary={{
          adds: tablePendingAdds?.length ?? 0,
          edits:
            (tablePendingEdits ? Object.keys(tablePendingEdits).length : 0) +
            (dirty ? changedFields.size : 0),
          deletes: tablePendingDeletes?.size ?? 0,
        }}
        saving={savingNow}
      />
    </>
  );
}

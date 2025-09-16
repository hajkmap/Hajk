import React from "react";
import UndoIcon from "@mui/icons-material/Undo";
import SaveIcon from "@mui/icons-material/Save";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { getIdsForDeletion } from "../helpers/helpers";

export default function MobileForm({
  s,
  isMobile,
  mode,
  mobileActiveTab,
  setMobileActiveTab,
  visibleFormList,
  selectedIds,
  focusedId,
  lastEditTargetIdsRef,
  onFormRowClick,
  focusPrev,
  focusNext,
  focusedFeature,
  FIELD_META,
  changedFields,
  editValues,
  handleFieldChange,
  renderInput,
  dirty,
  resetEdits,
  saveChanges,
  tablePendingDeletes,
  setDeleteState,
  tableHasPending,
  commitTableEdits,
  tableUndoStack,
  undoLatestTableChange,
  formUndoStack,
  undoLatestFormChange,
  theme,
  tablePendingEdits,
  tablePendingAdds,
}) {
  if (!isMobile || mode !== "form") return null;

  function autoIsMultiline(val, meta) {
    const s = String(val ?? "");
    if (!s) return false;
    if (s.includes("\n")) return true; // has line breaks
    const limit = meta.wrapCh ?? 60; // long text, e.g. long URL
    if (s.length >= limit) return true;
    const longToken = s
      .split(/\s+/)
      .some((tok) => tok.length >= Math.max(30, Math.floor(limit * 0.6))); // long URL, etc.
    return longToken;
  }

  const handleDeleteClick = () => {
    const ids = getIdsForDeletion(selectedIds, focusedId);
    if (!ids.length) return;
    setDeleteState(ids, "mark");
  };

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
                    style={s.listRow(selected || isFocused, status, false)}
                    onClick={(e) => onFormRowClick(f.id, idx, e)}
                  >
                    <div>
                      <div style={s.listRowText}>
                        <div style={s.listRowTitle}>
                          {f.ar_typ} — {f.ar_andamal}
                          {hasPendingEdits && (
                            <span style={s.labelChanged}>&nbsp;• ändrad</span>
                          )}
                        </div>
                        <div style={s.listRowSubtitle}>
                          geoid {f.geoid} • {f.ar_forman} • {f.ar_last}
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
                  !(tableUndoStack?.length || formUndoStack?.length)
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
                style={!tableHasPending ? s.iconBtnDisabled : s.iconBtn}
                onClick={commitTableEdits}
                disabled={!tableHasPending}
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

                    // Backend determines the first value
                    const forceTextarea = meta.type === "textarea";
                    // Automatic heuristic (long texts / line breaks)
                    const isMultiline =
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
                            multiline: isMultiline,
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
                    onClick={() => {
                      if (dirty) {
                        saveChanges({
                          toPending: true,
                          targetIds: lastEditTargetIdsRef.current || undefined,
                        });
                      }
                      if (tableHasPending) {
                        commitTableEdits();
                      }
                    }}
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
    </>
  );
}

import React from "react";
import UndoIcon from "@mui/icons-material/Undo";
import SaveIcon from "@mui/icons-material/Save";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { getIdsForDeletion } from "../helpers/helpers";

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
}) {
  const handleDeleteClick = () => {
    const ids = getIdsForDeletion(selectedIds, focusedId);
    if (!ids.length) return;
    setDeleteState(ids, "mark");
  };

  return (
    <div style={s.paneWrap}>
      {/* Left: Object list */}
      <div style={s.pane} aria-label="Objektlista">
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
            &larr; Föregående
          </button>
          <button style={s.btn} onClick={focusNext}>
            Nästa &rarr;
          </button>
          <div style={s.spacer} />
          <span style={s.listFooterInfo}>Fokus: {focusedId ?? "—"}</span>
        </div>
      </div>

      {/* Right: Form */}
      <div style={s.pane} aria-label="Formulär">
        <div style={s.paneHeaderWithActions}>
          <span>Redigera attribut</span>
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
              !(tableUndoStack?.length || formUndoStack?.length || dirty)
                ? s.iconBtnDisabled
                : s.iconBtn
            }
            onClick={() => {
              if (formUndoStack?.length) undoLatestFormChange();
              else if (tableUndoStack?.length) undoLatestTableChange();
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
            style={!(dirty || tableHasPending) ? s.iconBtnDisabled : s.iconBtn}
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

        {!focusedFeature ? (
          <div style={s.formEmpty}>
            Markera ett objekt i listan till vänster för att börja redigera.
          </div>
        ) : (
          <>
            <div style={s.form}>
              {FIELD_META.map((meta) => (
                <div key={meta.key} style={s.field}>
                  <label style={s.label}>
                    {meta.label}
                    {changedFields.has(meta.key) && (
                      <span style={s.labelChanged}>(ändrad)</span>
                    )}
                  </label>
                  {renderInput(
                    meta,
                    editValues[meta.key],
                    (v) => handleFieldChange(meta.key, v),
                    changedFields.has(meta.key),
                    s
                  )}
                </div>
              ))}
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
      </div>
    </div>
  );
}

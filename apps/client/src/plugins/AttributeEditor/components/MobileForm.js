import React from "react";
import UndoIcon from "@mui/icons-material/Undo";
import SaveIcon from "@mui/icons-material/Save";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export default function MobileForm({
  s,
  isMobile,
  mode,
  mobileActiveTab,
  setMobileActiveTab,
  visibleFormList,
  selectedIds,
  focusedId,
  handleBeforeChangeFocus,
  toggleSelect,
  focusPrev,
  focusNext,
  focusedFeature,
  FIELD_META,
  changedFields,
  editValues,
  handleFieldChange,
  renderInput,
  applyToSelection,
  setApplyToSelection,
  dirty,
  resetEdits,
  saveChanges,
  tablePendingDeletes,
  onDeleteSelected,
  tableHasPending,
  commitTableEdits,
  tableUndoStack,
  undoLatestTableChange,
  formUndoStack,
  undoLatestFormChange,
}) {
  if (!isMobile || mode !== "form") return null;

  const handleDeleteClick = () => {
    const idsToDelete =
      selectedIds.size > 0
        ? Array.from(selectedIds)
        : focusedId
          ? [focusedId]
          : [];

    if (idsToDelete.length > 0) {
      onDeleteSelected(idsToDelete);
    }
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
              {visibleFormList.map((f) => {
                const selected = selectedIds.has(f.id);
                const isFocused = focusedId === f.id;
                const isPendingDelete = tablePendingDeletes?.has(f.id);

                return (
                  <div
                    key={f.id}
                    data-row-id={f.id}
                    style={s.listRow(
                      selected || isFocused,
                      isPendingDelete ? "delete" : null
                    )}
                    onClick={() => handleBeforeChangeFocus(f.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelect(f.id);
                      }}
                    />
                    <div>
                      <div style={s.listRowText}>
                        <div style={s.listRowTitle}>
                          {f.ar_typ} — {f.ar_andamal}
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
                }}
                disabled={!(tableUndoStack?.length || formUndoStack?.length)}
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
                <div style={s.mobileFormActions}>
                  <label style={s.checkbox}>
                    <input
                      type="checkbox"
                      checked={applyToSelection}
                      onChange={(e) => setApplyToSelection(e.target.checked)}
                    />
                    Spara för alla markerade
                  </label>
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
                      if (dirty) saveChanges();
                      if (tableHasPending) commitTableEdits();
                    }}
                    disabled={!(dirty || tableHasPending)}
                    aria-label="Spara"
                    title="Spara"
                  >
                    <SaveIcon fontSize="small" />
                  </button>
                </div>
                <div style={dirty ? s.formFooterDirty : s.formFooter}>
                  {dirty
                    ? `Osparade ändringar (${changedFields.size} fält)`
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

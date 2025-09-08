import React from "react";
import UndoIcon from "@mui/icons-material/Undo";
import SaveIcon from "@mui/icons-material/Save";

export default function DesktopForm({
  s,
  // left list
  visibleFormList,
  selectedIds,
  toggleSelect,
  focusedId,
  handleBeforeChangeFocus,
  focusPrev,
  focusNext,

  // right form
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
}) {
  return (
    <div style={s.paneWrap}>
      {/* Left: Object list */}
      <div style={s.pane} aria-label="Objektlista">
        <div style={s.list}>
          {visibleFormList.map((f) => {
            const selected = selectedIds.has(f.id);
            const isFocused = focusedId === f.id;
            return (
              <div
                key={f.id}
                data-row-id={f.id}
                style={s.listRow(selected || isFocused)}
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
          <label style={s.checkbox}>
            <input
              type="checkbox"
              checked={applyToSelection}
              onChange={(e) => setApplyToSelection(e.target.checked)}
            />
            Spara ändrade fält för alla markerade
          </label>
          <button
            style={!dirty ? s.iconBtnDisabled : s.iconBtn}
            onClick={resetEdits}
            disabled={!dirty}
            aria-label="Ångra"
            title="Ångra"
          >
            <UndoIcon fontSize="small" />
          </button>
          <button
            style={!dirty ? s.iconBtnDisabled : s.iconBtn}
            onClick={() => saveChanges()}
            disabled={!dirty}
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
            <div style={dirty ? s.formFooterDirty : s.formFooter}>
              {dirty
                ? `Osparade ändringar (${changedFields.size} fält ändrade)`
                : "Allt sparat"}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

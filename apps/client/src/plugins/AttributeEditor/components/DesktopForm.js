import React from "react";
import UndoIcon from "@mui/icons-material/Undo";
import SaveIcon from "@mui/icons-material/Save";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { getIdsForDeletion, isMissingValue } from "../helpers/helpers";
import ConfirmSaveDialog from "./ConfirmSaveDialog";
import { editBus } from "../../../buses/editBus";

export default function DesktopForm({
  s,
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
  hasGeomUndo,
}) {
  const RESIZER_KEY = "ae_df_leftw";
  const MIN_LEFT = 220; // px
  const MAX_LEFT = 800; // px

  const [leftW, setLeftW] = React.useState(() => {
    const saved = Number(localStorage.getItem(RESIZER_KEY));
    return Number.isFinite(saved) && saved >= MIN_LEFT ? saved : 360; // default
  });

  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [savingNow, setSavingNow] = React.useState(false);

  const textareaRefs = React.useRef({});
  const [pendingCaret, setPendingCaret] = React.useState(null);
  const saveLeftWTimer = React.useRef(null);

  const registerTextareaRef = React.useCallback((key, el) => {
    if (el) textareaRefs.current[key] = el;
  }, []);

  const requestFocusCaret = React.useCallback((key, pos) => {
    setPendingCaret({ key, pos });
  }, []);

  const prevMultilineRef = React.useRef({});

  const resizeRef = React.useRef(null); // { startX, startW }
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

  const makeRowPreview = (row, FIELD_META) => {
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
  };

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

  function autoIsMultiline(val, meta) {
    const s = String(val ?? "");
    if (!s) return false;
    if (s.includes("\n")) return true; // line break
    const limit = meta.wrapCh ?? 100; // long text
    if (s.length >= limit) return true;
    const longToken = s
      .split(/\s+/)
      .some((tok) => tok.length >= Math.max(30, Math.floor(limit * 0.6)));
    return longToken; // e.g. long URL
  }

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
      adds: tablePendingAdds?.length ?? 0,
      edits:
        (tablePendingEdits ? Object.keys(tablePendingEdits).length : 0) +
        (dirty ? changedFields.size : 0),
      deletes: tablePendingDeletes?.size ?? 0,
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
          {visibleFormList.map((f, idx) => {
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

            const status = isPendingDelete
              ? "delete"
              : hasGeomChange
                ? "geom"
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
          <span style={s.listFooterInfo}>Fokus: {focusedId ?? "—"}</span>
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
        <div style={s.paneHeaderWithActions}>
          <span>Redigera attribut</span>
          {selectedIds.size > 1 && (
            <span style={s.bulkWarning}>
              OBS! Nu redigerar du {selectedIds.size} objekt samtidigt
            </span>
          )}
          <div style={s.spacer} />

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
              !(
                tableUndoStack?.length ||
                formUndoStack?.length ||
                dirty ||
                hasGeomUndo
              )
                ? s.iconBtnDisabled
                : s.iconBtn
            }
            onClick={() => {
              if (tableUndoStack?.length) {
                undoLatestTableChange();
                return;
              }
              if (formUndoStack?.length) {
                undoLatestFormChange();
                return;
              }
              if (dirty) {
                resetEdits();
              }
              if (hasGeomUndo) {
                undoLatestTableChange();
              }
            }}
            disabled={
              !(
                tableUndoStack?.length ||
                formUndoStack?.length ||
                dirty ||
                hasGeomUndo
              )
            }
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
                &larr; Föregående
              </button>
              <button style={s.btn} onClick={focusNext}>
                Nästa &rarr;
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
          </>
        )}
      </div>
    </div>
  );
}

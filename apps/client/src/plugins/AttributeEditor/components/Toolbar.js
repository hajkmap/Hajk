import React from "react";
import TableRowsIcon from "@mui/icons-material/TableRows";
import DynamicFormIcon from "@mui/icons-material/DynamicForm";
import { editBus } from "../../../buses/editBus";
import { OGC_SOURCES, PLUGIN_COLORS } from "../constants/index";
import ConfirmSaveDialog from "./ConfirmSaveDialog";

export default function Toolbar({
  s,
  isMobile,
  mode,
  setMode,
  dark,
  setDark,
  tableSearch,
  setTableSearch,
  formSearch,
  setFormSearch,
  features,
  filteredAndSorted,
  tableSelectedIds,
  selectedIds,
  selectAllVisible,
  clearSelection,
  setPluginSettings,
  dirty,
  saveChanges,
  lastEditTargetIdsRef,
  commitTableEdits,
  tablePendingAdds,
  tablePendingEdits,
  tablePendingDeletes,
  changedFields,
}) {
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [savingNow, setSavingNow] = React.useState(false);
  const pendingTargetRef = React.useRef(null);

  const [serviceId, setServiceId] = React.useState(
    OGC_SOURCES[0]?.id ?? "none"
  );

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

  const applyServiceSwitch = React.useCallback(
    (def, label) => {
      setPluginSettings(
        label === "Ingen"
          ? { title: "Attributredigerare", color: PLUGIN_COLORS.default }
          : { title: `Redigerar ${label}`, color: PLUGIN_COLORS.warning }
      );
      if (label === "Ingen") {
        editBus.emit("edit:service-cleared", { source: "toolbar" });
        setServiceId("NONE_ID");
      } else {
        editBus.emit("edit:service-selected", {
          source: "toolbar",
          id: def?.id ?? "",
          layerId: def?.layerId ?? "",
          title: `Redigerar ${label}`,
          color: PLUGIN_COLORS.warning,
        });
        setServiceId(def?.id ?? "none");
      }
    },
    [setPluginSettings]
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
      pendingTargetRef.current = null;
    }
  }

  function handleOgcSourceChange(e) {
    const nextId = e.target.value;
    const def = OGC_SOURCES.find((o) => o.id === nextId);
    const label = def?.label ?? "Ingen";

    const pendingCount =
      (tablePendingAdds?.length ?? 0) +
      (tablePendingDeletes?.size ?? 0) +
      (tablePendingEdits ? Object.keys(tablePendingEdits).length : 0);

    const needsPrompt = dirty || pendingCount > 0;

    if (!needsPrompt) {
      applyServiceSwitch(def, label);
      return;
    }

    pendingTargetRef.current = { def, label };
    setSaveDialogOpen(true);
  }

  React.useEffect(() => {
    const offSel = editBus.on("edit:service-selected", (ev) => {
      const { title, source } = ev.detail || {};
      if (source === "toolbar") return;
      const raw =
        typeof title === "string" && title.startsWith("Redigerar ")
          ? title.replace(/^Redigerar\s+/, "")
          : title;
      if (!raw) return;
      const found = OGC_SOURCES.find((o) => o.label === raw);
      if (found) setServiceId(found.id);
    });

    const offClr = editBus.on("edit:service-cleared", (ev) => {
      const { source } = ev.detail || {};
      if (source === "toolbar") return;
      setServiceId("NONE_ID");
    });

    return () => {
      offSel();
      offClr();
    };
  }, []);

  React.useEffect(() => {
    const off = editBus.on("edit:service-switch-requested", (ev) => {
      // open ConfirmSaveDialog, save (emit "edit:saving-started"/"finished"),
      // and after successful save: emit "edit:service-selected"/"cleared"
      // (precisely set up earlier with pendingTargetRef)
      setSaveDialogOpen(true);
    });
    return () => off();
  }, []);

  return (
    <div style={s.toolbar}>
      <strong style={s.toolbarTitle}>Attributredigerare</strong>
      {!isMobile && <div style={s.toolbarSpacer} />}

      <button
        type="button"
        onClick={() => setMode("table")}
        style={s.toggle(mode === "table")}
        aria-pressed={mode === "table"}
        title="Tabelläge"
      >
        <TableRowsIcon fontSize="small" />
      </button>

      <button
        type="button"
        onClick={() => setMode("form")}
        style={s.toggle(mode === "form")}
        aria-pressed={mode === "form"}
        title="Formulärläge"
      >
        <DynamicFormIcon fontSize="small" />
      </button>

      <select
        value={serviceId}
        onChange={handleOgcSourceChange}
        style={s.inputComb}
        aria-label="Välj redigeringstjänst"
        title="Välj redigeringstjänst"
      >
        {OGC_SOURCES.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>

      <div style={s.spacer} />

      <button
        type="button"
        onClick={() => setDark(!dark)}
        style={s.toggle(dark)}
        aria-pressed={dark}
        title="Växla dark mode"
      >
        {dark ? "Dark" : "Light"}
      </button>

      {mode === "table" ? (
        <div style={s.toolbarInfo}>
          <input
            style={s.inputComb}
            placeholder="Filtrera listan…"
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
          />
          {!isMobile && (
            <span style={s.toolbarStats}>
              Totalt: {features.length} • Visas: {filteredAndSorted.length} •
              Valda: {tableSelectedIds.size}
            </span>
          )}
        </div>
      ) : (
        <div style={s.toolbarInfo}>
          <input
            style={s.inputComb}
            placeholder="Filtrera listan…"
            value={formSearch}
            onChange={(e) => setFormSearch(e.target.value)}
          />
          {!isMobile && (
            <>
              <button style={s.btn} onClick={selectAllVisible}>
                Markera alla
              </button>
              <button
                style={selectedIds.size === 0 ? s.btnDisabled : s.btn}
                onClick={clearSelection}
                disabled={selectedIds.size === 0}
              >
                Avmarkera
              </button>
              <span style={s.toolbarStats}>
                Valda: {selectedIds.size} / {features.length}
              </span>
            </>
          )}
        </div>
      )}
      <ConfirmSaveDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onConfirm={confirmSave}
        summary={summary}
        saving={savingNow}
      />
    </div>
  );
}

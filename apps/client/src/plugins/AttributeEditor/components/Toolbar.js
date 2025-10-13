import React from "react";
import TableRowsIcon from "@mui/icons-material/TableRows";
import DynamicFormIcon from "@mui/icons-material/DynamicForm";
import { editBus } from "../../../buses/editBus";
import { PLUGIN_COLORS } from "../constants/index";
import ConfirmSaveDialog from "./ConfirmSaveDialog";

export default function Toolbar({
  s,
  isMobile,
  mode,
  setMode,
  dark,
  setDark,
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
  serviceList, // [{ id, title }]
  showOnlySelected,
  setShowOnlySelected,
  frozenSelectedIds,
  setFrozenSelectedIds,
  searchText,
  setSearchText,
}) {
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [savingNow, setSavingNow] = React.useState(false);
  const pendingTargetRef = React.useRef(null);
  const [serviceId, setServiceId] = React.useState("NONE_ID");
  const selectedCount =
    mode === "table" ? tableSelectedIds.size : selectedIds.size;

  // Build options: "None" + in command serviceList
  const services = React.useMemo(() => {
    const base = [{ id: "NONE_ID", label: "Ingen" }];
    const fromProps = (serviceList || []).map((s) => ({
      id: s.id,
      label: s.title || s.id, // caption in dropdown
      layers: s.layers,
      projection: s.projection,
    }));
    return base.concat(fromProps);
  }, [serviceList]);

  // Summarization for confirm dialog
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

  // Set plugin title and color and emit value/clear
  const applyServiceSwitch = React.useCallback(
    (def, label) => {
      setPluginSettings(
        label === "Ingen"
          ? { title: "Attributredigerare", color: PLUGIN_COLORS.default }
          : { title: `Redigerar ${label}`, color: PLUGIN_COLORS.warning }
      );

      if (!def || def.id === "NONE_ID") {
        editBus.emit("edit:service-cleared", { source: "toolbar" });
        setServiceId("NONE_ID");
      } else {
        editBus.emit("edit:service-selected", {
          source: "toolbar",
          id: def.id,
          title: `Redigerar ${label}`,
          color: PLUGIN_COLORS.warning,
        });
        setServiceId(def.id);
      }
    },
    [setPluginSettings]
  );

  async function confirmSave() {
    try {
      setSavingNow(true);

      // Move edits to pending if needed
      if (dirty) {
        saveChanges({
          toPending: true,
          targetIds: lastEditTargetIdsRef.current || undefined,
        });
      }

      // Save all pending changes (table + form)
      await Promise.resolve(commitTableEdits());
    } finally {
      setSavingNow(false);
      setSaveDialogOpen(false);

      // Perform save after confirmation dialog is resolved (i.e. saved or not saved)
      if (pendingTargetRef.current) {
        const { def, label } = pendingTargetRef.current;
        pendingTargetRef.current = null;
        applyServiceSwitch(def, label);
      }
    }
  }

  function handleServiceChange(e) {
    const nextId = e.target.value;
    const def = services.find((o) => o.id === nextId);
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
      const { id, source } = ev.detail || {};
      if (source === "toolbar") return;
      if (id) setServiceId(id);
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
        onChange={handleServiceChange}
        style={s.inputComb}
        aria-label="Välj redigeringstjänst"
        title="Välj redigeringstjänst"
      >
        <option value="NONE_ID">Ingen</option>
        {serviceList.map((o) => (
          <option key={o.id} value={o.id}>
            {o.title}
          </option>
        ))}
      </select>

      <div style={s.spacer} />

      <button
        style={showOnlySelected ? s.btnActive : s.btn}
        onClick={() => {
          if (showOnlySelected) {
            // Disable the filter and reset frozen IDs
            setShowOnlySelected(false);
            setFrozenSelectedIds(new Set());
          } else {
            // Activate the filter and freeze the currently selected objects
            const currentIds =
              mode === "table" ? tableSelectedIds : selectedIds;
            setFrozenSelectedIds(new Set(currentIds));
            setShowOnlySelected(true);
          }
        }}
        disabled={!showOnlySelected && selectedCount === 0}
        title={
          showOnlySelected
            ? `Visa alla`
            : selectedCount === 0
              ? "Markera objekt först"
              : `Visa endast ${selectedCount} markerade`
        }
      >
        {showOnlySelected ? `Visa alla` : `Visa markerade (${selectedCount})`}
      </button>

      {/*<button
        type="button"
        onClick={() => setDark(!dark)}
        style={s.toggle(dark)}
        aria-pressed={dark}
        title="Växla dark mode"
      >
        {dark ? "Dark" : "Light"}
      </button>*/}

      {mode === "table" ? (
        <div style={s.toolbarInfo}>
          <input
            style={s.inputComb}
            placeholder="Filtrera listan…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
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
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
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

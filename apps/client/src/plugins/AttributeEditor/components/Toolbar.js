import React from "react";
import TableRowsIcon from "@mui/icons-material/TableRows";
import DynamicFormIcon from "@mui/icons-material/DynamicForm";
import { editBus } from "../../../buses/editBus";
import { PLUGIN_COLORS } from "../constants/index";
import ConfirmSaveDialog from "./ConfirmSaveDialog";
import ConfirmServiceSwitchWithDrawings from "../../../components/ConfirmServiceSwitchWithDrawings";

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
  setFrozenSelectedIds,
  searchText,
  setSearchText,
  map,
  enqueueSnackbar,
}) {
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [savingNow, setSavingNow] = React.useState(false);
  const pendingTargetRef = React.useRef(null);
  const [serviceId, setServiceId] = React.useState("NONE_ID");
  const selectedCount =
    mode === "table" ? tableSelectedIds.size : selectedIds.size;

  const [drawingsWarningDialog, setDrawingsWarningDialog] = React.useState({
    open: false,
    targetService: null,
    drawingCount: 0,
  });

  // Helper
  const getDrawnFeaturesCount = React.useCallback(() => {
    if (!map) return 0;

    const layers = map.getLayers().getArray?.() || [];
    const sketchLayer =
      layers.find((lyr) => lyr?.get?.("name") === "pluginSketch") || null;

    if (!sketchLayer) return 0;

    const source = sketchLayer.getSource?.();
    if (!source) return 0;

    const features = source.getFeatures?.() || [];
    const visibleFeatures = features.filter((f) => f.get("HIDDEN") !== true);

    return visibleFeatures.length;
  }, [map]);

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

  React.useEffect(() => {
    if (serviceList && serviceList.length > 0) {
      editBus.emit("edit:service-list-loaded", {
        serviceList,
      });
    }
  }, [serviceList]);

  // Summarization for confirm dialog
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

  // Set plugin title and color and emit value/clear
  const applyServiceSwitch = React.useCallback(
    (def, label) => {
      setPluginSettings(
        label === "Ingen"
          ? { title: "Attributredigerare", color: PLUGIN_COLORS.default }
          : {
              title: `Attributredigerare - Redigerar ${label}`,
              color: PLUGIN_COLORS.warning,
            }
      );

      if (!def || def.id === "NONE_ID") {
        editBus.emit("edit:service-cleared", { source: "toolbar" });
        setServiceId("NONE_ID");
      } else {
        editBus.emit("edit:service-selected", {
          source: "toolbar",
          id: def.id,
          title: `Attributredigerare - Redigerar ${label}`,
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
    try {
      const nextId = e.target.value;
      const def = services.find((o) => o.id === nextId);
      const label = def?.label ?? "Ingen";

      // Check for drawn objects if selecting service from "Ingen"
      const isSelectingService = label !== "Ingen";
      if (isSelectingService && serviceId === "NONE_ID") {
        try {
          const drawingCount = getDrawnFeaturesCount();
          if (drawingCount > 0) {
            setDrawingsWarningDialog({
              open: true,
              targetService: { def, label },
              drawingCount: drawingCount,
            });
            return;
          }
        } catch (drawErr) {
          console.warn("Kunde inte räkna ritade objekt:", drawErr);
          // Continue anyway
        }
      }

      // Check for pending changes
      const pendingCount =
        (tablePendingAdds?.filter((d) => d.__pending !== "delete").length ??
          0) +
        (tablePendingDeletes?.size ?? 0) +
        (tablePendingAdds?.filter((d) => d.__pending === "delete").length ??
          0) +
        (tablePendingEdits ? Object.keys(tablePendingEdits).length : 0);

      const needsPrompt = dirty || pendingCount > 0;

      if (!needsPrompt) {
        applyServiceSwitch(def, label);
        return;
      }

      pendingTargetRef.current = { def, label };
      setSaveDialogOpen(true);
    } catch (error) {
      console.error("Fel vid byte av redigeringsbargt lager:", error);

      if (enqueueSnackbar) {
        enqueueSnackbar(
          "Ett fel uppstod vid byte av redigeringsbart lager. Försök igen.",
          { variant: "error" }
        );
      }

      // Reset to safe state
      setServiceId("NONE_ID");
    }
  }

  const handleConfirmServiceSwitchWithDrawings = React.useCallback(() => {
    const { def, label } = drawingsWarningDialog.targetService || {};

    setDrawingsWarningDialog({
      open: false,
      targetService: null,
      drawingCount: 0,
    });

    if (def && label) {
      applyServiceSwitch(def, label);

      // Show notification
      enqueueSnackbar(
        `Redigeringsbart lager valt. ${drawingsWarningDialog.drawingCount} ritade objekt finns kvar i kartan.`,
        { variant: "info" }
      );
    }
  }, [drawingsWarningDialog, applyServiceSwitch, enqueueSnackbar]);

  const handleClearDrawingsAndSwitch = React.useCallback(() => {
    const { def, label } = drawingsWarningDialog.targetService || {};

    // Remove all drawn objects
    if (map) {
      const layers = map.getLayers().getArray?.() || [];
      const sketchLayer = layers.find(
        (lyr) => lyr?.get?.("name") === "pluginSketch"
      );
      const source = sketchLayer?.getSource?.();
      if (source) {
        source.clear();
      }
    }

    setDrawingsWarningDialog({
      open: false,
      targetService: null,
      drawingCount: 0,
    });

    if (def && label) {
      applyServiceSwitch(def, label);

      // Show notification
      enqueueSnackbar("Ritade objekt borttagna. Redigeringsbart lager valt.", {
        variant: "success",
      });
    }
  }, [drawingsWarningDialog, applyServiceSwitch, map, enqueueSnackbar]);

  React.useEffect(() => {
    const offSel = editBus.on("edit:service-selected", (ev) => {
      const { id, title, source } = ev.detail || {};
      if (source === "toolbar") return;

      if (id) {
        setServiceId(id);
      } else if (title) {
        const matchingService = services.find((s) => s.label === title);
        if (matchingService) {
          setServiceId(matchingService.id);
        }
      }
    });

    const offClr = editBus.on("edit:service-cleared", (ev) => {
      const { source } = ev.detail || {};
      if (source === "toolbar") return;
      setServiceId("NONE_ID");
    });

    // When SketchView is about to be closed and has unsaved changes
    const offSwitch = editBus.on("edit:service-switch-requested", (ev) => {
      const { targetLabel, targetId, source } = ev.detail || {};
      if (source === "toolbar") return;

      const def = services.find(
        (s) => s.id === targetId || s.label === targetLabel
      );

      pendingTargetRef.current = {
        def: def || { id: "NONE_ID" },
        label: targetLabel || "Ingen",
      };
      setSaveDialogOpen(true);
    });

    return () => {
      offSel();
      offClr();
      offSwitch();
    };
  }, [services]);

  return (
    <div style={s.toolbar}>
      {!isMobile && <div style={s.toolbarSpacer} />}

      {!isMobile && (
        <>
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
        </>
      )}

      <select
        value={serviceId}
        onChange={handleServiceChange}
        style={s.inputComb}
        aria-label="Välj redigerbart lager"
        title="Välj redigerbart lager"
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
              style={selectedCount === 0 ? s.btnDisabled : s.btn}
              onClick={clearSelection}
              disabled={selectedCount === 0}
            >
              Avmarkera alla
            </button>
            <span style={s.toolbarStats}>
              Totalt: {features.length} • Visas: {filteredAndSorted.length} •
              Valda: {selectedCount}
            </span>
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
      <ConfirmServiceSwitchWithDrawings
        open={drawingsWarningDialog.open}
        onClose={() =>
          setDrawingsWarningDialog({
            open: false,
            targetService: null,
            drawingCount: 0,
          })
        }
        onConfirm={handleConfirmServiceSwitchWithDrawings}
        onClearDrawings={handleClearDrawingsAndSwitch}
        drawingCount={drawingsWarningDialog.drawingCount}
        targetServiceName={drawingsWarningDialog.targetService?.label || ""}
      />
    </div>
  );
}

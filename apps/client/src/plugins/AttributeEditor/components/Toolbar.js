import React from "react";
import TableRowsIcon from "@mui/icons-material/TableRows";
import DynamicFormIcon from "@mui/icons-material/DynamicForm";
import { editBus } from "../../../buses/editBus";
import { OGC_SOURCES, PLUGIN_COLORS } from "../constants/index";

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
}) {
  const [serviceId, setServiceId] = React.useState(
    OGC_SOURCES[0]?.id ?? "none"
  );

  const handleOgcSourceChange = (e) => {
    const nextId = e.target.value;
    setServiceId(nextId);

    const def = OGC_SOURCES.find((o) => o.id === nextId);
    const label = def?.label ?? "Ingen";

    setPluginSettings(
      label === "Ingen"
        ? { title: "Attributredigerare", color: PLUGIN_COLORS.default }
        : { title: `Redigerar ${label}`, color: PLUGIN_COLORS.warning }
    );

    if (label === "Ingen") {
      editBus.emit("edit:service-cleared", { source: "toolbar" });
    } else {
      editBus.emit("edit:service-selected", {
        source: "toolbar",
        id: def?.id ?? "",
        layerId: def?.layerId ?? "",
        title: `Redigerar ${label}`,
        color: PLUGIN_COLORS.warning,
      });
    }
  };

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
    </div>
  );
}

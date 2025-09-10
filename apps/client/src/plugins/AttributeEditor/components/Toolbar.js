import React from "react";
import TableRowsIcon from "@mui/icons-material/TableRows";
import DynamicFormIcon from "@mui/icons-material/DynamicForm";

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
}) {
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
            style={s.input}
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
            style={s.input}
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

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";

/* === Field descriptions === */
const FIELD_META = [
  { key: "geoid", label: "geoid", readOnly: true },
  { key: "oracle_geoid", label: "oracle_geoid" },
  { key: "ar_typ", label: "ar_typ" },
  { key: "ar_andamal", label: "ar_andamal" },
  {
    key: "ar_status",
    label: "ar_status",
    type: "select",
    options: ["Aktiv", "Avslutad", "Okänd"],
  },
  { key: "ar_forman", label: "ar_forman" },
  { key: "ar_last", label: "ar_last" },
  { key: "ar_utbredning", label: "ar_utbredning" },
  { key: "ar_aktbeteckning", label: "ar_aktbeteckning" },
  { key: "ar_anteckning", label: "ar_anteckning", type: "textarea" },
  { key: "ar_dokumentlank", label: "ar_dokumentlank" },
];

/* === Example data === */
function createDummyFeatures() {
  const types = [
    "Registrerad nyttjanderätt",
    "Servitut",
    "Avtal",
    "Överenskommelse",
  ];
  const andamal = [
    "Ledningsrätt",
    "Teknisk anläggning",
    "Elstation",
    "Byggnadsbegränsning",
    "Miljöavtal",
    "Korridor 5m bred",
    "Väganslutning",
  ];
  const forman = [
    "Exempelkommun",
    "Myndighet A",
    "Fastighet A 14",
    "Fastighet B 2",
    "Fastighet C 13",
    "Område D",
  ];
  const last = [
    "Kommun Område 12:1",
    "Kommun Gatan 5",
    "Kvarter 3:223",
    "Fastighet A 21",
    "Område 1:80",
    "Fastighet B 5",
    "Fastighet C 15",
  ];

  const list = [];
  for (let i = 0; i < 17; i++) {
    list.push({
      id: i + 1,
      geoid: 13 + i,
      oracle_geoid: (i % 11) + 2,
      ar_typ: types[i % types.length],
      ar_andamal: andamal[i % andamal.length],
      ar_status: i % 9 === 0 ? "Avslutad" : "Aktiv",
      ar_forman: forman[i % forman.length],
      ar_last: last[i % last.length],
      ar_utbredning: i % 3 === 0 ? null : "",
      ar_aktbeteckning: `${12 + (i % 3)}/${22195 + i}`,
      ar_anteckning: i % 5 === 0 ? "Kontrollera dokumentation" : "",
      ar_dokumentlank: `${12 + (i % 3)}_${22195 + i}.PDF`,
    });
  }
  return list;
}

/* === THEME TOKENS === */
const themes = {
  light: {
    appBg: "#ffffff",
    panelBg: "#fafafa",
    panelBgAlt: "#f6f7f9",
    thBg: "#f9fafb",

    border: "#e5e7eb",
    borderMuted: "#f1f5f9",
    listDivider: "#f0f0f0",

    text: "#111827",
    textMuted: "#6b7280",
    label: "#374151",

    primary: "#2563eb",
    primarySolid: "#547edaff",
    primarySoft: "#eaf1ff",

    rowHover: "#eef6ff",
    rowSelected: "#dbeafe",

    warning: "#b45309",
    warningBg: "#fef3c7",

    overlayBg: "#ffffff",
    shadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  dark: {
    appBg: "#0b0f16",
    panelBg: "#0f172a",
    panelBgAlt: "#111827",
    thBg: "#0b1324",

    border: "#263040",
    borderMuted: "#1f2937",
    listDivider: "#1f2937",

    text: "#e5e7eb",
    textMuted: "#9ca3af",
    label: "#cbd5e1",

    primary: "#60a5fa",
    primarySolid: "#3b82f6",
    primarySoft: "rgba(96,165,250,0.15)",

    rowHover: "rgba(96,165,250,0.08)",
    rowSelected: "rgba(96,165,250,0.22)",

    warning: "#f59e0b",
    warningBg: "rgba(245,158,11,0.1)",

    overlayBg: "#0f172a",
    shadow: "0 8px 16px rgba(0,0,0,0.45)",
  },
};

/* === Styles (generated from theme) === */
const OFFSET = 16;

function makeStyles(t) {
  return {
    shell: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      height: "100%",
      fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial",
      color: t.text,
      background: t.appBg,
    },
    toolbar: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: 8,
      background: t.panelBgAlt,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
    },
    toolbarTitle: { fontWeight: 600 },
    toolbarSpacer: { width: 10 },
    toolbarInfo: { display: "flex", alignItems: "center", gap: 8 },
    toolbarStats: { color: t.textMuted, fontSize: 12 },
    spacer: { flex: 1 },

    btn: {
      padding: "8px 12px",
      borderRadius: 8,
      border: `1px solid ${t.border}`,
      background: t.overlayBg,
      color: t.text,
      cursor: "pointer",
    },
    btnSmall: {
      padding: "4px 8px",
      fontSize: 12,
      borderRadius: 8,
      border: `1px solid ${t.border}`,
      background: t.overlayBg,
      color: t.text,
      cursor: "pointer",
    },
    btnPrimary: {
      padding: "8px 12px",
      borderRadius: 8,
      border: `1px solid ${t.primary}`,
      background: t.primarySolid,
      color: "#ffffff",
      cursor: "pointer",
    },
    toggle: (active) => ({
      padding: "6px 10px",
      borderRadius: 999,
      border: `1px solid ${active ? t.primary : t.border}`,
      background: active ? t.primarySoft : t.overlayBg,
      color: t.text,
      cursor: "pointer",
    }),

    paneWrap: {
      display: "grid",
      gridTemplateColumns: "320px 1fr",
      gap: 12,
      height: "calc(100% - 50px)",
    },
    pane: {
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      maxHeight: 510,
      background: t.panelBg,
    },
    paneHeader: {
      padding: 10,
      background: t.panelBg,
      borderBottom: `1px solid ${t.border}`,
      fontWeight: 600,
      color: t.text,
    },
    paneHeaderWithActions: {
      padding: 10,
      background: t.panelBg,
      borderBottom: `1px solid ${t.border}`,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: 8,
      color: t.text,
    },

    list: { overflow: "auto", flex: 1, minHeight: 0 },
    listRow: (sel) => ({
      display: "grid",
      gridTemplateColumns: "28px 1fr",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      borderBottom: `1px solid ${t.listDivider}`,
      background: sel ? t.rowHover : "transparent",
      cursor: "pointer",
    }),
    listRowTitle: { fontWeight: 600, fontSize: 13 },
    listRowSubtitle: { fontSize: 12, color: t.textMuted },
    listEmpty: { padding: 12, color: t.textMuted },
    listFooter: {
      padding: 10,
      display: "flex",
      gap: 8,
      borderTop: `1px solid ${t.border}`,
      background: t.panelBg,
    },
    listFooterInfo: { fontSize: 12, color: t.textMuted },

    form: {
      padding: 12,
      overflow: "auto",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      flex: 1,
      minHeight: 0,
      color: t.text,
    },
    formEmpty: { padding: 16, color: t.textMuted },
    formFooter: {
      padding: 12,
      borderTop: `1px solid ${t.border}`,
      fontSize: 12,
      color: t.textMuted,
      background: t.panelBg,
    },
    formFooterDirty: {
      padding: 12,
      borderTop: `1px solid ${t.border}`,
      fontSize: 12,
      color: t.warning,
      background: t.panelBg,
    },

    field: { display: "flex", flexDirection: "column", gap: 6 },
    label: { fontSize: 12, color: t.label },
    labelChanged: { color: "#f59e0b", marginLeft: 4 },

    input: {
      padding: 8,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      fontSize: 14,
      background: t.overlayBg,
      color: t.text,
    },
    inputChanged: {
      padding: 8,
      border: `1px solid ${t.warning}`,
      borderRadius: 8,
      fontSize: 14,
      background: t.warningBg,
      color: t.text,
    },

    checkbox: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12,
      marginRight: 8,
      color: t.text,
    },

    tableWrap: {
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxSizing: "border-box",
      height: `clamp(180px, calc(100dvh - ${OFFSET}px), 510px)`,
      background: t.panelBg,
    },
    tableHeaderBar: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      padding: 8,
      background: t.panelBg,
      borderBottom: `1px solid ${t.border}`,
      flex: "0 0 auto",
      color: t.text,
    },
    tableHeaderTitle: { fontWeight: 600 },

    tableViewport: {
      flex: "1 1 auto",
      minHeight: 0,
      minWidth: 0,
      overflow: "auto",
      position: "relative",
      background: t.panelBg,
    },
    table: {
      borderCollapse: "separate",
      borderSpacing: 0,
      tableLayout: "auto",
      width: "max-content",
      minWidth: "100%",
      color: t.text,
    },
    th: {
      position: "sticky",
      top: 0,
      zIndex: 1,
      background: t.thBg,
      textAlign: "left",
      fontWeight: 600,
      fontSize: 13,
      padding: "6px 8px",
      borderBottom: `1px solid ${t.border}`,
      cursor: "pointer",
      whiteSpace: "nowrap",
      color: t.text,
    },
    thContent: { display: "flex", alignItems: "center" },
    thControls: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      position: "relative",
    },
    sortButton: {
      border: "none",
      background: "transparent",
      cursor: "pointer",
      padding: 0,
      lineHeight: 1,
      color: t.text,
    },
    columnHeader: { cursor: "pointer", userSelect: "none" },

    filterButton: (hasActiveFilter) => ({
      background: hasActiveFilter ? t.rowSelected : "transparent",
      border: "1px solid transparent",
      cursor: "pointer",
      padding: 2,
      borderRadius: 4,
      display: "flex",
      alignItems: "center",
      color: t.text,
    }),
    filterOverlay: {
      position: "absolute",
      top: "calc(100% + 6px)",
      left: 0,
      zIndex: 1000,
      background: t.overlayBg,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      boxShadow: t.shadow,
      padding: 8,
      minWidth: 200,
      maxHeight: 300,
      overflow: "auto",
      color: t.text,
    },
    filterOverlayButtons: { marginBottom: 8, display: "flex", gap: 4 },
    filterCheckbox: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 0",
      cursor: "pointer",
      fontSize: 13,
      color: t.text,
    },

    td: {
      fontSize: 13,
      padding: "8px 16px",
      borderBottom: `1px solid ${t.borderMuted}`,
      lineHeight: "20px",
      color: t.text,
    },
    tdEmpty: {
      fontSize: 13,
      padding: "8px 16px",
      borderBottom: `1px solid ${t.borderMuted}`,
      lineHeight: "20px",
      color: t.textMuted,
    },
    tr: (selected) => ({
      background: selected ? t.rowSelected : "transparent",
      cursor: "pointer",
    }),
  };
}

/* === Component === */
export default function AttributeEditorView({ initialFeatures }) {
  const [mode, setMode] = useState("table"); // "table" | "form"
  const [dark, setDark] = useState(false);
  const theme = dark ? themes.dark : themes.light;
  const s = makeStyles(theme);

  const [features, setFeatures] = useState(
    () => initialFeatures || createDummyFeatures()
  );

  // === Table: search, sort & selection and filter ===
  const [tableSearch, setTableSearch] = useState("");
  const [sort, setSort] = useState({ key: "geoid", dir: "asc" });
  const [tableSelectedIds, setTableSelectedIds] = useState(new Set());
  const [lastTableIndex, setLastTableIndex] = useState(null);
  const [columnFilters, setColumnFilters] = useState({});
  const [openFilterColumn, setOpenFilterColumn] = useState(null);
  const filterOverlayRef = useRef(null);
  const firstColumnRef = useRef(null);

  useEffect(() => {
    if (!openFilterColumn) return;

    const onPointerDown = (e) => {
      const withinOverlay = filterOverlayRef.current?.contains(e.target);
      const btn = document.querySelector(
        `[data-filter-btn="${openFilterColumn}"]`
      );
      const withinButton = btn?.contains(e.target);
      if (!withinOverlay && !withinButton) {
        setOpenFilterColumn(null);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpenFilterColumn(null);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [openFilterColumn]);

  const filteredAndSorted = useMemo(() => {
    const s = tableSearch.trim().toLowerCase();

    let rows = features.filter((f) => {
      const matchesSearch = !s
        ? true
        : Object.values(f).some((val) =>
            String(val ?? "")
              .toLowerCase()
              .includes(s)
          );

      const matchesColumnFilters = Object.entries(columnFilters).every(
        ([key, selectedValues]) => {
          if (!selectedValues || selectedValues.length === 0) return true;
          const cellValue = String(f[key] ?? "");
          return selectedValues.includes(cellValue);
        }
      );

      return matchesSearch && matchesColumnFilters;
    });

    rows.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (av === bv) return 0;
      const res = av > bv ? 1 : -1;
      return sort.dir === "asc" ? res : -1 * res;
    });

    return rows;
  }, [features, tableSearch, sort, columnFilters]);

  const getUniqueColumnValues = useCallback(
    (columnKey) => {
      const values = new Set();
      features.forEach((f) => {
        const val = String(f[columnKey] ?? "");
        if (val) values.add(val);
      });
      return Array.from(values).sort();
    },
    [features]
  );

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  const handleRowClick = useCallback(
    (rowId, rowIndex, evt) => {
      setTableSelectedIds((prev) => {
        const next = new Set(prev);

        if (evt.shiftKey && lastTableIndex !== null) {
          const [a, b] = [lastTableIndex, rowIndex].sort((x, y) => x - y);
          for (let i = a; i <= b; i++) next.add(filteredAndSorted[i].id);
        } else if (evt.metaKey || evt.ctrlKey) {
          if (next.has(rowId)) next.delete(rowId);
          else next.add(rowId);
          setLastTableIndex(rowIndex);
        } else {
          next.clear();
          next.add(rowId);
          setLastTableIndex(rowIndex);
        }
        return next;
      });
    },
    [filteredAndSorted, lastTableIndex]
  );

  // === Form ===
  const [formSearch, setFormSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [focusedId, setFocusedId] = useState(null);
  const focusedFeature = useMemo(
    () => features.find((f) => f.id === focusedId) || null,
    [features, focusedId]
  );
  const [editValues, setEditValues] = useState({});
  const [originalValues, setOriginalValues] = useState({});
  const [changedFields, setChangedFields] = useState(new Set());
  const [applyToSelection, setApplyToSelection] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (focusedFeature) {
      const fresh = {};
      FIELD_META.forEach(
        ({ key }) => (fresh[key] = normalize(focusedFeature[key]))
      );
      setEditValues(fresh);
      setOriginalValues(fresh);
      setChangedFields(new Set());
      setDirty(false);
    } else {
      setEditValues({});
      setOriginalValues({});
      setChangedFields(new Set());
      setDirty(false);
    }
  }, [focusedFeature]);

  function normalize(v) {
    return v == null ? "" : v;
  }

  const visibleFormList = useMemo(() => {
    const s = formSearch.trim().toLowerCase();
    return features.filter((f) =>
      !s
        ? true
        : [
            f.ar_typ,
            f.ar_andamal,
            f.ar_forman,
            f.ar_last,
            f.geoid,
            f.ar_aktbeteckning,
          ]
            .map((v) => String(v ?? "").toLowerCase())
            .some((token) => token.includes(s))
    );
  }, [features, formSearch]);

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (!focusedId && !prev.has(id)) setFocusedId(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(new Set(visibleFormList.map((f) => f.id)));
    if (!focusedId && visibleFormList.length)
      setFocusedId(visibleFormList[0].id);
  }
  function clearSelection() {
    setSelectedIds(new Set());
  }

  function focusPrev() {
    if (!focusedId) {
      if (visibleFormList.length > 0) {
        const lastId = visibleFormList[visibleFormList.length - 1].id;
        setFocusedId(lastId);
        setTimeout(() => {
          const element = document.querySelector(`[data-row-id="${lastId}"]`);
          element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 0);
      }
      return;
    }

    const arr = Array.from(
      selectedIds.size ? selectedIds : new Set(features.map((f) => f.id))
    );
    const idx = arr.indexOf(focusedId);
    if (idx > 0) {
      const newId = arr[idx - 1];
      setFocusedId(newId);
      setTimeout(() => {
        const element = document.querySelector(`[data-row-id="${newId}"]`);
        element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 0);
    }
  }

  function focusNext() {
    if (!focusedId) {
      if (visibleFormList.length > 0) {
        const firstId = visibleFormList[0].id;
        setFocusedId(firstId);
        setTimeout(() => {
          const element = document.querySelector(`[data-row-id="${firstId}"]`);
          element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 0);
      }
      return;
    }

    const arr = Array.from(
      selectedIds.size ? selectedIds : new Set(features.map((f) => f.id))
    );
    const idx = arr.indexOf(focusedId);
    if (idx < arr.length - 1) {
      const newId = arr[idx + 1];
      setFocusedId(newId);
      setTimeout(() => {
        const element = document.querySelector(`[data-row-id="${newId}"]`);
        element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 0);
    }
  }

  function handleBeforeChangeFocus(targetId) {
    if (!dirty) {
      setFocusedId(targetId);
      return;
    }
    const ok = window.confirm(
      "Du har osparade ändringar. Vill du spara dem först?"
    );
    if (ok) {
      saveChanges({ applyToSelection: false });
      setFocusedId(targetId);
    } else {
      setFocusedId(targetId);
    }
  }

  function projectToFeature(values, onlyChanged = false) {
    const out = {};
    const fieldsToProcess = onlyChanged
      ? FIELD_META.filter(({ key }) => changedFields.has(key))
      : FIELD_META;

    fieldsToProcess.forEach(({ key }) => {
      if (
        ["ar_utbredning", "ar_anteckning"].includes(key) &&
        values[key] === ""
      )
        out[key] = null;
      else out[key] = values[key];
    });
    return out;
  }

  function saveChanges(opts = {}) {
    if (!focusedFeature) return;
    const applyMany = opts.applyToSelection ?? applyToSelection;
    const idsToUpdate =
      applyMany && selectedIds.size
        ? Array.from(selectedIds)
        : [focusedFeature.id];

    setFeatures((prev) =>
      prev.map((f) => {
        if (!idsToUpdate.includes(f.id)) return f;

        if (f.id === focusedFeature.id) {
          return { ...f, ...projectToFeature(editValues, false) };
        } else if (applyMany) {
          return { ...f, ...projectToFeature(editValues, true) };
        }
        return f;
      })
    );

    setOriginalValues({ ...editValues });
    setChangedFields(new Set());
    setDirty(false);
  }

  function resetEdits() {
    if (!focusedFeature) return;
    setEditValues({ ...originalValues });
    setChangedFields(new Set());
    setDirty(false);
  }

  function handleFieldChange(key, value) {
    setEditValues((prev) => ({ ...prev, [key]: value }));

    setChangedFields((prev) => {
      const next = new Set(prev);
      if (value !== originalValues[key]) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });

    setDirty(true);
  }

  function openInFormFromTable(rowId) {
    setMode("form");
    setSelectedIds(new Set([rowId]));
    setFocusedId(rowId);
  }

  function openSelectedInFormFromTable() {
    if (tableSelectedIds.size === 0) return;
    setMode("form");

    const selected = new Set(tableSelectedIds);
    setSelectedIds(selected);

    const first =
      filteredAndSorted.find((r) => selected.has(r.id))?.id ??
      Array.from(selected)[0];
    setFocusedId(first);

    setApplyToSelection(selected.size > 1);
  }

  const ColumnFilter = ({ columnKey, overlayRef, placement = "center" }) => {
    const uniqueValues = getUniqueColumnValues(columnKey);
    const selectedValues = columnFilters[columnKey] || [];

    const anchorStyle =
      placement === "right"
        ? { left: 0, right: "auto", transform: "none" }
        : placement === "left"
          ? { right: 0, left: "auto", transform: "none" }
          : { left: "50%", right: "auto", transform: "translateX(-50%)" };

    return (
      <div ref={overlayRef} style={{ ...s.filterOverlay, ...anchorStyle }}>
        <div style={s.filterOverlayButtons}>
          <button
            style={s.btnSmall}
            onClick={() => {
              setColumnFilters((prev) => ({ ...prev, [columnKey]: [] }));
            }}
          >
            Rensa
          </button>
          <button
            style={s.btnSmall}
            onClick={() => {
              setColumnFilters((prev) => ({
                ...prev,
                [columnKey]: uniqueValues,
              }));
            }}
          >
            Välj alla
          </button>
        </div>

        {uniqueValues.map((value) => (
          <label key={value} style={s.filterCheckbox}>
            <input
              type="checkbox"
              checked={selectedValues.includes(value)}
              onChange={(e) => {
                setColumnFilters((prev) => {
                  const current = prev[columnKey] || [];
                  return e.target.checked
                    ? { ...prev, [columnKey]: [...current, value] }
                    : {
                        ...prev,
                        [columnKey]: current.filter((v) => v !== value),
                      };
                });
              }}
            />
            {value}
          </label>
        ))}
      </div>
    );
  };

  return (
    <div style={s.shell}>
      {/* Top toolbar */}
      <div style={s.toolbar}>
        <strong style={s.toolbarTitle}>Attributredigerare</strong>
        <div style={s.toolbarSpacer} />
        <button
          type="button"
          onClick={() => setMode("table")}
          style={s.toggle(mode === "table")}
          aria-pressed={mode === "table"}
        >
          Tabelläge
        </button>
        <button
          type="button"
          onClick={() => setMode("form")}
          style={s.toggle(mode === "form")}
          aria-pressed={mode === "form"}
        >
          Formulärläge
        </button>

        <div style={s.spacer} />

        {/* Dark / Light toggle */}
        <button
          type="button"
          onClick={() => setDark((v) => !v)}
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
              placeholder="Sök i tabell…"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
            <span style={s.toolbarStats}>
              Totalt: {features.length} • Visas: {filteredAndSorted.length} •
              Valda: {tableSelectedIds.size}
            </span>
          </div>
        ) : (
          <div style={s.toolbarInfo}>
            <input
              style={s.input}
              placeholder="Filtrera listan…"
              value={formSearch}
              onChange={(e) => setFormSearch(e.target.value)}
            />
            <button style={s.btn} onClick={selectAllVisible}>
              Markera alla
            </button>
            <button style={s.btn} onClick={clearSelection}>
              Avmarkera
            </button>
            <span style={s.toolbarStats}>
              Valda: {selectedIds.size} / {features.length}
            </span>
          </div>
        )}
      </div>

      {mode === "table" ? (
        /* ================= TABLE MODE ================= */
        <div style={s.tableWrap}>
          <div style={s.tableHeaderBar}>
            <span style={s.tableHeaderTitle}>Alla objekt</span>
            <div style={s.spacer} />
            <button
              style={s.btnPrimary}
              disabled={tableSelectedIds.size === 0}
              onClick={openSelectedInFormFromTable}
              title={
                tableSelectedIds.size
                  ? "Öppna de markerade raderna i formulärläge"
                  : "Markera rader först"
              }
            >
              Redigera val i formulär
            </button>
          </div>
          <div style={s.tableViewport}>
            <table style={s.table}>
              <thead>
                <tr>
                  {FIELD_META.map((f, index) => {
                    const hasActiveFilter = columnFilters[f.key]?.length > 0;
                    const totalCols = FIELD_META.length;
                    const placement =
                      index < 2
                        ? "right"
                        : index >= totalCols - 1
                          ? "left"
                          : "center";

                    const isFirstColumn = index === 0;
                    return (
                      <th
                        key={f.key}
                        style={s.th}
                        ref={isFirstColumn ? firstColumnRef : null}
                      >
                        <div style={s.thContent}>
                          <div style={s.thControls}>
                            {/* Sort button LEFT of column header */}
                            <button
                              onClick={() => toggleSort(f.key)}
                              title="Klicka för att sortera"
                              style={s.sortButton}
                            >
                              {sort.key === f.key
                                ? sort.dir === "asc"
                                  ? "▲"
                                  : "▼"
                                : "↕"}
                            </button>

                            <span
                              onClick={() => toggleSort(f.key)}
                              style={s.columnHeader}
                            >
                              {f.label}
                            </span>

                            {/* Filter button */}
                            <button
                              data-filter-btn={f.key}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenFilterColumn(
                                  openFilterColumn === f.key ? null : f.key
                                );
                              }}
                              style={s.filterButton(hasActiveFilter)}
                              title={
                                hasActiveFilter
                                  ? `Filter aktivt (${(columnFilters[f.key] || []).length} val)`
                                  : "Filtrera"
                              }
                              aria-pressed={openFilterColumn === f.key}
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={
                                  hasActiveFilter
                                    ? theme.primary
                                    : theme.textMuted
                                }
                                strokeWidth="2"
                              >
                                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                              </svg>
                            </button>

                            {/* Overlay med placement */}
                            {openFilterColumn === f.key && (
                              <ColumnFilter
                                columnKey={f.key}
                                placement={placement}
                                overlayRef={(el) => {
                                  filterOverlayRef.current = el;
                                }}
                                onClose={() => setOpenFilterColumn(null)}
                              />
                            )}
                          </div>

                          <div style={s.spacer} />
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((row, idx) => {
                  const selected = tableSelectedIds.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      style={s.tr(selected)}
                      aria-selected={selected}
                      onClick={(e) => handleRowClick(row.id, idx, e)}
                      onDoubleClick={() => {
                        if (tableSelectedIds.size > 1)
                          openSelectedInFormFromTable();
                        else openInFormFromTable(row.id);
                      }}
                      title="Klick: markera • Dubbelklick: öppna i formulär"
                    >
                      {FIELD_META.map((f) => (
                        <td key={f.key} style={s.td}>
                          {String(row[f.key] ?? "")}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {filteredAndSorted.length === 0 && (
                  <tr>
                    <td style={s.tdEmpty} colSpan={FIELD_META.length}>
                      Inga rader matchar sökningen.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= FORM MODE ================= */
        <div style={s.paneWrap}>
          {/* Left column: object list */}
          <div style={s.pane} aria-label="Objektlista">
            <div style={s.paneHeader}>Objekt</div>
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
                      <div style={s.listRowTitle}>
                        {f.ar_typ} — {f.ar_andamal}
                      </div>
                      <div style={s.listRowSubtitle}>
                        geoid {f.geoid} • {f.ar_forman} • {f.ar_last}
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

          {/* Right column: form */}
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
              <button style={s.btn} onClick={resetEdits} disabled={!dirty}>
                Ångra
              </button>
              <button
                style={s.btnPrimary}
                onClick={() => saveChanges()}
                disabled={!dirty}
              >
                Spara
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
      )}
    </div>
  );
}

/* === Helpers === */
function renderInput(meta, value, onChange, isChanged, s) {
  const inputStyle = isChanged ? s.inputChanged : s.input;
  const common = {
    style: inputStyle,
    value: value ?? "",
    onChange: (e) => onChange(e.target.value),
  };
  if (meta.readOnly) return <input {...common} readOnly />;
  if (meta.type === "textarea") return <textarea {...common} rows={3} />;
  if (meta.type === "select") {
    return (
      <select
        style={inputStyle}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {(meta.options || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  return <input {...common} />;
}

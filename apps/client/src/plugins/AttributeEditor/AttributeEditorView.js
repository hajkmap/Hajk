import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
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

/* === Styles (all CSS collected here) === */
const OFFSET = 16;
const styles = {
  shell: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    height: "100%",
    fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 8,
    background: "#f6f7f9",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
  },
  toolbarTitle: {
    fontWeight: 600,
  },
  toolbarSpacer: {
    width: 10,
  },
  toolbarInfo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  toolbarStats: {
    color: "#6b7280",
    fontSize: 12,
  },
  spacer: { flex: 1 },
  btn: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
  },
  btnSmall: {
    padding: "4px 8px",
    fontSize: 12,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
  },
  btnPrimary: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #2563eb",
    background: "#547edaff",
    color: "white",
    cursor: "pointer",
  },
  toggle: (active) => ({
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${active ? "#2563eb" : "#e5e7eb"}`,
    background: active ? "#eaf1ff" : "white",
    cursor: "pointer",
  }),
  paneWrap: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: 12,
    height: "calc(100% - 50px)",
  },
  pane: {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    maxHeight: 510,
  },
  paneHeader: {
    padding: 10,
    background: "#fafafa",
    borderBottom: "1px solid #e5e7eb",
    fontWeight: 600,
  },
  paneHeaderWithActions: {
    padding: 10,
    background: "#fafafa",
    borderBottom: "1px solid #e5e7eb",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  list: {
    overflow: "auto",
    flex: 1,
    minHeight: 0,
  },
  listRow: (sel) => ({
    display: "grid",
    gridTemplateColumns: "28px 1fr",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderBottom: "1px solid #f0f0f0",
    background: sel ? "#eef6ff" : "transparent",
    cursor: "pointer",
  }),
  listRowTitle: {
    fontWeight: 600,
    fontSize: 13,
  },
  listRowSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  listEmpty: {
    padding: 12,
    color: "#6b7280",
  },
  listFooter: {
    padding: 10,
    display: "flex",
    gap: 8,
    borderTop: "1px solid #e5e7eb",
    background: "#fafafa",
  },
  listFooterInfo: {
    fontSize: 12,
    color: "#6b7280",
  },
  form: {
    padding: 12,
    overflow: "auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    flex: 1,
    minHeight: 0,
  },
  formEmpty: {
    padding: 16,
    color: "#6b7280",
  },
  formFooter: {
    padding: 12,
    borderTop: "1px solid #e5e7eb",
    fontSize: 12,
    color: "#6b7280",
  },
  formFooterDirty: {
    padding: 12,
    borderTop: "1px solid #e5e7eb",
    fontSize: 12,
    color: "#b45309",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: "#374151",
  },
  labelChanged: {
    color: "#f59e0b",
    marginLeft: 4,
  },
  input: {
    padding: 8,
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 14,
  },
  inputChanged: {
    padding: 8,
    border: "1px solid #f59e0b",
    borderRadius: 8,
    fontSize: 14,
    background: "#fef3c7",
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    marginRight: 8,
  },
  tableWrap: {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxSizing: "border-box",
    height: `clamp(180px, calc(100dvh - ${OFFSET}px), 510px)`,
  },
  tableHeaderBar: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    padding: 8,
    background: "#fafafa",
    borderBottom: "1px solid #e5e7eb",
    flex: "0 0 auto",
  },
  tableHeaderTitle: {
    fontWeight: 600,
  },
  tableViewport: {
    flex: "1 1 auto",
    minHeight: 0,
    minWidth: 0,
    overflow: "auto",
    position: "relative",
  },
  table: {
    borderCollapse: "separate",
    borderSpacing: 0,
    tableLayout: "auto",
    width: "max-content",
    minWidth: "100%",
  },
  th: {
    position: "sticky",
    top: 0,
    zIndex: 1,
    background: "#f9fafb",
    textAlign: "left",
    fontWeight: 600,
    fontSize: 13,
    padding: "6px 8px",
    borderBottom: "1px solid #e5e7eb",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  thContent: {
    display: "flex",
    alignItems: "center",
  },
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
  },
  columnHeader: {
    cursor: "pointer",
    userSelect: "none",
  },
  filterButton: (hasActiveFilter) => ({
    background: hasActiveFilter ? "#dbeafe" : "transparent",
    border: "1px solid transparent",
    cursor: "pointer",
    padding: 2,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
  }),
  filterOverlay: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    zIndex: 1000,
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    padding: 8,
    minWidth: 200,
    maxHeight: 300,
    overflow: "auto",
  },
  filterOverlayButtons: {
    marginBottom: 8,
    display: "flex",
    gap: 4,
  },
  filterCheckbox: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 0",
    cursor: "pointer",
    fontSize: 13,
  },
  td: {
    fontSize: 13,
    padding: "8px 16px",
    borderBottom: "1px solid #f1f5f9",
    lineHeight: "20px",
  },
  tdEmpty: {
    fontSize: 13,
    padding: "8px 16px",
    borderBottom: "1px solid #f1f5f9",
    lineHeight: "20px",
    color: "#6b7280",
  },
  tr: (selected) => ({
    background: selected ? "#dbeafe" : "transparent",
    cursor: "pointer",
  }),
};

export default function AttributeEditorView({ initialFeatures }) {
  const [mode, setMode] = useState("table"); // "table" | "form"
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

    // For the focused feature, save all fields
    // For other selected features, save only changed fields
    setFeatures((prev) =>
      prev.map((f) => {
        if (!idsToUpdate.includes(f.id)) return f;

        if (f.id === focusedFeature.id) {
          // For the focused feature, apply all values
          return { ...f, ...projectToFeature(editValues, false) };
        } else if (applyMany) {
          // For other selected features, apply only changed fields
          return { ...f, ...projectToFeature(editValues, true) };
        }
        return f;
      })
    );

    // Update originalValues to reflect saved changes
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

    // Track which fields have changed
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

  const ColumnFilter = ({ columnKey, overlayRef, isFirstColumn }) => {
    const uniqueValues = getUniqueColumnValues(columnKey);
    const selectedValues = columnFilters[columnKey] || [];

    // First column: left: 0 (as now). Other columns: right: 0 (move to the left).
    const anchorStyle = isFirstColumn
      ? { left: 0, right: "auto" }
      : { left: "auto", right: 0 };

    return (
      <div ref={overlayRef} style={{ ...styles.filterOverlay, ...anchorStyle }}>
        <div style={styles.filterOverlayButtons}>
          <button
            style={styles.btnSmall}
            onClick={() => {
              setColumnFilters((prev) => ({ ...prev, [columnKey]: [] }));
            }}
          >
            Rensa
          </button>
          <button
            style={styles.btnSmall}
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
          <label key={value} style={styles.filterCheckbox}>
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
    <div style={styles.shell}>
      {/* Top toolbar */}
      <div style={styles.toolbar}>
        <strong style={styles.toolbarTitle}>Attribute Editor</strong>
        <div style={styles.toolbarSpacer} />
        <button
          type="button"
          onClick={() => setMode("table")}
          style={styles.toggle(mode === "table")}
          aria-pressed={mode === "table"}
        >
          Tabelläge
        </button>
        <button
          type="button"
          onClick={() => setMode("form")}
          style={styles.toggle(mode === "form")}
          aria-pressed={mode === "form"}
        >
          Formulärläge
        </button>
        <div style={styles.spacer} />
        {mode === "table" ? (
          <div style={styles.toolbarInfo}>
            <input
              style={styles.input}
              placeholder="Sök i tabell…"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
            <span style={styles.toolbarStats}>
              Totalt: {features.length} • Visas: {filteredAndSorted.length} •
              Valda: {tableSelectedIds.size}
            </span>
          </div>
        ) : (
          <div style={styles.toolbarInfo}>
            <input
              style={styles.input}
              placeholder="Filtrera listan…"
              value={formSearch}
              onChange={(e) => setFormSearch(e.target.value)}
            />
            <button style={styles.btn} onClick={selectAllVisible}>
              Markera alla
            </button>
            <button style={styles.btn} onClick={clearSelection}>
              Avmarkera
            </button>
            <span style={styles.toolbarStats}>
              Valda: {selectedIds.size} / {features.length}
            </span>
          </div>
        )}
      </div>

      {mode === "table" ? (
        /* ================= TABLE MODE ================= */
        <div style={styles.tableWrap}>
          <div style={styles.tableHeaderBar}>
            <span style={styles.tableHeaderTitle}>Alla objekt</span>
            <div style={styles.spacer} />
            <button
              style={styles.btnPrimary}
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
          <div style={styles.tableViewport}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {FIELD_META.map((f, index) => {
                    const hasActiveFilter = columnFilters[f.key]?.length > 0;
                    const isFirstColumn = index === 0;
                    return (
                      <th
                        key={f.key}
                        style={styles.th}
                        ref={isFirstColumn ? firstColumnRef : null}
                      >
                        <div style={styles.thContent}>
                          <div style={styles.thControls}>
                            {/* Sort button LEFT of column header */}
                            <button
                              onClick={() => toggleSort(f.key)}
                              title="Klicka för att sortera"
                              style={styles.sortButton}
                            >
                              {sort.key === f.key
                                ? sort.dir === "asc"
                                  ? "▲"
                                  : "▼"
                                : "↕"}
                            </button>

                            <span
                              onClick={() => toggleSort(f.key)}
                              style={styles.columnHeader}
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
                              style={styles.filterButton(hasActiveFilter)}
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
                                stroke={hasActiveFilter ? "#2563eb" : "#6b7280"}
                                strokeWidth="2"
                              >
                                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                              </svg>
                            </button>

                            {/* Filter overlay positioned differently based on column */}
                            {openFilterColumn === f.key && (
                              <ColumnFilter
                                columnKey={f.key}
                                isFirstColumn={isFirstColumn}
                                overlayRef={(el) => {
                                  filterOverlayRef.current = el;
                                }}
                                onClose={() => setOpenFilterColumn(null)}
                              />
                            )}
                          </div>

                          <div style={styles.spacer} />
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
                      style={styles.tr(selected)}
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
                        <td key={f.key} style={styles.td}>
                          {String(row[f.key] ?? "")}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {filteredAndSorted.length === 0 && (
                  <tr>
                    <td style={styles.tdEmpty} colSpan={FIELD_META.length}>
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
        <div style={styles.paneWrap}>
          {/* Left column: object list */}
          <div style={styles.pane} aria-label="Objektlista">
            <div style={styles.paneHeader}>Objekt</div>
            <div style={styles.list}>
              {visibleFormList.map((f) => {
                const selected = selectedIds.has(f.id);
                const isFocused = focusedId === f.id;
                return (
                  <div
                    key={f.id}
                    data-row-id={f.id}
                    style={styles.listRow(selected || isFocused)}
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
                      <div style={styles.listRowTitle}>
                        {f.ar_typ} — {f.ar_andamal}
                      </div>
                      <div style={styles.listRowSubtitle}>
                        geoid {f.geoid} • {f.ar_forman} • {f.ar_last}
                      </div>
                    </div>
                  </div>
                );
              })}
              {visibleFormList.length === 0 && (
                <div style={styles.listEmpty}>Inga objekt i listan.</div>
              )}
            </div>
            <div style={styles.listFooter}>
              <button style={styles.btn} onClick={focusPrev}>
                &larr; Föregående
              </button>
              <button style={styles.btn} onClick={focusNext}>
                Nästa &rarr;
              </button>
              <div style={styles.spacer} />
              <span style={styles.listFooterInfo}>
                Fokus: {focusedId ?? "—"}
              </span>
            </div>
          </div>

          {/* Right column: form */}
          <div style={styles.pane} aria-label="Formulär">
            <div style={styles.paneHeaderWithActions}>
              <span>Redigera attribut</span>
              <div style={styles.spacer} />
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={applyToSelection}
                  onChange={(e) => setApplyToSelection(e.target.checked)}
                />
                Spara ändrade fält för alla markerade
              </label>
              <button style={styles.btn} onClick={resetEdits} disabled={!dirty}>
                Ångra
              </button>
              <button
                style={styles.btnPrimary}
                onClick={() => saveChanges()}
                disabled={!dirty}
              >
                Spara
              </button>
            </div>

            {!focusedFeature ? (
              <div style={styles.formEmpty}>
                Markera ett objekt i listan till vänster för att börja redigera.
              </div>
            ) : (
              <>
                <div style={styles.form}>
                  {FIELD_META.map((meta) => (
                    <div key={meta.key} style={styles.field}>
                      <label style={styles.label}>
                        {meta.label}
                        {changedFields.has(meta.key) && (
                          <span style={styles.labelChanged}>(ändrad)</span>
                        )}
                      </label>
                      {renderInput(
                        meta,
                        editValues[meta.key],
                        (v) => handleFieldChange(meta.key, v),
                        changedFields.has(meta.key)
                      )}
                    </div>
                  ))}
                </div>
                <div style={dirty ? styles.formFooterDirty : styles.formFooter}>
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
function renderInput(meta, value, onChange, isChanged) {
  const inputStyle = isChanged ? styles.inputChanged : styles.input;
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

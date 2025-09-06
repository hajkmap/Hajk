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

    success: "#059669",
    successBg: "#d1fae5",

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

    success: "#10b981",
    successBg: "rgba(16,185,129,0.1)",

    overlayBg: "#0f172a",
    shadow: "0 8px 16px rgba(0,0,0,0.45)",
  },
};

/* === Styles (generated from theme) === */
const OFFSET = 16;
const TABLE_MIN = 460;

function makeStyles(t, isMobile) {
  return {
    shell: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      height: "100%",
      fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial",
      color: t.text,
      background: t.appBg,
      minWidth: 0,
    },
    toolbar: {
      display: "flex",
      alignItems: "center",
      gap: isMobile ? 4 : 8,
      padding: isMobile ? 6 : 8,
      background: t.panelBgAlt,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      flexWrap: isMobile ? "wrap" : "nowrap",
    },
    toolbarTitle: {
      fontWeight: 600,
      fontSize: isMobile ? 14 : 16,
      width: isMobile ? "100%" : "auto",
      marginBottom: isMobile ? 4 : 0,
    },
    toolbarSpacer: { width: 10 },
    toolbarInfo: {
      display: "flex",
      alignItems: "center",
      gap: isMobile ? 4 : 8,
      flexWrap: isMobile ? "wrap" : "nowrap",
      width: isMobile ? "100%" : "auto",
    },
    toolbarStats: {
      color: t.textMuted,
      fontSize: isMobile ? 11 : 12,
      whiteSpace: isMobile ? "nowrap" : "normal",
    },
    spacer: { flex: 1 },

    btn: {
      padding: isMobile ? "6px 10px" : "8px 12px",
      borderRadius: 8,
      border: `1px solid ${t.border}`,
      background: t.overlayBg,
      color: t.text,
      cursor: "pointer",
      fontSize: isMobile ? 12 : 14,
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
      padding: isMobile ? "6px 10px" : "8px 12px",
      borderRadius: 8,
      border: `1px solid ${t.primary}`,
      background: t.primarySolid,
      color: "#ffffff",
      cursor: "pointer",
      fontSize: isMobile ? 12 : 14,
    },
    btnPrimaryDisabled: {
      padding: isMobile ? "6px 10px" : "8px 12px",
      borderRadius: 8,
      border: `1px solid ${t.primary}`,
      background: t.primarySolid,
      color: "#ffffff",
      opacity: 0.55,
      cursor: "default",
      fontSize: isMobile ? 12 : 14,
    },
    btnDisabled: {
      padding: isMobile ? "6px 10px" : "8px 12px",
      borderRadius: 8,
      border: `1px solid ${t.border}`,
      background: t.overlayBg,
      color: t.text,
      opacity: 0.55,
      cursor: "default",
      fontSize: isMobile ? 12 : 14,
    },
    toggle: (active) => ({
      padding: isMobile ? "5px 8px" : "6px 10px",
      borderRadius: 999,
      border: `1px solid ${active ? t.primary : t.border}`,
      background: active ? t.primarySoft : t.overlayBg,
      color: t.text,
      cursor: "pointer",
      fontSize: isMobile ? 12 : 14,
    }),

    // Mobile-specific panel styles
    mobileTabBar: {
      display: "flex",
      gap: 4,
      padding: "8px 8px 0 8px",
      background: t.panelBg,
    },
    mobileTab: (active) => ({
      flex: 1,
      padding: "8px 12px",
      border: `1px solid ${t.border}`,
      borderBottom: active ? "none" : `1px solid ${t.border}`,
      borderRadius: "8px 8px 0 0",
      background: active ? t.panelBg : t.panelBgAlt,
      color: t.text,
      cursor: "pointer",
      fontSize: 14,
      fontWeight: active ? 600 : 400,
      textAlign: "center",
    }),
    mobilePaneContainer: {
      flex: 1,
      border: `1px solid ${t.border}`,
      borderRadius: "0 0 8px 8px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      background: t.panelBg,
      minHeight: 0,
    },

    paneWrap: {
      display: isMobile ? "flex" : "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "minmax(320px, 1fr) minmax(260px, 2fr)",
      gap: 12,
      height: isMobile ? "100%" : "calc(100% - 50px)",
      overflowX: "auto",
      minWidth: 0,
      flexDirection: "column",
    },
    pane: {
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      maxHeight: isMobile ? "none" : 510,
      height: isMobile ? "100%" : "auto",
      background: t.panelBg,
      minWidth: 0,
    },
    paneHeader: {
      padding: isMobile ? 8 : 10,
      background: t.panelBg,
      borderBottom: `1px solid ${t.border}`,
      fontWeight: 600,
      color: t.text,
      fontSize: isMobile ? 14 : 16,
    },
    paneHeaderWithActions: {
      padding: isMobile ? 8 : 10,
      background: t.panelBg,
      borderBottom: `1px solid ${t.border}`,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: isMobile ? 4 : 8,
      color: t.text,
      fontSize: isMobile ? 14 : 16,
      flexWrap: isMobile ? "wrap" : "nowrap",
    },

    list: { overflow: "auto", flex: 1, minHeight: 0 },
    listRow: (sel) => ({
      display: "grid",
      gridTemplateColumns: "28px 1fr",
      alignItems: "center",
      gap: 8,
      padding: isMobile ? "6px 8px" : "8px 10px",
      borderBottom: `1px solid ${t.listDivider}`,
      background: sel ? t.rowHover : "transparent",
      cursor: "pointer",
      minWidth: 0,
    }),
    listRowTitle: {
      fontWeight: 600,
      fontSize: isMobile ? 12 : 13,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    listRowSubtitle: {
      fontSize: isMobile ? 11 : 12,
      color: t.textMuted,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    listEmpty: { padding: 12, color: t.textMuted },
    listFooter: {
      padding: isMobile ? 8 : 10,
      display: "flex",
      gap: 8,
      borderTop: `1px solid ${t.border}`,
      background: t.panelBg,
      flexWrap: isMobile ? "wrap" : "nowrap",
    },
    listFooterInfo: { fontSize: 12, color: t.textMuted },

    form: {
      padding: isMobile ? 8 : 12,
      overflow: "auto",
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: isMobile ? 8 : 12,
      flex: 1,
      minHeight: 0,
      color: t.text,
      minWidth: 0,
    },
    formEmpty: {
      padding: 16,
      color: t.textMuted,
      textAlign: "center",
    },
    formFooter: {
      padding: isMobile ? 8 : 12,
      borderTop: `1px solid ${t.border}`,
      fontSize: 12,
      color: t.textMuted,
      background: t.panelBg,
    },
    formFooterDirty: {
      padding: isMobile ? 8 : 12,
      borderTop: `1px solid ${t.border}`,
      fontSize: 12,
      color: t.warning,
      background: t.panelBg,
    },

    field: { display: "flex", flexDirection: "column", gap: 6 },
    label: { fontSize: 12, color: t.label },
    labelChanged: { color: "#f59e0b", marginLeft: 4 },

    input: {
      padding: isMobile ? 6 : 8,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      fontSize: 14,
      background: t.overlayBg,
      color: t.text,
    },
    inputChanged: {
      padding: isMobile ? 6 : 8,
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
      flexShrink: 0,
    },

    tableWrap: {
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      background: t.panelBg,
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      height: isMobile
        ? "calc(100% - 60px)"
        : `clamp(180px, calc(100dvh - ${OFFSET}px), 510px)`,
      overflow: "hidden",
    },
    tableInner: {
      display: "inline-block",
      minWidth: `${TABLE_MIN}px`,
    },
    tableHeaderBar: {
      display: "flex",
      gap: isMobile ? 4 : 8,
      alignItems: "center",
      padding: isMobile ? 6 : 8,
      background: t.panelBg,
      borderBottom: `1px solid ${t.border}`,
      color: t.text,
      flexWrap: "wrap",
      position: "sticky",
      top: 0,
      zIndex: 2,
    },
    tableHeaderTitle: {
      fontWeight: 600,
      fontSize: isMobile ? 14 : 16,
      width: isMobile ? "100%" : "auto",
    },

    tableViewport: {
      flex: "1 1 auto",
      minHeight: 0,
      minWidth: 0,
      overflowX: "auto",
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      position: "relative",
      background: t.panelBg,
    },
    table: {
      borderCollapse: "separate",
      borderSpacing: 0,
      tableLayout: "auto",
      width: "max-content",
      color: t.text,
    },
    th: {
      position: "sticky",
      top: 0,
      zIndex: 1,
      background: t.thBg,
      textAlign: "left",
      fontWeight: 600,
      fontSize: isMobile ? 12 : 13,
      padding: isMobile ? "4px 6px" : "6px 8px",
      borderBottom: `1px solid ${t.border}`,
      cursor: "pointer",
      whiteSpace: "nowrap",
      color: t.text,
    },
    thContent: { display: "flex", alignItems: "center" },
    thControls: {
      display: "inline-flex",
      alignItems: "center",
      gap: isMobile ? 4 : 6,
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
      fontSize: isMobile ? 12 : 13,
      padding: isMobile ? "6px 8px" : "8px 16px",
      borderBottom: `1px solid ${t.borderMuted}`,
      lineHeight: "20px",
      color: t.text,
    },
    tdEmpty: {
      fontSize: isMobile ? 12 : 13,
      padding: isMobile ? "6px 8px" : "8px 16px",
      borderBottom: `1px solid ${t.borderMuted}`,
      lineHeight: "20px",
      color: t.textMuted,
    },
    tr: (selected) => ({
      background: selected ? t.rowSelected : "transparent",
      cursor: "pointer",
    }),

    notification: {
      position: "fixed",
      bottom: 20,
      right: 20,
      padding: "12px 16px",
      borderRadius: 8,
      background: t.successBg,
      border: `1px solid ${t.success}`,
      color: t.text,
      boxShadow: t.shadow,
      display: "flex",
      alignItems: "center",
      gap: 8,
      animation: "slideIn 0.3s ease-out",
      maxWidth: isMobile ? "calc(100% - 40px)" : "auto",
      left: isMobile ? 20 : "auto",
    },
  };
}

/* === Component === */
export default function AttributeEditorView({ initialFeatures }) {
  const [mode, setMode] = useState("table");
  const [dark, setDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState("list"); // "list" | "form"

  const theme = dark ? themes.dark : themes.light;
  const s = makeStyles(theme, isMobile);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [features, setFeatures] = useState(
    () => initialFeatures || createDummyFeatures()
  );

  const [nextId, setNextId] = useState(
    () =>
      Math.max(...(initialFeatures || createDummyFeatures()).map((f) => f.id)) +
      1
  );

  const [notification, setNotification] = useState(null);

  // === Table: search, sort & selection and filter ===
  const [tableSearch, setTableSearch] = useState("");
  const [sort, setSort] = useState({ key: "geoid", dir: "asc" });
  const [tableSelectedIds, setTableSelectedIds] = useState(new Set());
  const [lastTableIndex, setLastTableIndex] = useState(null);
  const [columnFilters, setColumnFilters] = useState({});
  const [openFilterColumn, setOpenFilterColumn] = useState(null);
  const filterOverlayRef = useRef(null);
  const firstColumnRef = useRef(null);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const duplicateSelectedRows = () => {
    if (tableSelectedIds.size === 0) return;

    const newFeatures = [];
    let currentNextId = nextId;

    const maxGeoid = Math.max(...features.map((f) => f.geoid));
    let nextGeoid = maxGeoid + 1;

    features.forEach((f) => {
      if (tableSelectedIds.has(f.id)) {
        const duplicate = {
          ...f,
          id: currentNextId++,
          geoid: nextGeoid++,
          ar_anteckning: f.ar_anteckning
            ? `${f.ar_anteckning} (kopia)`
            : "(kopia)",
        };
        newFeatures.push(duplicate);
      }
    });

    setFeatures((prev) => [...prev, ...newFeatures]);
    setNextId(currentNextId);

    setTableSelectedIds(new Set());

    showNotification(
      `${newFeatures.length} ${newFeatures.length === 1 ? "post" : "poster"} duplicerade`
    );
  };

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
          document
            .querySelector(`[data-row-id="${lastId}"]`)
            ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
        document
          .querySelector(`[data-row-id="${newId}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 0);
    }
  }

  function focusNext() {
    if (!focusedId) {
      if (visibleFormList.length > 0) {
        const firstId = visibleFormList[0].id;
        setFocusedId(firstId);
        setTimeout(() => {
          document
            .querySelector(`[data-row-id="${firstId}"]`)
            ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
        document
          .querySelector(`[data-row-id="${newId}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
    if (ok) saveChanges({ applyToSelection: false });
    setFocusedId(targetId);
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

    showNotification(
      applyMany && selectedIds.size > 1
        ? `Ändringar sparade för ${idsToUpdate.length} objekt`
        : "Ändringar sparade"
    );
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

  // Mobile form component rendering
  const renderMobileForm = () => {
    if (!isMobile || mode !== "form") return null;

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
                  &larr; Föreg.
                </button>
                <button style={s.btn} onClick={focusNext}>
                  Nästa &rarr;
                </button>
                <div style={s.spacer} />
                <span style={s.listFooterInfo}>Fokus: {focusedId ?? "—"}</span>
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
                  <div
                    style={{
                      padding: 8,
                      borderTop: `1px solid ${theme.border}`,
                      display: "flex",
                      gap: 4,
                      flexWrap: "wrap",
                    }}
                  >
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
                      style={!dirty ? s.btnDisabled : s.btn}
                      onClick={resetEdits}
                      disabled={!dirty}
                    >
                      Ångra
                    </button>
                    <button
                      style={!dirty ? s.btnPrimaryDisabled : s.btnPrimary}
                      onClick={() => saveChanges()}
                      disabled={!dirty}
                    >
                      Spara
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
  };

  return (
    <div style={s.shell}>
      {/* Top toolbar */}
      <div style={s.toolbar}>
        <strong style={s.toolbarTitle}>Attributredigerare</strong>
        {!isMobile && <div style={s.toolbarSpacer} />}
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
                  title={
                    selectedIds.size === 0
                      ? "Inget markerat"
                      : "Avmarkera valda"
                  }
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

      {mode === "table" ? (
        /* ================= TABLE MODE ================= */
        <div style={s.tableWrap}>
          <div style={s.tableHeaderBar}>
            <span style={s.tableHeaderTitle}>Alla objekt</span>
            <div style={s.spacer} />

            {/* Always show action buttons (with shorter labels in mobile) */}
            <>
              <button
                style={
                  tableSelectedIds.size === 0
                    ? s.btnPrimaryDisabled
                    : s.btnPrimary
                }
                disabled={tableSelectedIds.size === 0}
                onClick={duplicateSelectedRows}
                title={
                  tableSelectedIds.size
                    ? `Duplicera ${tableSelectedIds.size} markerade`
                    : "Markera rader först"
                }
              >
                {isMobile
                  ? `Duplicera (${tableSelectedIds.size})`
                  : `Duplicera val (${tableSelectedIds.size})`}
              </button>

              <button
                style={
                  tableSelectedIds.size === 0
                    ? s.btnPrimaryDisabled
                    : s.btnPrimary
                }
                disabled={tableSelectedIds.size === 0}
                onClick={openSelectedInFormFromTable}
                title={
                  tableSelectedIds.size
                    ? "Öppna de markerade raderna i formulärläge"
                    : "Markera rader först"
                }
              >
                {isMobile ? "Redigera val" : "Redigera val i formulär"}
              </button>
            </>
            {isMobile && (
              <span style={s.toolbarStats}>
                {filteredAndSorted.length}/{features.length}
              </span>
            )}
          </div>

          <div style={s.tableViewport}>
            <div style={s.tableInner}>
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
        </div>
      ) : isMobile ? (
        /* ================= MOBILE FORM MODE ================= */
        renderMobileForm()
      ) : (
        /* ================= DESKTOP FORM MODE ================= */
        <div
          style={{
            ...s.paneWrap,
            // Allow the page to grow and remove horizontal scroll in form mode (desktop)
            ...(mode === "form" && !isMobile
              ? { height: "auto", overflowX: "hidden" }
              : null),
          }}
        >
          {/* Left: Object list */}
          <div style={s.pane} aria-label="Objektlista">
            <div
              style={{
                ...s.list,
                // Keep vertical scroll, prevent horizontal overflow
                ...(mode === "form" && !isMobile
                  ? { overflowX: "hidden", overflowY: "auto" }
                  : null),
              }}
            >
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
                      <div
                        style={{
                          ...s.listRowTitle,
                          // Break long strings so they don't press the layout horizontally
                          ...(mode === "form" && !isMobile
                            ? { whiteSpace: "normal", overflowWrap: "anywhere" }
                            : null),
                        }}
                      >
                        {f.ar_typ} — {f.ar_andamal}
                      </div>
                      <div
                        style={{
                          ...s.listRowSubtitle,
                          ...(mode === "form" && !isMobile
                            ? { whiteSpace: "normal", overflowWrap: "anywhere" }
                            : null),
                        }}
                      >
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

          {/* Right: Form */}
          <div
            style={{
              ...s.pane,
              // Remove internal height limit -> no internal vertical scroll
              ...(mode === "form" && !isMobile ? { maxHeight: "none" } : null),
            }}
            aria-label="Formulär"
          >
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
                style={!dirty ? s.btnDisabled : s.btn}
                onClick={resetEdits}
                disabled={!dirty}
              >
                Ångra
              </button>
              <button
                style={!dirty ? s.btnPrimaryDisabled : s.btnPrimary}
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
                <div
                  style={{
                    ...s.form,
                    ...(mode === "form" && !isMobile
                      ? { overflowX: "hidden", overflowY: "visible" }
                      : null),
                  }}
                >
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

      {notification && (
        <div style={s.notification}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.primary}
            strokeWidth="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {notification}
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

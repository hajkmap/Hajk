/* === THEME TOKENS === */
export const themes = {
  light: {
    appBg: "#ffffff",
    panelBg: "#fafafa",
    panelBgAlt: "#f6f7f9",
    thBg: "#f9fafb",

    border: "#d5d8dcff",
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
    rowViewed: "#1e3a5f",

    warning: "#b45309",
    warningBg: "#fef3c7",

    success: "#059669",
    successBg: "#d1fae5",

    overlayBg: "#ffffff",
    shadow: "0 4px 6px rgba(0,0,0,0.1)",

    danger: "#ef4444",
    dangerBg: "rgba(239,68,68,0.08)",
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
    rowViewed: "#3b82f6",

    warning: "#f59e0b",
    warningBg: "rgba(245,158,11,0.1)",

    success: "#10b981",
    successBg: "rgba(16,185,129,0.1)",

    overlayBg: "#0f172a",
    shadow: "0 8px 16px rgba(0,0,0,0.45)",

    danger: "#f87171",
    dangerBg: "rgba(248,113,113,0.12)",
  },
};

/* === Styles (generated from theme) === */
const TABLE_MIN = 460;

export function makeStyles(t, isMobile) {
  return {
    editOutlineColor: t.warning,
    thWidth: (ch = 40) => ({
      maxWidth: `${ch}ch`,
      width: `${ch}ch`,
    }),
    tdWidth: (ch = 40) => ({
      maxWidth: `${ch}ch`,
      width: `${ch}ch`,
    }),
    iconBtn: {
      padding: isMobile ? 6 : 8,
      borderRadius: 999,
      border: `1px solid ${t.border}`,
      background: t.overlayBg,
      color: t.text,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 0,
    },
    iconBtnDisabled: {
      padding: isMobile ? 6 : 8,
      borderRadius: 999,
      border: `1px solid ${t.border}`,
      background: t.overlayBg,
      color: t.text,
      opacity: 0.55,
      cursor: "default",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 0,
    },
    iconToggle: (active) => ({
      padding: isMobile ? 6 : 8,
      borderRadius: 999,
      border: `1px solid ${active ? t.primary : t.border}`,
      background: active ? t.primarySoft : t.overlayBg,
      color: t.text,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 0,
    }),

    shell: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      height: "100%",
      overflow: "hidden",
      fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial",
      color: t.text,
      background: t.appBg,
      minWidth: 0,
      minHeight: 0,
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
    mobileFormActions: {
      padding: 8,
      borderTop: `1px solid ${t.border}`,
      display: "flex",
      gap: 4,
      flexWrap: "wrap",
      background: t.panelBg,
    },
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
      flex: "1 1 0",
      minHeight: 0,
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
      flex: "1 1 0",
      minHeight: 0,
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
      gap: isMobile ? 2 : 4,
      color: t.text,
      fontSize: isMobile ? 14 : 16,
      flexWrap: isMobile ? "wrap" : "nowrap",
    },

    list: { overflowY: "auto", overflowX: "hidden", flex: 1, minHeight: 0 },

    listRow: (
      sel,
      status = null,
      isFocused = false,
      hasLeading = true,
      isViewed = false
    ) => {
      const isAdd = status === "add";
      const isEdit = status === "edit";
      const isDelete = status === "delete";
      const isGeom = status === "geom";

      // Priority: delete > geom > edit/add > selected > default
      const baseBg = isDelete
        ? t.dangerBg
        : isAdd
          ? t.successBg
          : isEdit || isGeom
            ? t.warningBg
            : sel
              ? t.rowSelected
              : "transparent";

      const statusShadow = isDelete
        ? `inset 4px 0 ${t.danger}`
        : isAdd
          ? `inset 4px 0 ${t.success}`
          : isEdit || isGeom
            ? `inset 4px 0 ${t.warning}`
            : "none";

      const selectRing = sel ? `inset 0 0 0 2px ${t.primary}` : null;
      const focusRing =
        !sel && isFocused
          ? `inset 0 0 0 2px ${t.focusRing || t.primaryMuted}`
          : null;

      return {
        display: "grid",
        gridTemplateColumns: hasLeading
          ? "28px minmax(0,1fr)"
          : "minmax(0,1fr)",
        alignItems: "center",
        gap: hasLeading ? 8 : 0,
        padding: isMobile ? "6px 8px" : "8px 10px",
        borderBottom: `1px solid ${t.listDivider}`,
        background: baseBg,
        cursor: "pointer",
        minWidth: 0,
        textDecoration: isDelete ? "line-through" : "none",
        opacity: 1,
        boxShadow: [statusShadow, selectRing, focusRing]
          .filter(Boolean)
          .join(", "),
        outline: isViewed ? `3px solid ${t.rowViewed}` : undefined,
        outlineOffset: isViewed ? "-1px" : undefined,
      };
    },

    listRowText: {
      minWidth: 0,
    },
    wrapText: {
      whiteSpace: "normal",
      overflowWrap: "anywhere",
      wordBreak: "break-word",
    },
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
      alignItems: "center",
    },
    listFooterCompact: {
      padding: isMobile ? 8 : 10,
      display: "flex",
      gap: 0,
      borderTop: `1px solid ${t.border}`,
      background: t.panelBg,
      flexWrap: isMobile ? "wrap" : "nowrap",
      alignItems: "center",
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
      padding: isMobile ? 8 : 10,
      borderTop: `1px solid ${t.border}`,
      fontSize: 12,
      color: t.textMuted,
      background: t.panelBg,
      display: "flex",
      alignItems: "center",
    },
    formFooterDirty: {
      padding: isMobile ? 8 : 10,
      borderTop: `1px solid ${t.border}`,
      fontSize: 12,
      color: t.warning,
      background: t.panelBg,
      display: "flex",
      alignItems: "center",
    },

    field: { display: "flex", flexDirection: "column", gap: 6 },
    label: { fontSize: 12, color: t.label },
    labelChanged: { color: t.warning, marginLeft: 4 },

    inputComb: {
      padding: isMobile ? 6 : 8,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      fontSize: 14,
      background: t.overlayBg,
      color: t.text,
    },
    input: {
      padding: isMobile ? 6 : 8,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      fontSize: 14,
      background: t.overlayBg,
      color: t.text,
      resize: "vertical",
      minWidth: "100%",
      maxWidth: "100%",
    },
    inputChanged: {
      padding: isMobile ? 6 : 8,
      border: `1px solid ${t.warning}`,
      borderRadius: 8,
      fontSize: 14,
      background: t.warningBg,
      color: t.text,
      resize: "vertical",
      minWidth: "100%",
      maxWidth: "100%",
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

    tableHeaderLeft: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      minWidth: 0,
      flexShrink: 1,
    },
    tableHeaderBadges: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      minWidth: 0,
    },
    statusPill: {
      fontSize: isMobile ? 10 : 12,
      padding: isMobile ? "2px 6px" : "2px 8px",
      borderRadius: 999,
      whiteSpace: "nowrap",
      lineHeight: 1.4,
    },
    statusPillWarn: {
      border: `1px solid ${t.warning}`,
      background: t.warningBg,
      color: t.text,
    },
    statusPillDanger: {
      border: `1px solid ${t.danger}`,
      background: t.dangerBg,
      color: t.text,
    },
    tableHeaderButtonsWrap: {
      display: "flex",
      alignItems: "center",
      gap: isMobile ? 4 : 8,
      flexShrink: 0,
      flexWrap: "nowrap",
    },
    tableWrap: {
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      background: t.panelBg,
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      flex: "1 1 0",
      minHeight: 0,
      overflow: "hidden",
    },
    tableInner: {
      display: "inline-block",
      minWidth: `${TABLE_MIN}px`,
    },
    tableHeaderBar: {
      display: "flex",
      gap: isMobile ? 2 : 4,
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
      width: "auto",
    },

    tableViewport: {
      flex: "1 1 0",
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
      tableLayout: "fixed",
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
    thResizer: {
      position: "absolute",
      top: 0,
      right: 0,
      width: 6,
      height: "100%",
      cursor: "col-resize",
      userSelect: "none",
      touchAction: "none",
    },
    thResizerHover: {
      background: "rgba(0,0,0,0.06)",
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

    tdEdited: {
      fontSize: isMobile ? 12 : 13,
      padding: isMobile ? "6px 8px" : "8px 16px",
      borderBottom: `1px solid ${t.borderMuted}`,
      lineHeight: "20px",
      background: t.warningBg,
      verticalAlign: "top",
    },
    tdPlaceholder: {
      fontSize: isMobile ? 12 : 13,
      padding: isMobile ? "6px 8px" : "8px 16px",
      borderBottom: `1px solid ${t.borderMuted}`,
      lineHeight: "20px",
      color: t.textMuted,
      fontStyle: "italic",
      verticalAlign: "top",
    },
    cellInput: {
      width: "100%",
      boxSizing: "border-box",
      padding: isMobile ? "4px 6px" : "6px 8px",
      borderRadius: 6,
      border: `1px solid ${t.border}`,
      background: t.overlayBg,
      color: t.text,
      fontSize: isMobile ? 12 : 13,
      outline: "none",
      resize: "vertical",
      minWidth: "100%",
      maxWidth: "100%",
    },
    td: {
      fontSize: isMobile ? 12 : 13,
      padding: isMobile ? "6px 8px" : "8px 16px",
      borderBottom: `1px solid ${t.borderMuted}`,
      lineHeight: "20px",
      color: t.text,
      verticalAlign: "top",
    },
    tdStrike: {
      textDecoration: "line-through",
      opacity: 0.9,
    },
    tdNowrap: {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    tdWrap: (ch = 40) => ({
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
      wordBreak: "break-word",
      maxWidth: `${ch}ch`,
      verticalAlign: "top",
    }),
    tdEmpty: {
      fontSize: isMobile ? 12 : 13,
      padding: isMobile ? "6px 8px" : "8px 16px",
      borderBottom: `1px solid ${t.borderMuted}`,
      lineHeight: "20px",
      color: t.textMuted,
    },
    tr: (selected, pending, isViewed) => ({
      background: selected
        ? t.rowSelected
        : pending === "add"
          ? t.successBg
          : pending === "delete"
            ? t.dangerBg
            : pending === "edit" || pending === "geom"
              ? t.warningBg
              : "transparent",
      cursor: "pointer",
      outline: isViewed
        ? `3px solid ${t.rowViewed}`
        : pending === "delete"
          ? `2px dashed ${t.danger}`
          : pending === "add"
            ? `2px dashed ${t.success}`
            : pending === "edit" || pending === "geom"
              ? `2px dashed ${t.warning}`
              : "none",
      outlineOffset: isViewed ? "-1px" : undefined,
      transition: "background-color 0.15s ease",
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
      minWidth: 260,
      maxWidth: 360,
      maxHeight: 380,
      overflow: "hidden",
      color: t.text,
    },

    filterSearch: {
      width: "100%",
      boxSizing: "border-box",
      padding: "6px 8px",
      marginBottom: 8,
      border: `1px solid ${t.border}`,
      borderRadius: 6,
      background: t.overlayBg,
      color: t.text,
      fontSize: 13,
    },

    filterOverlayButtons: {
      marginBottom: 8,
      display: "flex",
      gap: 4,
      flexWrap: "wrap",
    },

    filterListScroll: {
      maxHeight: 200,
      overflowY: "auto",
      paddingRight: 4,
    },

    filterCheckbox: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 0",
      cursor: "pointer",
      fontSize: 13,
      color: t.text,
    },

    filterCheckboxText: {
      display: "inline-block",
      maxWidth: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    btnActive: {
      padding: isMobile ? "6px 10px" : "8px 12px",
      borderRadius: 8,
      border: `1px solid ${t.primary}`,
      background: t.primary,
      color: "#ffffff",
      cursor: "pointer",
      fontSize: isMobile ? 12 : 14,
      fontWeight: 600,
    },

    filterWarningBanner: {
      padding: isMobile ? "4px 8px" : "6px 10px",
      background: t.warningBg,
      border: `1px solid ${t.warning}`,
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: isMobile ? 12 : 13,
      color: t.text,
      margin: isMobile ? 8 : 12,
      marginBottom: 0,
    },
    filterWarningIcon: {
      color: t.warning,
      fontSize: 18,
      flexShrink: 0,
    },

    bulkEditWarning: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: isMobile ? "4px 8px" : "6px 10px",
      background: t.warningBg,
      border: `1px solid ${t.warning}`,
      borderRadius: 8,
      fontSize: isMobile ? 12 : 13,
      color: t.text,
      fontWeight: 600,
      flexShrink: 0,
      margin: isMobile ? 8 : 12,
      marginBottom: 0,
    },
    bulkEditWarningIcon: {
      color: t.warning,
      fontSize: 16,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
    },

    // Pagination styles
    tableFooter: {
      display: "flex",
      alignItems: "center",
      gap: isMobile ? 6 : 12,
      padding: isMobile ? 4 : 4,
      background: t.panelBg,
      borderTop: `1px solid ${t.border}`,
      flexWrap: isMobile ? "wrap" : "nowrap",
    },
    paginationInfo: {
      fontSize: isMobile ? 12 : 13,
      color: t.textMuted,
      whiteSpace: "nowrap",
    },
    paginationControls: {
      display: "flex",
      alignItems: "center",
      gap: isMobile ? 4 : 8,
      flexWrap: "nowrap",
    },
    paginationControlsCompact: {
      display: "flex",
      alignItems: "center",
      gap: 0,
      flexWrap: "nowrap",
    },
    rowsPerPageLabel: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: isMobile ? 12 : 13,
      color: t.text,
      whiteSpace: "nowrap",
    },
    rowsPerPageSelect: {
      padding: isMobile ? "4px 6px" : "6px 8px",
      border: `1px solid ${t.border}`,
      borderRadius: 6,
      background: t.overlayBg,
      color: t.text,
      fontSize: isMobile ? 12 : 13,
      cursor: "pointer",
      marginLeft: 4,
    },
    pageIndicator: {
      fontSize: isMobile ? 12 : 13,
      color: t.text,
      padding: isMobile ? "0 4px" : "0 8px",
      whiteSpace: "nowrap",
    },
    pageIndicatorCompact: {
      fontSize: isMobile ? 12 : 13,
      color: t.text,
      padding: "0 2px",
      whiteSpace: "nowrap",
    },
    trHover: {
      background: t.rowHover,
    },
    descriptionIcon: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      marginLeft: "6px",
      padding: "2px",
      border: "none",
      background: "transparent",
      cursor: "help",
      color: t.primary || "#0077ffff",
      opacity: 1,
      transition: "opacity 0.2s, transform 0.2s",
      verticalAlign: "middle",
      lineHeight: 1,
      "&:hover": {
        opacity: 1,
        transform: "scale(1.1)",
      },
    },
  };
}

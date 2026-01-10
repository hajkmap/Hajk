import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { themes, makeStyles } from "./theme/Styles";
import {
  isEditableField,
  isMissingValue,
  renderInput,
  idAliases,
} from "./helpers/helpers";

import Toolbar from "./components/Toolbar";
import TableMode from "./components/TableMode";
import MobileForm from "./components/MobileForm";
import DesktopForm from "./components/DesktopForm";
import NotificationBar from "./helpers/NotificationBar";
import { editBus } from "../../buses/editBus";
import { pickPreferredId } from "./helpers/helpers";
import { useSnackbar } from "notistack";
import GeoJSON from "ol/format/GeoJSON";

export default function AttributeEditorView({
  state,
  controller,
  ui,
  setPluginSettings,
  ogc,
  fieldMeta,
  vectorLayerRef,
  styleFn,
  visibleIdsRef,
  selectedIdsRef,
  serviceList,
  featureIndexRef,
  graveyardRef,
  model,
  draftBaselineRef,
  app,
  map,
  handleRowHover,
  handleRowLeave,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const geomUndoRef = React.useRef([]);
  const [geomUndoCount, setGeomUndoCount] = React.useState(0);
  const uniqueCacheRef = useRef(new Map());
  const lastSentRef = useRef(new Map());
  const [serviceId, setServiceId] = React.useState("NONE_ID");
  const [tableEditing, setTableEditing] = useState(null); // { id, key, startValue } | null

  const [isMobile, setIsMobile] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState("list");

  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [tableSelectedIds, setTableSelectedIds] = useState(new Set());
  const [lastTableIndex, setLastTableIndex] = useState(null);
  const [tableUndoLocal, setTableUndoLocal] = useState([]);
  const pushTableUndo = useCallback((entry) => {
    setTableUndoLocal((prev) => [...prev, { ...entry, when: Date.now() }]);
  }, []);

  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [frozenSelectedIds, setFrozenSelectedIds] = useState(new Set());

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [focusedId, setFocusedId] = useState(null);
  const lastEditTargetIdsRef = useRef(null);
  const anchorRef = useRef({ id: null, index: null });

  const explicitClearRef = React.useRef(false);

  const [columnFilters, setColumnFilters] = useState({});
  const [openFilterColumn, setOpenFilterColumn] = useState(null);
  const filterOverlayRef = useRef(null);
  const firstColumnRef = useRef(null);
  const [searchText, setSearchText] = useState("");

  const [notification, setNotification] = useState(null);
  const notifTimerRef = useRef(null);
  const formUndoSnapshotsRef = useRef(new Map());
  const showNotification = useCallback((message) => {
    setNotification(message);
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setNotification(null), 3000);
  }, []);
  useEffect(
    () => () => {
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    },
    []
  );

  const setGeometryById = React.useCallback(
    (logicalId, targetGeometry) => {
      const layer = vectorLayerRef?.current;
      const src = layer?.getSource?.();
      if (!src) return false;

      const want = String(logicalId);
      const all = src.getFeatures?.() || [];

      const matches = (f) => {
        const a = f?.getId?.();
        const b = f?.get?.("@_fid");
        const c = f?.get?.("id");
        const A = a != null ? String(a) : null;
        const B = b != null ? String(b) : null;
        const C = c != null ? String(c) : null;
        if (A === want || B === want || C === want) return true;
        if ((A && A.endsWith("." + want)) || (B && B.endsWith("." + want)))
          return true;
        return false;
      };

      const f = src.getFeatureById?.(want) || all.find(matches);
      if (!f) return false;

      if (targetGeometry && targetGeometry.clone) {
        f.setGeometry(targetGeometry.clone());
      } else if (targetGeometry) {
        f.setGeometry(targetGeometry);
      }

      try {
        f.set?.("USER_DRAWN", true, true);
        f.set?.("EDIT_ACTIVE", false, true);
      } catch {}

      layer?.changed?.();
      src?.changed?.();
      return true;
    },
    [vectorLayerRef]
  );

  React.useEffect(() => {
    const off = editBus.on("sketch:geometry-edited", (ev) => {
      const { id, before, after, when = Date.now() } = ev.detail || {};
      if (id == null || !after) return;

      // 1) mark as "geometry edited"
      controller.batchEdit([{ id, key: "__geom__", value: when }]);

      // 2) add to local undo stack
      geomUndoRef.current.push({ id, before, after, when });
      setGeomUndoCount((c) => c + 1);
    });
    return () => off();
  }, [controller]);

  React.useEffect(() => {
    const lyr = vectorLayerRef?.current;
    if (!lyr) return;
    lyr.setStyle(styleFn);
    lyr.changed(); // refresh symbols immediately
  }, [vectorLayerRef, styleFn]);

  React.useEffect(() => {
    const offSel = editBus.on("edit:service-selected", (ev) => {
      const id = ev?.detail?.id ?? "UNKNOWN";
      setServiceId(id);
    });
    const offClr = editBus.on("edit:service-cleared", () => {
      setServiceId("NONE_ID");
    });
    return () => {
      offSel();
      offClr();
    };
  }, []);

  React.useEffect(() => {
    const offSelIds = editBus.on("attrib:select-ids", (ev) => {
      const incoming = ev.detail?.ids || [];
      const normalizeId = (id) => {
        const s = String(id);
        return /^-?\d+$/.test(s) ? Number(s) : s;
      };
      const canonical = Array.from(new Set(incoming.map(normalizeId)));

      setTableSelectedIds(new Set(canonical));
      setSelectedIds(new Set(canonical));

      const focus = pickPreferredId(canonical);
      setFocusedId(focus);

      if (focus != null && ev.detail?.source !== "map") {
        editBus.emit("attrib:focus-id", {
          id: focus,
          source: ev.detail?.source,
        });
      }
    });
    return () => offSelIds();
  }, [setTableSelectedIds, setSelectedIds, setFocusedId]);

  const debouncedBatchRef = React.useRef(null);
  const debouncedTimerRef = React.useRef(null);
  const debouncedBatchEdit = React.useCallback(
    (ops) => {
      if (!ops?.length) return;
      const queue = (debouncedBatchRef.current ??= []);
      queue.push(...ops);

      if (debouncedTimerRef.current) {
        clearTimeout(debouncedTimerRef.current);
      }

      debouncedTimerRef.current = setTimeout(() => {
        const flush = debouncedBatchRef.current || [];
        debouncedBatchRef.current = [];
        debouncedTimerRef.current = null;

        const byKey = new Map();
        for (const op of flush) byKey.set(`${op.id}::${op.key}`, op);
        const merged = Array.from(byKey.values());
        if (merged.length) controller.batchEdit(merged);
      }, 120);
    },
    [controller]
  );

  // Cleanup effect
  React.useEffect(() => {
    return () => {
      if (debouncedTimerRef.current) {
        clearTimeout(debouncedTimerRef.current);
        debouncedTimerRef.current = null;
      }
      debouncedBatchRef.current = [];
    };
  }, []);

  React.useEffect(() => {
    lastSentRef.current.clear();
  }, [focusedId, selectedIds]);

  React.useEffect(() => {
    // Reset filter
    setColumnFilters({});
    setColumnFilterUI({});
    setOpenFilterColumn(null);
    uniqueCacheRef.current?.clear?.();
    setSearchText("");

    // End celledits
    setTableEditing(null);
    setTableSelectedIds(new Set());
    setSelectedIds(new Set());
    setFocusedId(null);
  }, [serviceId]);

  // === Theme ===
  const theme = ui.dark ? themes.dark : themes.light;
  const s = useMemo(() => makeStyles(theme, isMobile), [theme, isMobile]);

  // === Responsiveness ===
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // === Model state ===
  const features = React.useMemo(() => state.features ?? [], [state.features]);
  const pendingEdits = React.useMemo(
    () => state.pendingEdits ?? {},
    [state.pendingEdits]
  );
  const pendingAdds = React.useMemo(
    () => state.pendingAdds ?? [],
    [state.pendingAdds]
  );
  const pendingDeletes = React.useMemo(
    () => state.pendingDeletes ?? new Set(),
    [state.pendingDeletes]
  );
  const tableUndoStack = React.useMemo(
    () => state.undoStack ?? [],
    [state.undoStack]
  );

  const tableHasPending =
    pendingAdds.length > 0 ||
    Object.keys(pendingEdits).length > 0 ||
    (pendingDeletes?.size ?? 0) > 0;

  const syncColumnFilterOnValueChange = React.useCallback(
    (columnKey, fromValue, toValue, rowId) => {
      setColumnFilters((prev) => {
        const active = prev?.[columnKey];
        if (!Array.isArray(active) || active.length === 0) return prev;

        const fromStr = String(fromValue ?? "");
        const toStr = String(toValue ?? "");

        const effectiveAll = [
          ...features.map((f) => ({ ...f, ...(pendingEdits?.[f.id] || {}) })),
          ...(pendingAdds || []),
        ].filter((r) => !pendingDeletes?.has?.(r.id));

        const nextSet = new Set(active.map(String));

        if (toStr !== "") nextSet.add(toStr);

        if (fromStr !== "" && fromStr !== toStr) {
          const stillUsed = effectiveAll.some(
            (r) => r.id !== rowId && String(r?.[columnKey] ?? "") === fromStr
          );
          if (!stillUsed) nextSet.delete(fromStr);
        }

        const nextArr = Array.from(nextSet);
        if (
          nextArr.length === active.length &&
          nextArr.every((v, i) => v === active[i])
        ) {
          return prev;
        }
        return { ...(prev || {}), [columnKey]: nextArr };
      });
    },
    [setColumnFilters, features, pendingEdits, pendingAdds, pendingDeletes]
  );

  const setTablePendingEdits = useCallback(
    (updaterOrObj) => {
      const prev = pendingEdits;
      const next =
        typeof updaterOrObj === "function" ? updaterOrObj(prev) : updaterOrObj;

      // -1, 42 -> number; otherwise string
      const parseId = (k) => (/^-?\d+$/.test(k) ? Number(k) : k);
      const ids = new Set([
        ...Object.keys(prev).map(parseId),
        ...Object.keys(next).map(parseId),
      ]);

      const ops = [];
      ids.forEach((id) => {
        const prevRow = prev[id] || {};
        const nextRow = next[id] || {};
        const keys = new Set([
          ...Object.keys(prevRow),
          ...Object.keys(nextRow),
        ]);
        const base = features.find((f) => f.id === id) || {};

        keys.forEach((key) => {
          const hadPrev = Object.prototype.hasOwnProperty.call(prevRow, key);
          const hasNext = Object.prototype.hasOwnProperty.call(nextRow, key);
          const prevVal = hadPrev ? prevRow[key] : undefined;

          if (!hasNext) {
            const baseVal = base[key];
            if (prevVal !== undefined) {
              ops.push({ id, key, value: baseVal });
            }
          } else {
            const nextVal = nextRow[key];
            if (prevVal !== nextVal) {
              ops.push({ id, key, value: nextVal });
            }
          }
        });
      });

      if (ops.length) controller.batchEdit(ops);
    },
    [pendingEdits, features, controller]
  );

  const setTablePendingAdds = useCallback(
    (updater) => {
      const prev = pendingAdds;
      const next =
        typeof updater === "function"
          ? updater(prev)
          : Array.isArray(updater)
            ? updater
            : prev;

      const byIdPrev = new Map(prev.map((d) => [d.id, d]));
      const byIdNext = new Map(next.map((d) => [d.id, d]));

      const editOps = [];
      const toggleIdsMark = [];
      const toggleIdsUnmark = [];

      byIdNext.forEach((draftNext, id) => {
        const draftPrev = byIdPrev.get(id);
        if (!draftPrev) return;

        Object.keys(draftNext).forEach((key) => {
          if (key === "__pending") return;
          const prevVal = draftPrev[key];
          const nextVal = draftNext[key];
          if ((prevVal ?? "") !== (nextVal ?? "")) {
            editOps.push({ id, key, value: nextVal });
          }
        });

        const prevP = draftPrev.__pending;
        const nextP = draftNext.__pending;
        if (prevP !== nextP) {
          if (nextP === "delete") toggleIdsMark.push(id);
          else toggleIdsUnmark.push(id);
        }
      });

      if (editOps.length) controller.batchEdit(editOps);
      if (toggleIdsMark.length) controller.toggleDelete(toggleIdsMark, "mark");
      if (toggleIdsUnmark.length)
        controller.toggleDelete(toggleIdsUnmark, "unmark");
    },
    [pendingAdds, controller]
  );

  const setDeleteState = useCallback(
    (ids, mode) => controller.toggleDelete(ids, mode),
    [controller]
  );

  useEffect(() => {
    if (!openFilterColumn) return;

    const onPointerDown = (e) => {
      const withinOverlay = filterOverlayRef.current?.contains(e.target);
      const btn = document.querySelector(
        `[data-filter-btn="${openFilterColumn}"]`
      );
      const withinButton = btn?.contains(e.target);
      if (!withinOverlay && !withinButton) setOpenFilterColumn(null);
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

  const allRows = useMemo(() => {
    const editedFeatures = features.map((f, i) => {
      const patch = pendingEdits[f.id];
      let row = patch ? { ...f, ...patch } : f;
      if (pendingDeletes?.has?.(f.id)) row = { ...row, __pending: "delete" };
      return { ...row, __idx: i };
    });

    const drafts = pendingAdds.map((d, i) => ({
      ...d,
      __idx: features.length + i,
    }));

    return [...editedFeatures, ...drafts];
  }, [features, pendingAdds, pendingEdits, pendingDeletes]);

  const FM = React.useMemo(() => {
    if (serviceId === "NONE_ID") return [];

    if (Array.isArray(fieldMeta) && fieldMeta.length) {
      return fieldMeta.map((m, i) => ({
        initialWidth: i === 0 ? 120 : 220,
        ...m,
      }));
    }

    if (!allRows.length) return [];

    const keySet = new Set();
    allRows.forEach((r) => Object.keys(r || {}).forEach((k) => keySet.add(k)));

    // Technical/"internal" fields that should not be columns
    const HIDE = new Set(["__idx", "__pending"]);
    const keys = Array.from(keySet).filter(
      (k) => !k.startsWith("__") && !HIDE.has(k)
    );

    keys.sort((a, b) => (a === "id" ? -1 : b === "id" ? 1 : 0));

    return keys.map((key, i) => ({
      key,
      label: key,
      readOnly: key === "id",
      type: "text",
      initialWidth: i === 0 ? 120 : 220,
    }));
  }, [serviceId, fieldMeta, allRows]);

  const filteredAndSorted = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const editingId = tableEditing?.id ?? null;

    let rows = allRows.filter((f) => {
      // Always show negative IDs (new/duplicate)
      const isNegativeId = typeof f.id === "number" && f.id < 0;

      // If "show only first ID" is active, use the FIRST ID:na
      if (
        showOnlySelected &&
        !isNegativeId &&
        !frozenSelectedIds.has(f.id) &&
        editingId !== f.id
      ) {
        return false;
      }

      const matchesSearch =
        !q ||
        editingId === f.id ||
        Object.values(f).some((val) =>
          String(val ?? "")
            .toLowerCase()
            .includes(q)
        );

      const matchesColumnFilters =
        editingId === f.id
          ? true
          : Object.entries(columnFilters).every(([key, selectedValues]) => {
              if (!selectedValues || selectedValues.length === 0) return true;
              const cellValue = String(f[key] ?? "");

              // Convert "(tom)" in filter back to "" for comparison
              const normalizedSelected = selectedValues.map((v) =>
                v === "(tom)" ? "" : v
              );

              return normalizedSelected.includes(cellValue);
            });

      return matchesSearch && matchesColumnFilters;
    });

    const isEmpty = (v) => v === null || v === undefined || v === "";
    const cmp = (x, y) => {
      const ax = x ?? "";
      const by = y ?? "";
      const nx = Number(ax),
        ny = Number(by);
      const bothNum = Number.isFinite(nx) && Number.isFinite(ny);
      if (isEmpty(ax) && isEmpty(by)) return 0;
      if (isEmpty(ax)) return 1;
      if (isEmpty(by)) return -1;
      return bothNum
        ? nx - ny
        : String(ax).localeCompare(String(by), "sv", {
            numeric: true,
            sensitivity: "base",
          });
    };

    const pri = (r) => {
      // Drafts (negative IDs) always stay in the "new items" section,
      // even if marked for deletion
      if (r.id < 0) return 0;
      // Otherwise, "add" gets priority 0, rest gets 1
      return r.__pending === "add" ? 0 : 1;
    };
    if (editingId != null) {
      rows.sort((a, b) => {
        const p = pri(a) - pri(b);
        if (p !== 0) return p;
        return (a.__idx ?? 0) - (b.__idx ?? 0);
      });
      return rows;
    }
    rows.sort((a, b) => {
      const p = pri(a) - pri(b);
      if (p !== 0) return p;

      if (!sort.key) return (a.__idx ?? 0) - (b.__idx ?? 0);

      const res = cmp(a[sort.key], b[sort.key]);
      return sort.dir === "asc" ? res : -res;
    });

    return rows;
  }, [
    allRows,
    sort,
    columnFilters,
    tableEditing,
    showOnlySelected,
    frozenSelectedIds,
    searchText,
  ]);

  const cloneGeometryForDuplicates = React.useCallback(
    (sourceIds, createdIds) => {
      const layer = vectorLayerRef.current;
      const src = layer?.getSource?.();
      if (!src) return;

      // Helper: match AE-id (e.g. 5) against OL-ID/props (@_fid, id, getId)
      const resolveSourceFeature = (fromId) => {
        const want = String(fromId);

        // 1) Directly via getFeatureById (OL-ID)
        let f = src.getFeatureById?.(want);
        if (f) return f;

        // 2) Search all features and compare multiple id variants
        const all = src.getFeatures?.() || [];
        f = all.find((x) => {
          const a = x?.getId?.(); // OL-ID (kan vara "@_fid")
          const b = x?.get?.("@_fid");
          const c = x?.get?.("id");
          const A = a != null ? String(a) : null;
          const B = b != null ? String(b) : null;
          const C = c != null ? String(c) : null;

          // exact match against any variant
          if (A === want || B === want || C === want) return true;

          // “suffix”-match: "@_fid" ending with ".<id>" (e.g. "bg_byggnader_y.5")
          if (A && A.endsWith("." + want)) return true;
          if (B && B.endsWith("." + want)) return true;

          return false;
        });

        return f || null;
      };

      sourceIds.forEach((fromId, i) => {
        const srcFeat = resolveSourceFeature(fromId);
        if (!srcFeat) return;

        const clone = srcFeat.clone();
        const g = clone.getGeometry?.();
        if (g && g.clone) clone.setGeometry(g.clone());

        // Set goal id (temporary negative id that AE needs to replace)
        let toId = createdIds?.[i];
        if (toId == null) {
          // fallback: create a draft in the model if it doesn't exist
          toId = model.addDraftFromFeature(clone);
        }

        const exists =
          featureIndexRef.current.has(toId) || !!src.getFeatureById?.(toId);
        if (exists) return;

        clone.setId?.(toId);
        try {
          clone.set?.("id", toId, true);
        } catch {}

        try {
          const gt = clone.getGeometry?.()?.getType?.() || "Polygon";
          const method =
            gt.replace(/^Multi/, "") === "LinearRing"
              ? "Polygon"
              : gt.replace(/^Multi/, "");
          clone.set?.("USER_DRAWN", true, true);
          clone.set?.("DRAW_METHOD", method, true);
          clone.set?.("EDIT_ACTIVE", false, true);
        } catch {}

        src.addFeature(clone);
        featureIndexRef.current.set(toId, clone);
        graveyardRef.current.delete(toId);
      });

      layer?.changed?.();
    },
    [vectorLayerRef, featureIndexRef, graveyardRef, model]
  );

  const duplicateSelectedRows = useCallback(() => {
    if (!tableSelectedIds.size) return;
    const allIds = [...tableSelectedIds];
    const ids = allIds.filter((id) => !(typeof id === "number" && id < 0));
    if (!ids.length) {
      return;
    }

    const start = state.nextTempId;
    controller.duplicateRows(ids);
    if (typeof start === "number") {
      const created = ids.map((_, i) => start - i);

      // Get the latest state after duplicateRows dispatch
      const currentState = model.getSnapshot();

      // Set baseline for each duplicated draft to its current values
      created.forEach((draftId) => {
        const draft = currentState.pendingAdds?.find?.((d) => d.id === draftId);
        if (draft) {
          const baseline = {};
          fieldMeta.forEach(({ key }) => {
            baseline[key] = draft[key] ?? "";
          });
          draftBaselineRef.current.set(draftId, baseline);
        }
      });

      setTableSelectedIds(new Set(created));
      cloneGeometryForDuplicates(ids, created);
      editBus.emit("attrib:select-ids", {
        ids: created,
        source: "view",
        mode: "replace",
      });
    }
    showNotification(
      `${ids.length} ${ids.length === 1 ? "utkast" : "utkast"} skapade`
    );
  }, [
    tableSelectedIds,
    controller,
    model,
    state.nextTempId,
    fieldMeta,
    draftBaselineRef,
    showNotification,
    cloneGeometryForDuplicates,
  ]);

  const duplicateInForm = React.useCallback(() => {
    const base = selectedIds.size
      ? Array.from(selectedIds)
      : focusedId != null
        ? [focusedId]
        : [];

    const isDraftId = (id) => {
      const n = Number(id);
      return Number.isFinite(n) && n < 0;
    };
    const ids = base.filter((id) => !isDraftId(id));
    if (!ids.length) return;

    const start = state.nextTempId;

    controller.duplicateRows(ids);

    if (typeof start === "number" && ids.length) {
      const created = ids.map((_, i) => start - i);

      // Get the latest state after duplicateRows dispatch
      const currentState = model.getSnapshot();

      // Set baseline for each duplicated draft to its current values
      created.forEach((draftId) => {
        const draft = currentState.pendingAdds?.find?.((d) => d.id === draftId);
        if (draft) {
          const baseline = {};
          fieldMeta.forEach(({ key }) => {
            baseline[key] = draft[key] ?? "";
          });
          draftBaselineRef.current.set(draftId, baseline);
        }
      });

      setSelectedIds(new Set(created));
      setFocusedId(created[0]);
      cloneGeometryForDuplicates(ids, created);
      editBus.emit("attrib:select-ids", {
        ids: created,
        source: "view",
        mode: "replace",
      });
    }

    showNotification(
      `${ids.length} ${ids.length === 1 ? "utkast" : "utkast"} skapade`
    );
  }, [
    selectedIds,
    focusedId,
    controller,
    model,
    state.nextTempId,
    fieldMeta,
    draftBaselineRef,
    showNotification,
    cloneGeometryForDuplicates,
  ]);

  React.useEffect(() => {
    // always: which rows are visible (for dim/visibility-end-filtered)
    visibleIdsRef.current = new Set(
      filteredAndSorted.flatMap((r) => [r.id, String(r.id)])
    );

    // trigger a re-render when the dependent values change
    const tableSel = Array.from(tableSelectedIds);
    const formSel = Array.from(selectedIds);

    const activeSelected =
      ui.mode === "table"
        ? tableSel
        : focusedId != null
          ? [...new Set([...formSel, focusedId])]
          : formSel;

    // Limited to the most recently visible features
    const visibleSelected = activeSelected.filter(
      (id) =>
        visibleIdsRef.current.has(id) || visibleIdsRef.current.has(String(id))
    );

    selectedIdsRef.current = new Set(visibleSelected);

    vectorLayerRef?.current?.changed?.();
  }, [
    allRows,
    filteredAndSorted,
    tableSelectedIds,
    selectedIds,
    focusedId,
    ui.mode,
    vectorLayerRef,
    selectedIdsRef,
    visibleIdsRef,
  ]);

  React.useEffect(() => {
    const off = editBus.on("attrib:toggle-delete-ids", (ev) => {
      const ids = ev?.detail?.ids || [];
      if (!ids.length) return;
      controller.toggleDelete(ids, "toggle");
    });
    return () => off();
  }, [controller]);

  React.useEffect(() => {
    if (ui.mode === "form") {
      // Keep the selection from the table when switching to the form
      if (selectedIds.size === 0 && tableSelectedIds.size > 0) {
        const next = new Set(tableSelectedIds);
        setSelectedIds(next);
        // Focus the first selected item if we lose focus
        if (focusedId == null) {
          const first = [...next][0];
          if (first != null) setFocusedId(first);
        }
      }
    } else if (ui.mode === "table") {
      // Keep the selection from the form when switching to the table
      const fromForm = selectedIds.size
        ? selectedIds
        : focusedId != null
          ? new Set([focusedId])
          : null;

      if (fromForm && tableSelectedIds.size === 0) {
        setTableSelectedIds(new Set(fromForm));
      }
    }
  }, [ui.mode, tableSelectedIds, selectedIds, focusedId]);

  const getUniqueColumnValues = useCallback(
    (columnKey) => {
      // Build a cache key of the data version, search string, and all filters
      // EXCEPT for the current columnKey (so the facet does not cache itself).
      const editsCount = Object.keys(pendingEdits || {}).length;
      const delSize = pendingDeletes?.size ?? 0;

      const filterParts = [];
      for (const [k, vals] of Object.entries(columnFilters || {})) {
        if (k === columnKey) continue;
        filterParts.push(k + "=" + (Array.isArray(vals) ? vals.join(",") : ""));
      }

      // include a signature of the current column values so the cache
      // invalidates whenever any value in this column changes.
      const colValuesSignature = allRows
        .map((r) => String(r?.[columnKey] ?? ""))
        .join("|");

      const cacheKey =
        `facet::${columnKey}::` +
        `${features.length}|${pendingAdds.length}|${editsCount}|${delSize}|` +
        `${colValuesSignature}|` +
        `${searchText.trim().toLowerCase()}|` +
        filterParts.sort().join(";");

      const hit = uniqueCacheRef.current.get(cacheKey);
      if (hit) return hit;

      const q = searchText.trim().toLowerCase();

      // 1) Start with ALL rows (not filteredAndSorted)
      //    and apply the search string …
      const rowsAfterSearch = allRows.filter((r) => {
        if (!q) return true;
        if (tableEditing && tableEditing.id === r.id) return true;
        return Object.values(r).some((val) =>
          String(val ?? "")
            .toLowerCase()
            .includes(q)
        );
      });

      // 2) ...and apply all other column filters (except for the current column)
      const rowsForFacet = rowsAfterSearch.filter((r) => {
        return Object.entries(columnFilters || {}).every(([k, selected]) => {
          if (k === columnKey) return true;
          if (!selected || selected.length === 0) return true;
          const cell = String(r[k] ?? "");
          return selected.includes(cell);
        });
      });

      // 3) Lock in unique values for the current column
      const vals = new Set();
      for (let i = 0; i < rowsForFacet.length; i++) {
        const v = rowsForFacet[i]?.[columnKey];
        const s = String(v ?? "");
        vals.add(s === "" ? "(tom)" : s); // Show "(tom)" empty values
      }

      const out = Array.from(vals).sort((a, b) => {
        // Sort "(tom)" first
        if (a === "(tom)" && b !== "(tom)") return 1;
        if (a !== "(tom)" && b === "(tom)") return -1;
        return a.localeCompare(b, "sv", { numeric: true, sensitivity: "base" });
      });

      uniqueCacheRef.current.set(cacheKey, out);
      return out;
    },
    [
      allRows,
      features.length,
      pendingAdds.length,
      pendingEdits,
      pendingDeletes,
      searchText,
      columnFilters,
      tableEditing,
    ]
  );

  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: "asc" };
    });
  };

  const handleRowClick = useCallback(
    (rowId, rowIndex, evt) => {
      const isToggle = evt.metaKey || evt.ctrlKey;
      const isRange = evt.shiftKey;

      let next = new Set(tableSelectedIds);
      let newLast = rowIndex;

      if (isRange && lastTableIndex !== null) {
        const [a, b] = [lastTableIndex, rowIndex].sort((x, y) => x - y);
        next = new Set();
        for (let i = a; i <= b; i++) next.add(filteredAndSorted[i].id);
      } else if (isToggle) {
        next.has(rowId) ? next.delete(rowId) : next.add(rowId);
      } else {
        next = new Set([rowId]);
      }

      setLastTableIndex(newLast);

      editBus.emit("attrib:select-ids", {
        ids: Array.from(next),
        source: "view",
        mode: isRange || isToggle ? "toggle" : "replace",
      });
    },
    [tableSelectedIds, lastTableIndex, filteredAndSorted]
  );

  // === Form ===
  const [editValues, setEditValues] = useState({});
  const [originalValues, setOriginalValues] = useState({});
  const [changedFields, setChangedFields] = useState(new Set());
  const [dirty, setDirty] = useState(false);
  const [formUndoStack, setFormUndoStack] = useState([]); // [{key, prevValue, when}]

  const hasUnsaved = React.useMemo(() => {
    const pendingCount =
      (pendingAdds?.length ?? 0) +
      (pendingDeletes?.size ?? 0) +
      (pendingEdits ? Object.keys(pendingEdits).length : 0);
    return dirty || pendingCount > 0;
  }, [dirty, pendingAdds, pendingEdits, pendingDeletes]);

  const unsavedSummary = React.useMemo(
    () => ({
      adds: pendingAdds?.length ?? 0,
      edits:
        (pendingEdits ? Object.keys(pendingEdits).length : 0) +
        (dirty ? changedFields.size : 0),
      deletes: pendingDeletes?.size ?? 0,
    }),
    [pendingAdds, pendingEdits, pendingDeletes, dirty, changedFields]
  );

  // The variable that was changed, emit
  const lastHasUnsavedRef = React.useRef(hasUnsaved);
  React.useEffect(() => {
    if (hasUnsaved !== lastHasUnsavedRef.current) {
      editBus.emit("edit:unsaved-state", {
        source: "attribute-editor",
        hasUnsaved,
        summary: unsavedSummary,
      });
      lastHasUnsavedRef.current = hasUnsaved;
    }
  }, [hasUnsaved, unsavedSummary]);

  const commitTableEdits = useCallback(async () => {
    try {
      const layerCRS = model.getLayerProjection();

      // Helper: Get geometry from OpenLayers feature
      const getGeometryForFeature = (id) => {
        const feature = featureIndexRef.current.get(id);
        if (!feature) {
          return null;
        }

        const geom = feature.getGeometry?.();
        if (!geom) {
          return null;
        }

        // Transform geometry from map projection to layer's native CRS
        const format = new GeoJSON();
        const geojsonFeature = format.writeFeatureObject(feature, {
          featureProjection: map.getView().getProjection(),
          dataProjection: layerCRS,
        });

        return geojsonFeature.geometry;
      };

      // Helper: Check if geometry has changed
      const hasGeometryChanged = (id) => {
        const effective = features.find((f) => String(f.id) === String(id));
        if (!effective) {
          return false;
        }
        const patch = pendingEdits[id];
        const changed =
          patch && patch.__geom__ !== undefined && patch.__geom__ !== null;
        return changed;
      };

      // 1. Build INSERT operations
      const inserts = pendingAdds
        .filter((d) => {
          const keep = d.__pending !== "delete";
          return keep;
        })
        .map((draft) => {
          const properties = {};
          FM.forEach(({ key, readOnly }) => {
            if (key !== "id" && !readOnly) {
              properties[key] = draft[key] ?? null;
            }
          });

          const geometry = getGeometryForFeature(draft.id);

          return {
            properties,
            geometry,
          };
        })
        .filter((f) => {
          const keep = f.geometry !== null;
          return keep;
        });

      // 2. Build UPDATE operations
      const updates = Object.entries(pendingEdits)
        .filter(([id]) => {
          const notDeleted =
            !pendingDeletes.has(Number(id)) && !pendingDeletes.has(String(id));
          return notDeleted;
        })
        .map(([id, changes]) => {
          // Remove internal fields
          const { __geom__, __pending, __idx, ...properties } = changes;

          // Handle qualified FID (layer.123)
          let cleanId = String(id);
          const fidMatch = cleanId.match(/\.(\d+)$/);
          if (fidMatch) {
            cleanId = fidMatch[1];
          }

          const update = {
            id: cleanId,
            properties,
          };

          // Add geometry if changed
          const geomChanged = hasGeometryChanged(id);
          if (geomChanged) {
            const geom = getGeometryForFeature(id);
            if (geom) {
              update.geometry = geom;
            }
          }

          return update;
        })
        .filter((u) => {
          const keep = Object.keys(u.properties).length > 0 || u.geometry;
          return keep;
        });

      // 3. Build DELETE operations
      const deletes = Array.from(pendingDeletes)
        .filter((id) => {
          // Accept both numeric IDs and qualified FIDs (layer.123)
          if (typeof id === "number" && id > 0) {
            return true;
          }

          // Check if it's a qualified FID string (layer.123)
          const str = String(id);
          const isFid = /\.\d+$/.test(str); // Ends with .NUMBER
          return isFid;
        })
        .map((id) => {
          let cleanId = String(id);
          const fidMatch = cleanId.match(/\.(\d+)$/);
          if (fidMatch) {
            cleanId = fidMatch[1];
          }
          return cleanId;
        });

      // Count deleted drafts (these don't go to server but need to be cleaned up)
      const deletedDraftsCount = pendingAdds.filter(
        (d) => d.__pending === "delete"
      ).length;

      // Check if there are any changes (including deleted drafts)
      if (
        !inserts.length &&
        !updates.length &&
        !deletes.length &&
        !deletedDraftsCount
      ) {
        showNotification("Inga ändringar att spara");
        return;
      }

      // Build summary for user notification
      const totalDeletes = deletes.length + deletedDraftsCount;
      const summary = [
        inserts.length && `${inserts.length} nya`,
        updates.length && `${updates.length} uppdaterade`,
        totalDeletes && `${totalDeletes} borttagna`,
      ]
        .filter(Boolean)
        .join(", ");

      // If only deleted drafts (no server operations), just commit locally
      if (!inserts.length && !updates.length && !deletes.length) {
        enqueueSnackbar(`✓ Sparat: ${deletedDraftsCount} borttagna`, {
          variant: "success",
          autoHideDuration: 3000,
        });

        // Commit changes in model (removes deleted drafts from pendingAdds)
        controller.commit();

        // Reset undo stacks
        Promise.resolve().then(() => {
          formUndoSnapshotsRef.current.clear();
          setFormUndoStack([]);
          setTableUndoLocal([]);
          setTableEditing(null);
          setLastTableIndex(null);
          geomUndoRef.current = [];
          setGeomUndoCount(0);
        });

        return;
      }

      enqueueSnackbar(`Sparar: ${summary}...`, { variant: "info" });

      // Send transaction to backend
      const result = await ogc.commitWfstTransaction(serviceId, {
        inserts,
        updates,
        deletes,
        srsName: layerCRS,
      });

      if (result.success) {
        // Clear browser caches
        if ("caches" in window) {
          try {
            const names = await caches.keys();
            await Promise.all(names.map((name) => caches.delete(name)));
          } catch (e) {}
        }

        // Check for partial failures
        const hasPartialFailure =
          result.partialFailures && result.partialFailures.length > 0;

        if (hasPartialFailure) {
          const totalDeletedCount = (result.deleted || 0) + deletedDraftsCount;
          let message = `⚠ Delvis sparat: ${result.inserted || 0} nya, ${result.updated || 0} uppdaterade, ${totalDeletedCount} borttagna\n`;
          message += `Misslyckades: ${result.partialFailures.join(", ")}`;

          if (result.warning) {
            message += `\n\nServermeddelande: ${result.warning}`;
          }

          enqueueSnackbar(message, {
            variant: "warning",
            autoHideDuration: 10000,
            style: { whiteSpace: "pre-line" },
          });
        } else {
          const totalDeletedCount = (result.deleted || 0) + deletedDraftsCount;
          enqueueSnackbar(
            `✓ Sparat: ${result.inserted || 0} nya, ${result.updated || 0} uppdaterade, ${totalDeletedCount} borttagna`,
            { variant: "success", autoHideDuration: 5000 }
          );
        }

        // Commit changes in model
        controller.commit();

        // Clear geometry change markers
        const allIds = [
          ...new Set([
            ...features.map((f) => f.id),
            ...pendingAdds.map((d) => d.id),
          ]),
        ];
        controller.batchEdit(
          allIds.map((id) => ({ id, key: "__geom__", value: null }))
        );

        // Reset undo stacks
        Promise.resolve().then(() => {
          formUndoSnapshotsRef.current.clear();
          setFormUndoStack([]);
          setTableUndoLocal([]);
          setTableEditing(null);
          setLastTableIndex(null);
          geomUndoRef.current = [];
          setGeomUndoCount(0);
        });

        // Reload features from server
        try {
          const reloadId = `reload_${Date.now()}_${Math.random().toString(36).substring(7)}`;

          const { featureCollection } = await model.loadFromService(serviceId, {
            _reload: reloadId,
            _nocache: "1",
            _bust: Date.now(),
          });

          // Update vector layer with new features
          if (vectorLayerRef.current && featureCollection) {
            const mapProj = map.getView().getProjection();
            const mapProjCode = mapProj.getCode();

            const fmt = new GeoJSON();
            const newFeatures = fmt.readFeatures(featureCollection, {
              dataProjection: mapProjCode,
              featureProjection: mapProj,
            });

            const source = vectorLayerRef.current.getSource();
            source.clear();
            // Emit event to clean up kink markers after clearing source
            editBus.emit("sketch:source-cleared", {});
            source.addFeatures(newFeatures);

            // Rebuild feature index
            featureIndexRef.current.clear();
            visibleIdsRef.current = new Set();

            newFeatures.forEach((f) => {
              const raw = f.get?.("id") ?? f.get?.("@_fid") ?? f.getId?.();
              const aliases = idAliases(raw);
              aliases.forEach((k) => featureIndexRef.current.set(k, f));
              aliases.forEach((k) => {
                visibleIdsRef.current.add(k);
                visibleIdsRef.current.add(String(k));
              });
            });

            // Set feature IDs from FID property
            newFeatures.forEach((f) => {
              const fidProp = f.get?.("@_fid");
              if (fidProp) {
                try {
                  f.setId?.(fidProp);
                } catch {}
              }
            });

            vectorLayerRef.current.changed();
          }

          // Restore selection
          if (result.insertedIds && result.insertedIds.length > 0) {
            const newIds = result.insertedIds.map((fid) => {
              const match = fid.match(/\.(\d+)$/);
              return match ? Number(match[1]) : fid;
            });
            setTableSelectedIds(new Set(newIds));
            setSelectedIds(new Set(newIds));
            if (newIds.length > 0) setFocusedId(newIds[0]);
          } else if (updates.length > 0) {
            const updatedIds = updates.map((u) => {
              const numId = Number(u.id);
              return Number.isFinite(numId) ? numId : u.id;
            });
            setTableSelectedIds(new Set(updatedIds));
            setSelectedIds(new Set(updatedIds));
          }
        } catch (reloadError) {
          enqueueSnackbar("Data sparades! Tryck F5 för att se ändringarna.", {
            variant: "warning",
            autoHideDuration: 10000,
          });
        }
      } else {
        throw new Error(result.message || "Transaction failed");
      }
    } catch (error) {
      enqueueSnackbar(`Fel vid sparande: ${error.message || "Okänt fel"}`, {
        variant: "error",
        autoHideDuration: 8000,
      });
    }
  }, [
    controller,
    features,
    pendingAdds,
    pendingEdits,
    pendingDeletes,
    FM,
    featureIndexRef,
    map,
    ogc,
    serviceId,
    model,
    showNotification,
    enqueueSnackbar,
    vectorLayerRef,
    visibleIdsRef,
  ]);

  const exportToExcel = useCallback(
    async (exportFeatures) => {
      try {
        const xlsx = await import("xlsx");

        // Filter out geometry fields and prepare headers
        const exportHeaders = FM.filter((meta) => meta.type !== "geometry").map(
          (meta) => meta.label
        );

        // Prepare data rows
        const exportData = exportFeatures.map((feature) => {
          return FM.filter((meta) => meta.type !== "geometry").map((meta) => {
            const value = feature[meta.key];
            return value != null ? String(value) : "";
          });
        });

        // Combine headers and data
        const exportArray = [exportHeaders, ...exportData];

        // Create worksheet and workbook
        const worksheet = xlsx.utils.aoa_to_sheet(exportArray);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(
          workbook,
          worksheet,
          "Attributlista".slice(0, 30)
        );

        // Generate filename with timestamp
        const timestamp = new Date().toLocaleString("sv-SE");
        const filename = `Attributlista-${timestamp}.xlsx`;

        // Write file
        xlsx.writeFile(workbook, filename);

        enqueueSnackbar(`✓ Excel-fil skapad (${exportFeatures.length} rader)`, {
          variant: "success",
          autoHideDuration: 5000,
        });
      } catch (error) {
        enqueueSnackbar(
          `Fel vid Excel-export: ${error.message || "Okänt fel"}`,
          {
            variant: "error",
            autoHideDuration: 8000,
          }
        );
      }
    },
    [FM, enqueueSnackbar]
  );

  const undoLatestTableChange = useCallback(() => {
    // Pop the latest entry from the respective stack
    const modelLast = state.undoStack?.[state.undoStack.length - 1] ?? null;
    const tableLast = tableUndoLocal[tableUndoLocal.length - 1] ?? null;
    const formLast = formUndoStack[formUndoStack.length - 1] ?? null;
    const geomLast =
      geomUndoRef.current[geomUndoRef.current.length - 1] ?? null;

    const tModel = modelLast?.when ?? -Infinity;
    const tTable = tableLast?.when ?? -Infinity;
    const tForm = formLast?.when ?? -Infinity;
    const tGeom = geomLast?.when ?? -Infinity;

    // 1) FORM UNDO: restore the same group (same timestamp)
    if (tForm >= tTable && tForm >= tModel && tForm >= tGeom && formLast) {
      // Get the count of entries that share the same "when" timestamp
      let k = 0;
      for (let i = formUndoStack.length - 1; i >= 0; i--) {
        if ((formUndoStack[i]?.when ?? -1) !== tForm) break;
        k++;
      }
      const group = formUndoStack.slice(-k);

      // Restore all affected rows in the model
      const ops = [];
      group.forEach(({ id, snapshot }) => {
        FM.forEach(({ key }) => {
          const v = snapshot[key];
          ops.push({ id, key, value: normalizeForCommit(key, v, FM) });
        });
      });
      if (ops.length) controller.batchEdit(ops);

      // If the focused row was found with: updated formula fields/dirty
      const hit = group.find((g) => g.id === focusedId);
      if (hit?.snapshot) {
        const snap = hit.snapshot;
        setEditValues({ ...snap });

        const nextChanged = new Set();
        FM.forEach(({ key }) => {
          if ((snap[key] ?? "") !== (originalValues[key] ?? "")) {
            nextChanged.add(key);
          }
        });
        setChangedFields(nextChanged);
        setDirty(nextChanged.size > 0);
      }

      // Remove the group and clean up the snapshots-ref
      setFormUndoStack((prev) => prev.slice(0, prev.length - k));
      group.forEach(({ id }) => formUndoSnapshotsRef.current.delete(id));

      showNotification(
        k > 1 ? `Ångrade formulärändringar (${k})` : "Ångrade formulärändring"
      );
      return;
    }

    // 2) TABLE UNDO: e.g. a cell edit in the table view
    if (tTable >= tModel && tTable >= tGeom && tableLast) {
      if (tableLast.type === "edit_cell") {
        let currentVal;
        const p = pendingEdits[tableLast.id];
        if (p && tableLast.key in p) currentVal = p[tableLast.key];
        else {
          const draft = pendingAdds?.find?.((d) => d.id === tableLast.id);
          if (draft) currentVal = draft[tableLast.key];
          else
            currentVal = features.find((f) => f.id === tableLast.id)?.[
              tableLast.key
            ];
        }
        controller.batchEdit([
          { id: tableLast.id, key: tableLast.key, value: tableLast.prevValue },
        ]);
        setTableUndoLocal((prev) => prev.slice(0, -1));
        showNotification("Ångrade celländring");
        syncColumnFilterOnValueChange(
          tableLast.key,
          currentVal, // from
          tableLast.prevValue, // to
          tableLast.id
        );
      } else {
        // other local table action – remove the post
        setTableUndoLocal((prev) => prev.slice(0, -1));
      }
      return;
    }

    // 3) GEOMETRY UNDO: restore geometry and remove highlight
    if (tGeom >= tModel && geomLast) {
      const { id, before } = geomLast;
      if (before) {
        // Restore geometry in OL layer
        setGeometryById(id, before);

        // Trigger validation for the restored geometry
        // Use a separate event to avoid interfering with undo logic
        editBus.emit("sketch:validate-geometry", { id });

        // Remove this entry from the stack
        geomUndoRef.current.pop();
        setGeomUndoCount((c) => Math.max(0, c - 1));

        // Check if there are MORE geometry edits for this same feature still in the stack
        const hasMoreGeomEdits = geomUndoRef.current.some(
          (entry) => entry.id === id
        );

        // Only clear the __geom__ marker if no more geometry edits remain for this feature
        if (!hasMoreGeomEdits) {
          controller.batchEdit([{ id, key: "__geom__", value: null }]);
        }
      }

      showNotification("Ångrade geometriändring");
      return;
    }

    // 4) Fallback to model's own undo
    if (modelLast) {
      controller.undo();
    }
  }, [
    state.undoStack,
    tableUndoLocal,
    formUndoStack,
    FM,
    controller,
    focusedId,
    originalValues,
    setEditValues,
    setChangedFields,
    setDirty,
    showNotification,
    setGeometryById,
    features,
    pendingAdds,
    pendingEdits,
    syncColumnFilterOnValueChange,
  ]);

  function normalizeForCommit(key, value, FM) {
    if (value === "") {
      const t = FM.find((m) => m.key === key)?.type;
      if (t === "date" || t === "textarea") return null;
    }
    return value;
  }

  const handleBeforeChangeFocus = useCallback(
    (targetId) => {
      const prevId = focusedId;
      if (dirty && prevId != null) {
        setChangedFields(new Set());
        setDirty(false);
      }
      setFocusedId(targetId);
    },
    [focusedId, dirty]
  );

  const focusedFeature = useMemo(() => {
    if (focusedId == null) return null;
    if (focusedId < 0) {
      return pendingAdds.find((d) => d.id === focusedId) || null;
    }
    const base = features.find((f) => f.id === focusedId);
    if (!base) return null;
    return { ...base, ...(pendingEdits[focusedId] || {}) };
  }, [focusedId, features, pendingAdds, pendingEdits]);

  useEffect(() => {
    if (!focusedId) {
      setEditValues({});
      setOriginalValues({});
      setChangedFields(new Set());
      setDirty(false);
      return;
    }

    // Draft (negative id)
    if (focusedId < 0) {
      const draft = pendingAdds.find((d) => d.id === focusedId);
      if (!draft) return;

      // Use existing baseline (created when draft was added)
      let baseline = draftBaselineRef.current.get(focusedId);
      if (!baseline) {
        // Fallback: create empty baseline if somehow missing
        baseline = {};
        FM.forEach(({ key }) => (baseline[key] = ""));
        draftBaselineRef.current.set(focusedId, baseline);
      }
      setOriginalValues(baseline);

      const effective = {};
      FM.forEach(({ key }) => (effective[key] = normalize(draft[key])));
      setEditValues(effective);

      const changed = new Set();
      FM.forEach(({ key }) => {
        if ((effective[key] ?? "") !== (baseline[key] ?? "")) changed.add(key);
      });
      setChangedFields(changed);
      setDirty(changed.size > 0);
      return;
    }

    const feat = features.find((f) => f.id === focusedId);
    if (!feat) return;

    const base = {};
    const effective = {};
    const patch = pendingEdits[focusedId] || {};

    FM.forEach(({ key }) => {
      const baseVal = normalize(feat[key]);
      base[key] = baseVal;
      effective[key] = key in patch ? normalize(patch[key]) : baseVal;
    });

    setOriginalValues(base);
    setEditValues(effective);

    const changed = new Set();
    FM.forEach(({ key }) => {
      if ((effective[key] ?? "") !== (base[key] ?? "")) changed.add(key);
    });
    setChangedFields(changed);
    setDirty(false);
  }, [focusedId, FM, features, pendingEdits, pendingAdds, draftBaselineRef]);

  // EXTERNAL SYNCH FOR DRAFTS: when pendingAdds changes, immediately update editValues + changedFields (using originalValues)
  useEffect(() => {
    if (!focusedId || focusedId >= 0) return;
    const draft = pendingAdds.find((d) => d.id === focusedId);
    if (!draft) return;
    const effective = {};
    FM.forEach(({ key }) => (effective[key] = normalize(draft[key])));
    setEditValues(effective);
    const baseline = draftBaselineRef.current.get(focusedId) || originalValues;
    const changed = new Set();
    FM.forEach(({ key }) => {
      if ((effective[key] ?? "") !== (baseline[key] ?? "")) changed.add(key);
    });
    setChangedFields(changed);
    setDirty(changed.size > 0);
  }, [pendingAdds, focusedId, FM, originalValues, draftBaselineRef]);

  // Track which draft IDs were in pendingAdds previously
  const previousPendingAddsRef = React.useRef(new Set());

  // CLEAN UP: remove baseline when a draft is saved (commit/undo/remove etc.)
  useEffect(() => {
    const existingDraftIds = new Set(pendingAdds.map((d) => d.id));
    for (const id of draftBaselineRef.current.keys()) {
      if (id < 0 && !existingDraftIds.has(id)) {
        draftBaselineRef.current.delete(id);
      }
    }

    // Find IDs that were removed from pendingAdds
    const removedIds = [];
    for (const prevId of previousPendingAddsRef.current) {
      if (!existingDraftIds.has(prevId)) {
        removedIds.push(prevId);
      }
    }

    // Remove OL features for IDs that were removed from pendingAdds
    if (removedIds.length > 0) {
      const layer = vectorLayerRef?.current;
      const src = layer?.getSource?.();
      if (src) {
        removedIds.forEach((fid) => {
          // Find and remove the feature
          const feature =
            src.getFeatureById?.(fid) ||
            src.getFeatures().find((f) => {
              const id = f.getId?.() ?? f.get?.("@_fid") ?? f.get?.("id");
              return id === fid;
            });

          if (feature) {
            src.removeFeature(feature);
            featureIndexRef.current.delete(fid);
            // Emit event to clean up kink markers for this feature
            editBus.emit("sketch:feature-removed", { id: fid });
          }
        });
      }
    }

    // Update previousPendingAddsRef for next time
    previousPendingAddsRef.current = existingDraftIds;
  }, [pendingAdds, draftBaselineRef, vectorLayerRef, featureIndexRef]);

  function normalize(v) {
    return v == null ? "" : v;
  }

  function selectAllVisible() {
    const ids = visibleFormList.map((f) => f.id);
    setSelectedIds(new Set(ids));
    if (!focusedId && ids.length) setFocusedId(ids[0]);
  }
  function clearSelection() {
    explicitClearRef.current = true;
    setSelectedIds(new Set());

    editBus.emit("attrib:select-ids", {
      ids: [],
      source: "view",
      mode: "clear",
    });
  }

  const visibleFormList = useMemo(() => {
    const sTerm = searchText.trim().toLowerCase();
    const existing = features.map((f, idx) => {
      let r = { ...f, ...(pendingEdits[f.id] || {}), __idx: idx };
      if (pendingDeletes?.has?.(f.id)) r = { ...r, __pending: "delete" };
      return r;
    });
    const startIdx = existing.length;
    const drafts = pendingAdds.map((d, i) => ({ ...d, __idx: startIdx + i }));

    const all = [...existing, ...drafts];
    const fmKeys = FM.map((m) => m.key);
    const keys = fmKeys.includes("id") ? fmKeys : ["id", ...fmKeys];

    const filtered = all.filter((row) => {
      // Always show negative IDs (i.e. drafts)
      const isNegativeId = typeof row.id === "number" && row.id < 0;

      // If "Select first" is active, use the FIRST ID
      if (showOnlySelected && !isNegativeId && !frozenSelectedIds.has(row.id)) {
        return false;
      }

      // Match search text
      const matchesSearch =
        !sTerm ||
        keys.some((k) => {
          const v = row?.[k];
          return v != null && String(v).toLowerCase().includes(sTerm);
        });

      // Match column filters (same logic as in filteredAndSorted)
      const matchesColumnFilters = Object.entries(columnFilters || {}).every(
        ([key, selectedValues]) => {
          if (!selectedValues || selectedValues.length === 0) return true;
          const cellValue = String(row[key] ?? "");

          // Convert "(tom)" in filter back to "" for comparison
          const normalizedSelected = selectedValues.map((v) =>
            v === "(tom)" ? "" : v
          );

          return normalizedSelected.includes(cellValue);
        }
      );

      return matchesSearch && matchesColumnFilters;
    });

    filtered.sort((a, b) => {
      // Drafts (negative IDs) stay in "new items" section, even if marked for deletion
      const ap = a.id < 0 ? 0 : a.__pending === "add" ? 0 : 1;
      const bp = b.id < 0 ? 0 : b.__pending === "add" ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.__idx - b.__idx;
    });

    return filtered;
  }, [
    features,
    pendingEdits,
    pendingAdds,
    pendingDeletes,
    searchText,
    FM,
    showOnlySelected,
    frozenSelectedIds,
    columnFilters,
  ]);

  React.useEffect(() => {
    anchorRef.current = { id: null, index: null };
  }, [ui.mode, serviceId, visibleFormList]);

  const ensureFormSelectionDeps = React.useMemo(
    () => ({
      mode: ui.mode,
      focusedId,
      focusedIdValid:
        focusedId != null && visibleFormList.some((f) => f.id === focusedId),
      selectedIdsValid:
        selectedIds.size > 0 &&
        Array.from(selectedIds).some((id) =>
          visibleFormList.some((f) => f.id === id)
        ),
      firstVisibleId: visibleFormList[0]?.id ?? null,
      explicitClear: explicitClearRef.current,
    }),
    [ui.mode, focusedId, selectedIds, visibleFormList]
  );

  const ensureFormSelection = React.useCallback(() => {
    const { mode, focusedIdValid, selectedIdsValid, firstVisibleId } =
      ensureFormSelectionDeps;

    if (mode !== "form") return;

    // If user explicitly cleared the selection, do nothing
    if (explicitClearRef) return;

    // If both focus and selection are valid, do nothing
    if (focusedIdValid && selectedIdsValid) return;

    // Select first visible row as fallback
    if (firstVisibleId != null) {
      setSelectedIds(new Set([firstVisibleId]));
      setFocusedId(firstVisibleId);
    }
  }, [ensureFormSelectionDeps]); // Only depends on the memoized object

  React.useLayoutEffect(() => {
    ensureFormSelection();
  }, [ensureFormSelection]);

  const onFormRowClick = useCallback(
    (rowId, rowIndex, evt) => {
      explicitClearRef.current = false;
      const isShift = evt.shiftKey;
      const isToggle = evt.metaKey || evt.ctrlKey || evt.altKey; // Alt = toggle only

      // Ensure valid rowIndex (in case it's missing):
      let idx = rowIndex;
      if (idx == null || idx < 0) {
        idx = visibleFormList.findIndex((f) => f.id === rowId);
      }

      setSelectedIds((prev) => {
        let next = new Set(prev);

        if (isShift) {
          let anchorIdx = anchorRef.current.index;
          if (anchorIdx == null || anchorIdx < 0) {
            const focusIdx = visibleFormList.findIndex(
              (f) => f.id === focusedId
            );
            anchorIdx = focusIdx >= 0 ? focusIdx : idx;
          }

          const [a, b] = [anchorIdx, idx].sort((x, y) => x - y);
          next = new Set();
          for (let i = a; i <= b; i++) next.add(visibleFormList[i].id);

          // Don't change focus (keep the current one), but
          // if the current focus is no longer valid and there is a value, jump to rowId:
          const focusStillVisible = visibleFormList.some(
            (f) => f.id === focusedId
          );
          if (!focusStillVisible && next.size) {
            handleBeforeChangeFocus(rowId);
          }
        }

        // ---- TOGGLE (Alt/Ctrl/Cmd) ------------------------------------
        else if (isToggle) {
          next.has(rowId) ? next.delete(rowId) : next.add(rowId);

          if (rowId === focusedId && !next.has(rowId) && next.size > 0) {
            const vis = visibleFormList.map((f) => f.id);
            let candidate = null;
            for (let i = idx + 1; i < vis.length; i++)
              if (next.has(vis[i])) {
                candidate = vis[i];
                break;
              }
            if (candidate == null)
              for (let i = idx - 1; i >= 0; i--)
                if (next.has(vis[i])) {
                  candidate = vis[i];
                  break;
                }
            if (candidate != null && candidate !== focusedId)
              handleBeforeChangeFocus(candidate);
          }
          // Note: update the anchor index on toggle
        } else {
          next = new Set([rowId]);
          if (focusedId !== rowId) handleBeforeChangeFocus(rowId);
          // Update the anchor
          anchorRef.current = { id: rowId, index: idx };
        }

        editBus.emit("attrib:select-ids", {
          ids: Array.from(next),
          source: "view",
          mode: "replace",
        });

        return next;
      });
    },
    [visibleFormList, focusedId, handleBeforeChangeFocus]
  );

  function scrollToRow(id) {
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-row-id="${id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function focusPrev() {
    const order = visibleFormList.map((f) => f.id);
    if (order.length === 0) return;

    if (focusedId == null) {
      const lastId = order[order.length - 1];
      setFocusedId(lastId);
      setSelectedIds(new Set([lastId]));
      scrollToRow(lastId);
      return;
    }

    const idx = order.indexOf(focusedId);
    if (idx > 0) {
      const newId = order[idx - 1];
      setFocusedId(newId);
      setSelectedIds(new Set([newId]));
      scrollToRow(newId);
    }
  }

  function focusNext() {
    const order = visibleFormList.map((f) => f.id);
    if (order.length === 0) return;

    if (focusedId == null) {
      const firstId = order[0];
      setFocusedId(firstId);
      setSelectedIds(new Set([firstId]));
      scrollToRow(firstId);
      return;
    }

    const idx = order.indexOf(focusedId);
    if (idx > -1 && idx < order.length - 1) {
      const newId = order[idx + 1];
      setFocusedId(newId);
      setSelectedIds(new Set([newId]));
      scrollToRow(newId);
    }
  }

  function handleFieldChange(key, value) {
    const now = Date.now();
    const norm = value ?? "";

    setEditValues((prev) =>
      prev[key] === norm ? prev : { ...prev, [key]: norm }
    );

    setChangedFields((prev) => {
      const next = new Set(prev);
      const baseValue = originalValues[key] ?? "";
      norm !== baseValue ? next.add(key) : next.delete(key);
      setDirty(next.size > 0);
      return next;
    });

    let ids;
    if (selectedIds.size > 1) {
      ids = Array.from(selectedIds);
    } else if (focusedId != null) {
      ids = [focusedId];
    } else {
      ids = [];
    }
    if (!ids.length) return;

    const snapshotsToPush = [];
    ids.forEach((id) => {
      if (!formUndoSnapshotsRef.current.has(id)) {
        let effective;
        if (id < 0) {
          const d = pendingAdds.find((x) => x.id === id) || {};
          effective = { ...d };
        } else {
          const base = features.find((f) => f.id === id) || {};
          const patch = pendingEdits[id] || {};
          effective = { ...base, ...patch };
        }
        const snap = {};
        FM.forEach(({ key: k }) => (snap[k] = effective[k] ?? ""));
        formUndoSnapshotsRef.current.set(id, snap);
        snapshotsToPush.push({ id, snapshot: snap, when: now });
      }
    });
    if (snapshotsToPush.length) {
      setFormUndoStack((prev) => [...prev, ...snapshotsToPush]);
    }

    const ops = [];
    ids.forEach((id) => {
      const lk = `${id}::${key}`;
      const last = lastSentRef.current.get(lk);
      if (last !== norm) {
        lastSentRef.current.set(lk, norm);
        ops.push({ id, key, value: norm });
      }
    });
    if (ops.length) debouncedBatchEdit(ops);
  }

  function saveChanges(opts = {}) {
    if (!focusedFeature) return;
    const override = opts.targetIds;

    const idsToUpdate =
      (override && override.length ? override : null) ??
      (selectedIds.size > 1
        ? Array.from(selectedIds)
        : focusedFeature
          ? [focusedFeature.id]
          : []);

    if (!idsToUpdate.length) return;

    const keys = FM.map((f) => f.key);
    const ops = [];
    idsToUpdate.forEach((id) => {
      keys.forEach((k) => {
        if (!changedFields.has(k) && id !== focusedId) return;
        const newVal = normalizeForCommit(k, editValues[k], FM);
        ops.push({ id, key: k, value: newVal });
      });
    });

    if (ops.length) controller.batchEdit(ops);
    const clearIds =
      opts.targetIds && opts.targetIds.length
        ? opts.targetIds
        : selectedIds.size > 0
          ? Array.from(selectedIds)
          : focusedFeature
            ? [focusedFeature.id]
            : [];
    if (clearIds.length) {
      controller.batchEdit(
        clearIds.map((id) => ({ id, key: "__geom__", value: null }))
      );
    }
    setChangedFields(new Set());
    setDirty(false);
    setFormUndoStack([]);
    showNotification(
      idsToUpdate.length > 1
        ? `Ändringar buffrade för ${idsToUpdate.length} objekt`
        : "Ändringar buffrade"
    );
    formUndoSnapshotsRef.current.clear();
  }

  function resetEdits() {
    if (!focusedFeature) return;
    setEditValues({ ...originalValues });
    setChangedFields(new Set());
    setDirty(false);
  }

  const undoLatestFormChange = undoLatestTableChange;

  function openInFormFromTable(rowId) {
    controller.setMode("form");
    setSelectedIds(new Set([rowId]));
    setFocusedId(rowId);
  }

  function openSelectedInFormFromTable() {
    if (tableSelectedIds.size === 0) return;
    controller.setMode("form");

    const selected = new Set(tableSelectedIds);
    setSelectedIds(selected);

    const first =
      filteredAndSorted.find((r) => selected.has(r.id))?.id ??
      Array.from(selected)[0];
    setFocusedId(first);
  }

  const combinedUndoStack = tableUndoLocal.length
    ? tableUndoLocal
    : tableUndoStack;
  const canUndo = Boolean(
    tableUndoLocal?.length ||
      0 ||
      tableUndoStack?.length ||
      0 ||
      formUndoStack?.length ||
      0 ||
      geomUndoCount > 0 ||
      dirty
  );

  const hasGeomUndo = geomUndoCount > 0;

  const [columnFilterUI, setColumnFilterUI] = useState({});

  return (
    <div style={s.shell}>
      <Toolbar
        s={s}
        isMobile={isMobile}
        mode={ui.mode}
        setMode={controller.setMode}
        dark={ui.dark}
        title={ui.title}
        color={ui.color}
        setDark={controller.setDark}
        features={features}
        filteredAndSorted={filteredAndSorted}
        tableSelectedIds={tableSelectedIds}
        selectedIds={selectedIds}
        selectAllVisible={selectAllVisible}
        clearSelection={clearSelection}
        setPluginSettings={setPluginSettings}
        dirty={dirty}
        saveChanges={saveChanges}
        lastEditTargetIdsRef={lastEditTargetIdsRef}
        commitTableEdits={commitTableEdits}
        tablePendingAdds={pendingAdds}
        tablePendingEdits={pendingEdits}
        tablePendingDeletes={pendingDeletes}
        changedFields={changedFields}
        ogc={ogc}
        serviceList={serviceList}
        showOnlySelected={showOnlySelected}
        setShowOnlySelected={setShowOnlySelected}
        frozenSelectedIds={frozenSelectedIds}
        setFrozenSelectedIds={setFrozenSelectedIds}
        searchText={searchText}
        setSearchText={setSearchText}
        map={map}
        enqueueSnackbar={enqueueSnackbar}
      />

      {serviceId === "NONE_ID" ? (
        <div style={s.paneWrap}>
          <div style={{ ...s.pane, gridColumn: "1 / -1" }}>
            <div style={s.formEmpty}>Inget redigeringsbart lager vald.</div>
          </div>
        </div>
      ) : ui.mode === "table" ? (
        <TableMode
          s={s}
          theme={theme}
          FIELD_META={FM}
          isMobile={isMobile}
          features={features}
          filteredAndSorted={filteredAndSorted}
          tableSelectedIds={tableSelectedIds}
          tableHasPending={tableHasPending}
          duplicateSelectedRows={duplicateSelectedRows}
          openSelectedInFormFromTable={openSelectedInFormFromTable}
          commitTableEdits={commitTableEdits}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          openFilterColumn={openFilterColumn}
          setOpenFilterColumn={setOpenFilterColumn}
          getUniqueColumnValues={getUniqueColumnValues}
          toggleSort={toggleSort}
          sort={sort}
          tableEditing={tableEditing}
          setTableEditing={setTableEditing}
          tablePendingEdits={pendingEdits}
          setTablePendingEdits={setTablePendingEdits}
          setTablePendingAdds={setTablePendingAdds}
          isEditableField={isEditableField}
          isMissingValue={isMissingValue}
          handleRowClick={handleRowClick}
          openInFormFromTable={openInFormFromTable}
          firstColumnRef={firstColumnRef}
          filterOverlayRef={filterOverlayRef}
          setDeleteState={setDeleteState}
          tablePendingDeletes={pendingDeletes}
          pushTableUndo={pushTableUndo}
          tableUndoStack={combinedUndoStack}
          formUndoStack={formUndoStack}
          canUndo={canUndo}
          undoLatestTableChange={undoLatestTableChange}
          tablePendingAdds={pendingAdds}
          columnFilterUI={columnFilterUI}
          setColumnFilterUI={setColumnFilterUI}
          serviceId={serviceId}
          app={app}
          handleRowHover={handleRowHover}
          handleRowLeave={handleRowLeave}
          exportToExcel={exportToExcel}
        />
      ) : isMobile ? (
        <MobileForm
          s={s}
          theme={theme}
          isMobile={isMobile}
          mode={ui.mode}
          mobileActiveTab={mobileActiveTab}
          setMobileActiveTab={setMobileActiveTab}
          visibleFormList={visibleFormList}
          selectedIds={selectedIds}
          focusedId={focusedId}
          handleBeforeChangeFocus={handleBeforeChangeFocus}
          onFormRowClick={onFormRowClick}
          focusPrev={focusPrev}
          focusNext={focusNext}
          focusedFeature={focusedFeature}
          FIELD_META={FM}
          changedFields={changedFields}
          editValues={editValues}
          handleFieldChange={handleFieldChange}
          renderInput={renderInput}
          dirty={dirty}
          resetEdits={resetEdits}
          saveChanges={saveChanges}
          tablePendingDeletes={pendingDeletes}
          setDeleteState={setDeleteState}
          tableHasPending={tableHasPending}
          commitTableEdits={commitTableEdits}
          tableUndoStack={tableUndoStack}
          undoLatestTableChange={undoLatestTableChange}
          formUndoStack={formUndoStack}
          undoLatestFormChange={undoLatestFormChange}
          tablePendingEdits={pendingEdits}
          tablePendingAdds={pendingAdds}
          lastEditTargetIdsRef={lastEditTargetIdsRef}
          duplicateInForm={duplicateInForm}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
        />
      ) : (
        <DesktopForm
          s={s}
          theme={theme}
          visibleFormList={visibleFormList}
          selectedIds={selectedIds}
          onFormRowClick={onFormRowClick}
          focusedId={focusedId}
          handleBeforeChangeFocus={handleBeforeChangeFocus}
          focusPrev={focusPrev}
          focusNext={focusNext}
          focusedFeature={focusedFeature}
          FIELD_META={FM}
          changedFields={changedFields}
          editValues={editValues}
          handleFieldChange={handleFieldChange}
          renderInput={renderInput}
          dirty={dirty}
          resetEdits={resetEdits}
          saveChanges={saveChanges}
          tableHasPending={tableHasPending}
          tablePendingDeletes={pendingDeletes}
          commitTableEdits={commitTableEdits}
          tableUndoStack={
            tableUndoLocal.length ? tableUndoLocal : tableUndoStack
          }
          undoLatestTableChange={undoLatestTableChange}
          formUndoStack={formUndoStack}
          undoLatestFormChange={undoLatestFormChange}
          setDeleteState={setDeleteState}
          tablePendingEdits={pendingEdits}
          tablePendingAdds={pendingAdds}
          lastEditTargetIdsRef={lastEditTargetIdsRef}
          duplicateInForm={duplicateInForm}
          hasGeomUndo={hasGeomUndo}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          handleRowHover={handleRowHover}
          handleRowLeave={handleRowLeave}
          app={app}
          exportToExcel={exportToExcel}
        />
      )}
      <NotificationBar s={s} theme={theme} text={notification} />
    </div>
  );
}

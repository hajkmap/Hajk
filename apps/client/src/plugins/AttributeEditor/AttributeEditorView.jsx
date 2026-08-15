import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useTheme as useMuiTheme } from "@mui/material/styles";

import { themes, makeStyles } from "./theme/Styles";
import {
  isEditableField,
  isMissingValue,
  renderInput,
  idAliases,
  getFeatureId,
} from "./helpers/helpers";

import Toolbar from "./components/Toolbar";
import TableMode from "./components/TableMode";
import MobileForm from "./components/MobileForm";
import DesktopForm from "./components/DesktopForm";
import NotificationBar from "./helpers/NotificationBar";
import { editBus } from "../../buses/editBus";
import {
  isDraftId,
  isBooleanTrue,
  normalizeFilterValue,
} from "./helpers/helpers";
import { useSnackbar } from "notistack";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";

// Max geometry undo stack size to prevent memory leaks
const MAX_GEOM_UNDO = 100;

// Max unique values cache size
const MAX_UNIQUE_CACHE = 200;

function normalize(v) {
  return v == null ? "" : v;
}

/**
 * Normalize a datetime string so that different representations compare equal.
 * Handles variations returned by different backends (PostgreSQL, Oracle/GeoServer):
 *   "2025-01-02T00:00:00"       → "2025-01-02 00:00:00"
 *   "2025-01-02 00:00:00"       → "2025-01-02 00:00:00"
 *   "2025-01-02T00:00"          → "2025-01-02 00:00:00"
 *   "2025-01-02T00:00:00Z"      → "2025-01-02 00:00:00"
 *   "2025-01-02T00:00:00+02:00" → "2025-01-02 00:00:00"
 *   "2025-01-02 00:00:00.0"     → "2025-01-02 00:00:00"
 */
function normDt(val) {
  const s = String(val ?? "");
  const m = s.match(
    /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/
  );
  return m ? `${m[1]} ${m[2]}${m[3] || ":00"}` : s;
}

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
  model,
  draftBaselineRef,
  idFieldRef,
  app,
  map,
  handleRowHover,
  handleRowLeave,
  isLoading,
  allowMultiGeom = false,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const muiTheme = useMuiTheme();
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
  const anchorRef = useRef({ id: null, index: null });

  const explicitClearRef = React.useRef(false);

  const [columnFilters, setColumnFilters] = useState({});
  // Set by the form-edit filter sync right before it touches columnFilters;
  // DesktopForm's page-reset effect consumes it so the sync doesn't yank
  // the form list back to page 1 mid-typing.
  const filterPageResetSuppressRef = useRef(false);
  const [columnFilterUI, setColumnFilterUI] = useState({});
  const [openFilterColumn, setOpenFilterColumn] = useState(null);
  const filterOverlayRef = useRef(null);
  const firstColumnRef = useRef(null);
  const [searchText, setSearchText] = useState("");

  const [gpsLoading, setGpsLoading] = useState(false);
  const [supportsPointGeometry, setSupportsPointGeometry] = useState(false);

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

  // Warn when a load hit the feature cap — the layer most likely contains
  // more objects than were fetched, and only the fetched ones are editable.
  useEffect(() => {
    const off = editBus.on("attrib:load-truncated", (ev) => {
      const { limit } = ev.detail || {};
      enqueueSnackbar(
        `Lagret innehåller fler objekt än vad som hämtats (max ${Number(limit).toLocaleString("sv-SE")}). Endast de hämtade visas och kan redigeras.`,
        { variant: "warning", autoHideDuration: 10000 }
      );
    });
    // A failed schema/data load falls back to "Ingen" (emitted from the
    // AttributeEditor load path) — tell the user why the layer was dropped.
    const offErr = editBus.on("attrib:load-error", (ev) => {
      const { message } = ev.detail || {};
      enqueueSnackbar(
        `Lagret kunde inte laddas${message ? `: ${message}` : ""}. Valet har återställts till "Ingen".`,
        { variant: "error", autoHideDuration: 10000 }
      );
    });
    return () => {
      off();
      offErr();
    };
  }, [enqueueSnackbar]);

  // Track whether the active service supports Point geometry (from admin schema)
  useEffect(() => {
    const offSchema = editBus.on("attrib:schema-loaded", (ev) => {
      const { schema } = ev.detail || {};
      setSupportsPointGeometry(!!(schema?.editPoint || schema?.editMultiPoint));
    });
    const offClr = editBus.on("edit:service-cleared", () => {
      setSupportsPointGeometry(false);
    });
    return () => {
      offSchema();
      offClr();
    };
  }, []);

  const setGeometryById = React.useCallback(
    (logicalId, targetGeometry) => {
      const layer = vectorLayerRef?.current;
      const src = layer?.getSource?.();
      if (!src) return false;

      const want = String(logicalId);
      const wantNum = Number(logicalId);
      const all = src.getFeatures?.() || [];

      // First, try match on OL feature ID (most reliable)
      // This prevents matching drafts that inherited the original's id property
      // Also check for WFS-style IDs like "layername.92" when searching for "92"
      let f = all.find((feat) => {
        const olId = feat?.getId?.();
        if (olId === wantNum || String(olId) === want) return true;
        const olIdStr = olId != null ? String(olId) : null;
        if (olIdStr && olIdStr.endsWith("." + want)) return true;
        return false;
      });

      // Fallback: try getFeatureById
      if (!f) {
        f = src.getFeatureById?.(want) || src.getFeatureById?.(wantNum);
      }

      // Last resort: match on properties (but verify OL ID doesn't conflict)
      if (!f) {
        f = all.find((feat) => {
          const olId = feat?.getId?.();
          const b = feat?.get?.("@_fid");
          const c = feat?.get?.("id");
          const B = b != null ? String(b) : null;
          const C = c != null ? String(c) : null;

          // Skip if OL ID exists and doesn't match (prevents matching wrong feature)
          if (olId != null && String(olId) !== want && olId !== wantNum) {
            return false;
          }

          if (B === want || C === want) return true;
          if (B && B.endsWith("." + want)) return true;
          return false;
        });
      }
      if (!f) return false;

      if (targetGeometry && targetGeometry.clone) {
        f.setGeometry(targetGeometry.clone());
      } else if (targetGeometry) {
        f.setGeometry(targetGeometry);
      }

      return true;
    },
    [vectorLayerRef]
  );

  // Ref to access current undoStack without causing effect re-runs
  const undoStackRef = React.useRef(state.undoStack);
  undoStackRef.current = state.undoStack;

  React.useEffect(() => {
    const off = editBus.on("sketch:geometry-edited", (ev) => {
      const { id, before, after, coalesce } = ev.detail || {};
      if (id == null || !after) return;

      // 1) mark as "geometry edited"
      const modelMarker = Date.now();
      controller.batchEdit([{ id, key: "__geom__", value: modelMarker }]);

      // 2) add to local undo stack with a timestamp guaranteed to be AFTER any model entry
      // Get the model's last undo timestamp and ensure geometry undo is at least 1ms later
      const currentUndoStack = undoStackRef.current;
      const modelLastWhen =
        currentUndoStack?.[currentUndoStack.length - 1]?.when ?? 0;
      const geomWhen = Math.max(Date.now(), modelLastWhen + 1);

      // Coalesce-flagged events (continuous rotation ticks every 60 ms):
      // merge into the previous entry for the same feature — keep its
      // "before", advance "after" — so a whole press-and-hold is ONE undo
      // step instead of one per tick. Only explicitly flagged events merge;
      // deliberate repeated gestures still get their own entries.
      // The 500 ms window keeps the FIRST tick of a new press-and-hold from
      // merging into an older, unrelated entry for the same feature (ticks
      // arrive every 60 ms; a new hold starts at least 800 ms after the
      // previous gesture's entry).
      const stack = geomUndoRef.current;
      const last = stack[stack.length - 1];
      if (
        coalesce &&
        last &&
        String(last.id) === String(id) &&
        geomWhen - last.when < 500
      ) {
        last.after = after;
        last.when = geomWhen;
        return;
      }

      stack.push({ id, before, after, when: geomWhen });
      if (geomUndoRef.current.length > MAX_GEOM_UNDO) {
        geomUndoRef.current = geomUndoRef.current.slice(-MAX_GEOM_UNDO);
      }
      setGeomUndoCount((c) => Math.min(c + 1, MAX_GEOM_UNDO));
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
      // NOTE on the event contract: detail.mode ("replace"/"toggle"/"add"/
      // "clear") is INFORMATIONAL ONLY — every listener (this one and the
      // Sketch hook's) always REPLACES its state with the full ids list, so
      // emitters must always send the complete final selection.
      //
      // "attribute-editor-sync" events come from View paths that have already
      // set the table/form selection state locally — they exist to keep the
      // map side (Sketch's OL selection) in sync. Re-processing them here
      // would clobber the emitting path's focus choice via pickPreferredId.
      if (ev.detail?.source === "attribute-editor-sync") return;
      const incoming = ev.detail?.ids || [];
      // Deduplicate — but do NOT convert types. IDs arrive from emitters
      // in the same type as row.id (string from GML, number for drafts).
      // Converting e.g. "11" → 11 breaks strict-equality lookups later.
      const canonical = Array.from(new Set(incoming));

      // Mark as explicit clear when receiving empty selection from map
      // This prevents ensureFormSelection from auto-selecting the first row
      if (canonical.length === 0 && ev.detail?.source === "map") {
        explicitClearRef.current = true;
      } else if (canonical.length > 0) {
        // Any action that establishes a selection ends the "explicit clear"
        // state — without this the flag stayed true forever (only a form row
        // click reset it), permanently disabling form-mode auto-selection.
        explicitClearRef.current = false;
      }

      setTableSelectedIds(new Set(canonical));
      setSelectedIds(new Set(canonical));

      // Focus follows the LAST id in the list: every emitter appends newly
      // added ids last (Set insertion order in the toggle/add paths), so
      // this is the most recently selected feature. Preferring numeric ids
      // here kept focus glued to a draft no matter what was clicked.
      const focus = canonical.length ? canonical[canonical.length - 1] : null;
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

  // Tell the map side (Sketch's OL selection + highlighting) about selection
  // changes that originate inside the View. The View's own attrib:select-ids
  // listener skips this source, so the emitting path keeps full control over
  // its local state — without this, paths like form navigation or the
  // post-save re-selection leave the map's selection out of sync.
  const emitSelectionSync = React.useCallback((ids) => {
    const arr = Array.from(ids);
    // These emits bypass the View's own listener, so end the "explicit
    // clear" state here as well when a selection is established.
    if (arr.length > 0) explicitClearRef.current = false;
    editBus.emit("attrib:select-ids", {
      ids: arr,
      source: "attribute-editor-sync",
      mode: "replace",
    });
  }, []);

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

  // Flush the debounce queue immediately (clears the timer and applies any
  // queued edits to the model). Used on unmount and right before saving, so
  // keystrokes made in the last debounce window (120 ms) are never lost.
  const flushDebouncedEdits = React.useCallback(() => {
    if (debouncedTimerRef.current) {
      clearTimeout(debouncedTimerRef.current);
      debouncedTimerRef.current = null;
    }
    const flush = debouncedBatchRef.current || [];
    debouncedBatchRef.current = [];
    if (flush.length) {
      const byKey = new Map();
      for (const op of flush) byKey.set(`${op.id}::${op.key}`, op);
      controller.batchEdit(Array.from(byKey.values()));
    }
  }, [controller]);

  React.useEffect(() => {
    return () => {
      flushDebouncedEdits();
    };
  }, [flushDebouncedEdits]);

  React.useEffect(() => {
    lastSentRef.current.clear();
  }, [focusedId, selectedIds]);

  React.useEffect(() => {
    setColumnFilters({});
    setColumnFilterUI({});
    setOpenFilterColumn(null);
    uniqueCacheRef.current?.clear?.();
    setSearchText("");

    setTableEditing(null);
    setTableSelectedIds(new Set());
    setSelectedIds(new Set());
    setFocusedId(null);
    // "Show only selected", the frozen id snapshot behind it and the sort
    // order also belong to the previous layer — left alive, the new layer
    // opens filtered on ids that no longer exist and sorted on a column it
    // may not have.
    setShowOnlySelected(false);
    setFrozenSelectedIds(new Set());
    setSort({ key: null, dir: "asc" });
    // The local undo stacks belong to the PREVIOUS layer — surviving a
    // service switch would let Ctrl+Z replay the old layer's values onto
    // the new one. (The model's own undoStack is reset by INIT already.)
    formUndoSnapshotsRef.current.clear();
    setFormUndoStack([]);
    setTableUndoLocal([]);
    geomUndoRef.current = [];
    setGeomUndoCount(0);
    // A service switch is not a user-made "explicit clear" — reset the flag
    // so form-mode auto-selection works on the new layer.
    explicitClearRef.current = false;
  }, [serviceId]);

  // === Theme (follows Hajk global dark mode) ===
  const isDarkMode = muiTheme.palette.mode === "dark";
  const theme = isDarkMode ? themes.dark : themes.light;
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

  const featuresMap = React.useMemo(() => {
    const map = new Map();
    for (const f of features) {
      if (f?.id != null) {
        map.set(f.id, f);
        map.set(String(f.id), f);
      }
    }
    return map;
  }, [features]);

  const pendingEdits = React.useMemo(
    () => state.pendingEdits ?? {},
    [state.pendingEdits]
  );
  const pendingAdds = React.useMemo(
    () => state.pendingAdds ?? [],
    [state.pendingAdds]
  );

  const pendingAddsMap = React.useMemo(() => {
    const map = new Map();
    for (const d of pendingAdds) {
      if (d?.id != null) {
        map.set(d.id, d);
        map.set(String(d.id), d);
      }
    }
    return map;
  }, [pendingAdds]);

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
        const base = features.find((f) => String(f.id) === String(id)) || {};

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

    keys.sort((a, b) => {
      if (a === "id") return -1;
      if (b === "id") return 1;
      return 0;
    });

    return keys.map((key, i) => ({
      key,
      label: key,
      readOnly: key === "id",
      type: "text",
      initialWidth: i === 0 ? 120 : 220,
    }));
  }, [serviceId, fieldMeta, allRows]);

  const visibleFM = React.useMemo(() => FM.filter((m) => !m.hidden), [FM]);

  const filteredAndSorted = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const editingId = tableEditing?.id ?? null;

    // Searchable keys: id + visible field columns (mirrors visibleFormList)
    const searchKeys = (() => {
      const keys = FM.filter((m) => !m.hidden).map((m) => m.key);
      return keys.includes("id") ? keys : ["id", ...keys];
    })();

    // Build a set of datetime field keys for normalization
    const dtKeys = new Set(
      FM.filter((m) => m.type === "datetime").map((m) => m.key)
    );
    // Boolean columns filter in the same two-value space the cells display
    // ("Ja"/"Nej", where null and false both collapse to "Nej") — filtering
    // on raw values showed "true"/"(tom)" while the cells said Ja/Nej.
    const boolKeys = new Set(
      FM.filter((m) => m.type === "boolean").map((m) => m.key)
    );

    const columnFilterSets = {};
    for (const [key, selectedValues] of Object.entries(columnFilters)) {
      if (selectedValues && selectedValues.length > 0) {
        const isDt = dtKeys.has(key);
        const isBool = boolKeys.has(key);
        columnFilterSets[key] = new Set(
          selectedValues.map((v) => {
            if (isBool) return v === "(tom)" ? "Nej" : String(v);
            const s = v === "(tom)" ? "" : String(v);
            return isDt ? normDt(s) : s;
          })
        );
      }
    }
    const filterKeys = Object.keys(columnFilterSets);

    let rows = allRows.filter((f) => {
      // Always show negative IDs (new/duplicate)
      const isNegativeId = isDraftId(f.id);

      // If "show only first ID" is active, use the FIRST ID
      if (
        showOnlySelected &&
        !isNegativeId &&
        // The frozen set holds String forms (see Toolbar) — compare likewise
        !frozenSelectedIds.has(String(f.id)) &&
        editingId !== f.id
      ) {
        return false;
      }

      const matchesSearch =
        !q ||
        editingId === f.id ||
        // Search id + visible field values only (same key set as the form
        // list) — Object.values also matched internal fields, so searching
        // e.g. "delete" hit every delete-marked row via __pending.
        searchKeys.some((k) =>
          String(f[k] ?? "")
            .toLowerCase()
            .includes(q)
        );

      // Always show new features (negative IDs) regardless of column filters
      const matchesColumnFilters =
        isNegativeId ||
        editingId === f.id ||
        filterKeys.every((key) => {
          const filterSet = columnFilterSets[key];
          if (boolKeys.has(key)) {
            return filterSet.has(isBooleanTrue(f[key]) ? "Ja" : "Nej");
          }
          const cellValue = String(f[key] ?? "");
          return filterSet.has(dtKeys.has(key) ? normDt(cellValue) : cellValue);
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
    // Helper: get the sort value for a row. When a row is being edited,
    // use the original (unpatched) value so the row doesn't jump while typing.
    const sortVal = (r) => {
      if (editingId != null && r.id === editingId) {
        const orig = featuresMap.get(r.id);
        if (orig) return orig[sort.key];
      }
      return r[sort.key];
    };

    rows.sort((a, b) => {
      const p = pri(a) - pri(b);
      if (p !== 0) return p;

      if (!sort.key) {
        // Sort by ID for stable ordering regardless of server response order
        const aN = Number(a.id),
          bN = Number(b.id);
        if (Number.isFinite(aN) && Number.isFinite(bN)) return aN - bN;
        return String(a.id).localeCompare(String(b.id), "sv", {
          numeric: true,
        });
      }

      const res = cmp(sortVal(a), sortVal(b));
      if (res !== 0) return sort.dir === "asc" ? res : -res;
      // Tiebreaker: sort by ID for stable ordering when primary sort values are equal
      const aN = Number(a.id),
        bN = Number(b.id);
      if (Number.isFinite(aN) && Number.isFinite(bN)) return aN - bN;
      return String(a.id).localeCompare(String(b.id), "sv", { numeric: true });
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
    featuresMap,
    FM,
  ]);

  const cloneGeometryForDuplicates = React.useCallback(
    (sourceIds, createdIds) => {
      const layer = vectorLayerRef.current;
      const src = layer?.getSource?.();
      if (!src) return;

      // Helper: match AE-id (e.g. 5) against OL-ID/props (@_fid, id, getId)
      const resolveSourceFeature = (fromId) => {
        const want = String(fromId);

        let f = src.getFeatureById?.(want);
        if (f) return f;

        const all = src.getFeatures?.() || [];
        f = all.find((x) => {
          const a = x?.getId?.(); // OL-ID (may be "@_fid")
          const b = x?.get?.("@_fid");
          const c = x?.get?.("id");
          const A = a != null ? String(a) : null;
          const B = b != null ? String(b) : null;
          const C = c != null ? String(c) : null;

          if (A === want || B === want || C === want) return true;
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

        // Set target id (temporary negative id that AE needs to replace)
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
        } catch {
          // ignore
        }

        try {
          const gt = clone.getGeometry?.()?.getType?.() || "Polygon";
          const method =
            gt.replace(/^Multi/, "") === "LinearRing"
              ? "Polygon"
              : gt.replace(/^Multi/, "");
          clone.set?.("USER_DRAWN", true, true);
          clone.set?.("DRAW_METHOD", method, true);
          clone.set?.("EDIT_ACTIVE", false, true);
        } catch {
          // ignore
        }

        src.addFeature(clone);
        featureIndexRef.current.set(toId, clone);
      });

      layer?.changed?.();
    },
    [vectorLayerRef, featureIndexRef, model]
  );

  const duplicateSelectedRows = useCallback(() => {
    if (!tableSelectedIds.size) return;
    const allIds = [...tableSelectedIds];
    // Mirror DUPLICATE_ROWS' own eligibility exactly (no drafts, and the id
    // must exist in featuresMap) — the reducer silently skips unknown ids,
    // which would misalign the computed `created` ids below against the
    // drafts actually created.
    const ids = allIds.filter((id) => !isDraftId(id) && featuresMap.has(id));
    if (!ids.length) {
      return;
    }

    const start = state.nextTempId;
    controller.duplicateRows(ids);
    if (typeof start === "number") {
      const created = ids.map((_, i) => start - i);

      const currentState = model.getSnapshot();

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
    featuresMap,
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

    // Same eligibility mirror as duplicateSelectedRows (see comment there)
    const ids = base.filter((id) => !isDraftId(id) && featuresMap.has(id));
    if (!ids.length) return;

    const start = state.nextTempId;

    controller.duplicateRows(ids);

    if (typeof start === "number" && ids.length) {
      const created = ids.map((_, i) => start - i);

      const currentState = model.getSnapshot();

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
    featuresMap,
    fieldMeta,
    draftBaselineRef,
    showNotification,
    cloneGeometryForDuplicates,
  ]);

  const addFeatureFromGps = React.useCallback(() => {
    if (!navigator.geolocation) {
      enqueueSnackbar("Din webbläsare stöder inte GPS/platstjänster.", {
        variant: "error",
      });
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        try {
          const point = new Point([pos.coords.longitude, pos.coords.latitude]);
          point.transform("EPSG:4326", map.getView().getProjection().getCode());

          const feature = new Feature({ geometry: point });
          feature.set("USER_DRAWN", true, true);
          feature.set("DRAW_METHOD", "Point", true);
          feature.set("EDIT_ACTIVE", false, true);

          const tempId = model.addDraftFromFeature(feature);
          feature.setId(tempId);
          feature.set("id", tempId, true);

          const baseline = {};
          fieldMeta.forEach(({ key }) => {
            baseline[key] = "";
          });
          draftBaselineRef.current.set(tempId, baseline);

          featureIndexRef.current.set(tempId, feature);

          const layer = vectorLayerRef.current;
          const aeSrc = layer?.getSource?.();
          if (aeSrc) {
            aeSrc.addFeature(feature);
          }

          visibleIdsRef.current.add(tempId);

          if (ui.mode === "table") {
            setTableSelectedIds(new Set([tempId]));
          } else {
            setSelectedIds(new Set([tempId]));
            setFocusedId(tempId);
          }

          editBus.emit("attrib:select-ids", {
            ids: [tempId],
            source: "view",
            mode: "replace",
          });
          editBus.emit("attrib:focus-id", { id: tempId, source: "view" });

          layer?.changed?.();

          map
            .getView()
            .animate({ center: point.getCoordinates(), duration: 500 });

          showNotification("Punkt skapad från GPS-position");
        } catch (err) {
          console.warn("Kunde inte skapa GPS-punkt:", err);
          enqueueSnackbar(
            "Ett oväntat fel uppstod vid skapande av GPS-punkt.",
            {
              variant: "error",
            }
          );
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        setGpsLoading(false);
        if (error.code === 1) {
          enqueueSnackbar(
            "Åtkomst till platstjänster nekades. Tillåt platsåtkomst i webbläsarens inställningar.",
            { variant: "warning" }
          );
        } else if (error.code === 2) {
          enqueueSnackbar(
            "Kunde inte hämta din position. Kontrollera att platstjänster är aktiverade i systemets inställningar (kan vara begränsat av grupprincip/GPO).",
            { variant: "error" }
          );
        } else if (error.code === 3) {
          enqueueSnackbar(
            "GPS-förfrågan tog för lång tid. Försök igen eller kontrollera att platstjänster är aktiverade.",
            { variant: "warning" }
          );
        } else {
          enqueueSnackbar("Kunde inte hämta GPS-position.", {
            variant: "error",
          });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [
    map,
    model,
    fieldMeta,
    ui.mode,
    vectorLayerRef,
    featureIndexRef,
    visibleIdsRef,
    draftBaselineRef,
    showNotification,
    enqueueSnackbar,
  ]);

  React.useEffect(() => {
    visibleIdsRef.current = new Set(
      filteredAndSorted.flatMap((r) => [r.id, String(r.id)])
    );
    vectorLayerRef?.current?.changed?.();
  }, [filteredAndSorted, visibleIdsRef, vectorLayerRef]);

  React.useEffect(() => {
    const tableSel = Array.from(tableSelectedIds);
    const formSel = Array.from(selectedIds);

    const activeSelected =
      ui.mode === "table"
        ? tableSel
        : focusedId != null
          ? [...new Set([...formSel, focusedId])]
          : formSel;

    const visibleSelected = activeSelected.filter(
      (id) =>
        visibleIdsRef.current.has(id) || visibleIdsRef.current.has(String(id))
    );

    selectedIdsRef.current = new Set(visibleSelected);

    vectorLayerRef?.current?.changed?.();
  }, [
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
      const mode = ev?.detail?.mode || "toggle";
      controller.toggleDelete(ids, mode);
    });
    return () => off();
  }, [controller]);

  React.useEffect(() => {
    if (ui.mode === "form") {
      if (selectedIds.size === 0 && tableSelectedIds.size > 0) {
        const next = new Set(tableSelectedIds);
        setSelectedIds(next);
        if (focusedId == null) {
          const first = [...next][0];
          if (first != null) setFocusedId(first);
        }
      }
    } else if (ui.mode === "table") {
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
      const filterParts = [];
      for (const [k, vals] of Object.entries(columnFilters || {})) {
        if (k === columnKey) continue;
        filterParts.push(k + "=" + (Array.isArray(vals) ? vals.join(",") : ""));
      }

      // VALUE signatures, not counts: editing an already-edited cell, changing
      // a draft value or swapping which rows are delete-marked all keep the
      // counts identical — a count-based key served stale facet lists then.
      // Object values (e.g. __geom__ geometries) become a constant marker:
      // they never influence facet contents and may be circular.
      const sigOf = (v) =>
        typeof v === "object" && v !== null ? "obj" : String(v);
      const sigParts = [];
      for (const [id, e] of Object.entries(pendingEdits || {})) {
        for (const [k, v] of Object.entries(e || {})) {
          sigParts.push(`${id}.${k}=${sigOf(v)}`);
        }
      }
      for (const d of pendingAdds || []) {
        for (const [k, v] of Object.entries(d)) {
          sigParts.push(`${d.id}.${k}=${sigOf(v)}`);
        }
      }
      const deleteSig = Array.from(pendingDeletes ?? []).join(",");

      const cacheKey =
        `facet::${columnKey}::` +
        `${features.length}|${sigParts.join(";")}|del:${deleteSig}|` +
        `${searchText.trim().toLowerCase()}|` +
        filterParts.sort().join(";");

      const hit = uniqueCacheRef.current.get(cacheKey);
      if (hit) return hit;

      const q = searchText.trim().toLowerCase();

      // 1) Start with ALL rows (not filteredAndSorted)
      //    and apply the search string …
      // Same searchable key set as filteredAndSorted (id + visible fields) —
      // the facet must mirror the table's search semantics.
      const facetSearchKeys = (() => {
        const keys = FM.filter((m) => !m.hidden).map((m) => m.key);
        return keys.includes("id") ? keys : ["id", ...keys];
      })();
      const rowsAfterSearch = allRows.filter((r) => {
        if (!q) return true;
        if (tableEditing && tableEditing.id === r.id) return true;
        return facetSearchKeys.some((k) =>
          String(r[k] ?? "")
            .toLowerCase()
            .includes(q)
        );
      });

      // Check which keys are datetime for normalization
      const dtKeySet = new Set(
        FM.filter((m) => m.type === "datetime").map((m) => m.key)
      );
      // Boolean columns facet in the cells' two-value space ("Ja"/"Nej") —
      // the raw values would show as "true"/"(tom)" while the cells say
      // Ja/Nej, and null must count as "Nej" exactly like the cells render.
      const boolKeySet = new Set(
        FM.filter((m) => m.type === "boolean").map((m) => m.key)
      );

      // 2) ...and apply all other column filters (except for the current column)
      const rowsForFacet = rowsAfterSearch.filter((r) => {
        return Object.entries(columnFilters || {}).every(([k, selected]) => {
          if (k === columnKey) return true;
          if (!selected || selected.length === 0) return true;
          if (boolKeySet.has(k)) {
            const cmp = isBooleanTrue(r[k]) ? "Ja" : "Nej";
            return selected.some((sv) => (sv === "(tom)" ? "Nej" : sv) === cmp);
          }
          const cell = String(r[k] ?? "");
          const cmp = dtKeySet.has(k) ? normDt(cell) : cell;
          return selected.some(
            (sv) => (dtKeySet.has(k) ? normDt(sv) : sv) === cmp
          );
        });
      });

      // 3) Lock in unique values for the current column
      const isDtCol = dtKeySet.has(columnKey);
      const isBoolCol = boolKeySet.has(columnKey);
      const vals = new Set();
      for (let i = 0; i < rowsForFacet.length; i++) {
        const v = rowsForFacet[i]?.[columnKey];
        if (isBoolCol) {
          vals.add(isBooleanTrue(v) ? "Ja" : "Nej");
          continue;
        }
        const s = String(v ?? "");
        const display = s === "" ? "(tom)" : isDtCol ? normDt(s) : s;
        vals.add(display);
      }

      const out = Array.from(vals).sort((a, b) => {
        if (a === "(tom)" && b !== "(tom)") return 1;
        if (a !== "(tom)" && b === "(tom)") return -1;
        return a.localeCompare(b, "sv", { numeric: true, sensitivity: "base" });
      });

      uniqueCacheRef.current.set(cacheKey, out);
      // Limit cache size to prevent memory leaks
      if (uniqueCacheRef.current.size > MAX_UNIQUE_CACHE) {
        const firstKey = uniqueCacheRef.current.keys().next().value;
        uniqueCacheRef.current.delete(firstKey);
      }
      return out;
    },
    [
      allRows,
      features.length,
      // The full array (not .length): the cache-key signature reads draft
      // VALUES, so a draft edit with unchanged count must recompute too.
      pendingAdds,
      pendingEdits,
      pendingDeletes,
      searchText,
      columnFilters,
      tableEditing,
      FM,
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
        // The anchor index may be stale (set before a filter/sort/search
        // shrank the list) — clamp to the current bounds instead of
        // crashing on filteredAndSorted[i].id for an out-of-range i.
        const maxIdx = filteredAndSorted.length - 1;
        if (maxIdx < 0) return;
        const anchor = Math.min(Math.max(lastTableIndex, 0), maxIdx);
        const target = Math.min(Math.max(rowIndex, 0), maxIdx);
        const [a, b] = [anchor, target].sort((x, y) => x - y);
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

  // The one canonical save summary, shared by all save dialogs and the
  // edit:unsaved-state event. "edits" counts unique ROWS with unsaved
  // attribute changes: rows already buffered to the model (pendingEdits)
  // plus — when the form is dirty — the rows the form edit targets. A Set
  // prevents double counting: while typing in the form the same row is
  // typically both dirty AND already debounce-buffered into pendingEdits
  // (the old per-component formulas added rows + changed FIELDS and showed
  // e.g. "Ändrade: 2" for a single edited field). Drafts are excluded here —
  // their edits are already represented in "adds".
  const saveSummary = React.useMemo(() => {
    const editedRows = new Set(Object.keys(pendingEdits || {}));
    if (dirty && changedFields.size > 0) {
      const targets =
        selectedIds.size > 1
          ? Array.from(selectedIds)
          : focusedId != null
            ? [focusedId]
            : [];
      targets
        .filter((id) => !isDraftId(id))
        .forEach((id) => editedRows.add(String(id)));
    }
    return {
      adds: pendingAdds.filter((d) => d.__pending !== "delete").length,
      edits: editedRows.size,
      deletes:
        (pendingDeletes?.size ?? 0) +
        pendingAdds.filter((d) => d.__pending === "delete").length,
    };
  }, [
    pendingAdds,
    pendingEdits,
    pendingDeletes,
    dirty,
    changedFields,
    selectedIds,
    focusedId,
  ]);

  const lastHasUnsavedRef = React.useRef(hasUnsaved);
  React.useEffect(() => {
    if (hasUnsaved !== lastHasUnsavedRef.current) {
      editBus.emit("edit:unsaved-state", {
        source: "attribute-editor",
        hasUnsaved,
        summary: saveSummary,
      });
      lastHasUnsavedRef.current = hasUnsaved;
    }
  }, [hasUnsaved, saveSummary]);

  // Rebuild the map's vector source and the feature index from a WFS
  // feature collection. Used after a successful save (freshly reloaded
  // collection) and by discard-all (the cached collection from the last
  // load still holds the original geometries, so no refetch is needed).
  const rebuildMapFromCollection = React.useCallback(
    (featureCollection) => {
      if (!vectorLayerRef.current || !featureCollection) return;
      const mapProj = map.getView().getProjection();

      // Use CRS from featureCollection (set by backend) instead of assuming map projection
      const dataProj =
        featureCollection?.crsName ||
        featureCollection?.layerProjection ||
        mapProj.getCode();

      const fmt = new GeoJSON();
      const newFeatures = fmt.readFeatures(featureCollection, {
        dataProjection: dataProj,
        featureProjection: mapProj,
      });

      const source = vectorLayerRef.current.getSource();
      source.clear();
      editBus.emit("sketch:source-cleared", {});
      source.addFeatures(newFeatures);

      featureIndexRef.current.clear();

      newFeatures.forEach((f) => {
        const raw = getFeatureId(f, idFieldRef?.current);
        const aliases = idAliases(raw);
        for (const k of aliases) {
          featureIndexRef.current.set(k, f);
        }
      });

      newFeatures.forEach((f) => {
        const fidProp = f.get?.("@_fid");
        if (fidProp) {
          try {
            f.setId?.(fidProp);
          } catch {
            // ignore
          }
        }
      });

      vectorLayerRef.current.changed();
    },
    [map, vectorLayerRef, featureIndexRef, idFieldRef]
  );

  // Re-entry guard: a second save invocation (double-click, Enter+click)
  // while a transaction is in flight must not start a parallel transaction
  // against the same pending state.
  const savingLockRef = React.useRef(false);

  // Returns true when saving succeeded (or there was nothing to save) and
  // false when the transaction failed — callers like Toolbar use this to
  // decide whether a pending service switch may proceed.
  const commitTableEdits = useCallback(async () => {
    if (savingLockRef.current) return false;
    savingLockRef.current = true;
    // Signal save-in-progress to other plugins. Sketch locks its service
    // selector while a save is running (edit:saving-started listeners in
    // SketchView) — the matching "finished" is emitted in the finally block
    // below, so the lock is always released, even on errors.
    editBus.emit("edit:saving-started", { source: "attribute-editor" });
    try {
      // Apply any edits still sitting in the debounce queue, then read the
      // pending state FRESH from the model. The confirmSave flows call
      // saveChanges() (which buffers ops synchronously) and this function in
      // the same tick — the render-closure copies of pendingEdits/pendingAdds/
      // pendingDeletes from the previous render would not include those ops,
      // which used to silently drop form edits from the transaction.
      flushDebouncedEdits();
      const snap = model.getSnapshot();
      const pendingEdits = snap.pendingEdits || {};
      const pendingAdds = snap.pendingAdds || [];
      const pendingDeletes =
        snap.pendingDeletes instanceof Set ? snap.pendingDeletes : new Set();
      const features = snap.features || [];
      const featuresMap = snap.featuresMap || new Map();

      const layerCRS = model.getLayerProjection();

      const getGeometryForFeature = (id) => {
        const feature = featureIndexRef.current.get(id);
        if (!feature) {
          return null;
        }

        const geom = feature.getGeometry?.();
        if (!geom) {
          return null;
        }

        const format = new GeoJSON();
        const geojsonFeature = format.writeFeatureObject(feature, {
          featureProjection: map.getView().getProjection(),
          dataProjection: layerCRS,
        });

        return geojsonFeature.geometry;
      };

      const hasGeometryChanged = (id) => {
        const effective = featuresMap.get(id) || featuresMap.get(String(id));
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
          FM.forEach(({ key, readOnly, type }) => {
            if (key !== "id" && !readOnly) {
              let val = draft[key] ?? null;
              if (type === "datetime" && typeof val === "string") {
                val = val.replace(" ", "T");
              }
              properties[key] = val;
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
          const properties = Object.fromEntries(
            Object.entries(changes).filter(([k]) => !k.startsWith("__"))
          );

          // Convert datetime values to ISO 8601 (T-separator) for WFS-T
          FM.forEach(({ key, type }) => {
            if (
              type === "datetime" &&
              key in properties &&
              typeof properties[key] === "string"
            ) {
              properties[key] = properties[key].replace(" ", "T");
            }
          });

          let cleanId = String(id);
          const fidMatch = cleanId.match(/\.(\d+)$/);
          if (fidMatch) {
            cleanId = fidMatch[1];
          }

          const update = {
            id: cleanId,
            properties,
          };

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

      // 3. Build DELETE operations. Everything marked for deletion is sent to
      // the server EXCEPT drafts (negative ids) — those only exist locally
      // and are committed away by controller.commit(). Non-numeric ids (e.g.
      // a UUID idField or Oracle-style fids) must pass through untouched;
      // formatFeatureId in ogc.jsx handles the qualification for the server.
      const deletes = Array.from(pendingDeletes)
        .filter((id) => !isDraftId(id))
        .map((id) => {
          let cleanId = String(id);
          const fidMatch = cleanId.match(/\.(\d+)$/);
          if (fidMatch) {
            cleanId = fidMatch[1];
          }
          return cleanId;
        });

      const deletedDraftsCount = pendingAdds.filter(
        (d) => d.__pending === "delete"
      ).length;

      if (
        !inserts.length &&
        !updates.length &&
        !deletes.length &&
        !deletedDraftsCount
      ) {
        showNotification("Inga ändringar att spara");
        return true;
      }

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

        controller.commit();

        formUndoSnapshotsRef.current.clear();
        setFormUndoStack([]);
        setTableUndoLocal([]);
        setTableEditing(null);
        setLastTableIndex(null);
        geomUndoRef.current = [];
        setGeomUndoCount(0);

        return true;
      }

      enqueueSnackbar(`Sparar: ${summary}...`, { variant: "info" });

      const featureCollection = model.getFeatureCollection();
      const detectedGeomName = featureCollection?.geometryName;
      const detectedHasZ = featureCollection?.hasZ ?? false;
      const detectedGeomType = featureCollection?.geometryType;
      const result = await ogc.commitWfstTransaction(serviceId, {
        inserts,
        updates,
        deletes,
        srsName: layerCRS,
        geometryName: detectedGeomName,
        hasZ: detectedHasZ,
        geometryType: detectedGeomType,
      });

      if (result.success) {
        const failedInserts = inserts.length - (result.inserted || 0);
        const failedUpdates = updates.length - (result.updated || 0);
        const failedDeletes = deletes.length - (result.deleted || 0);
        const hasPartialFailure =
          failedInserts > 0 || failedUpdates > 0 || failedDeletes > 0;

        if (hasPartialFailure) {
          const totalDeletedCount = (result.deleted || 0) + deletedDraftsCount;
          const failureParts = [];
          if (failedInserts > 0)
            failureParts.push(`${failedInserts} ny(a) kunde inte sparas`);
          if (failedUpdates > 0)
            failureParts.push(
              `${failedUpdates} uppdatering(ar) kunde inte sparas`
            );
          if (failedDeletes > 0)
            failureParts.push(
              `${failedDeletes} borttagning(ar) kunde inte sparas`
            );

          let message = `⚠ Delvis sparat: ${result.inserted || 0} nya, ${result.updated || 0} uppdaterade, ${totalDeletedCount} borttagna\n`;
          message += failureParts.join(", ");
          message +=
            "\nObjekten kan ha ändrats eller tagits bort av någon annan — kontrollera efter omläsningen.";

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

        // Clear the geometry-change markers BEFORE commit: against pending
        // state the sweep deletes the __geom__ entries (and the draft ids are
        // still valid). Run after commit it would instead compare against the
        // committed base geometry and CREATE {__geom__: null} pendingEdits —
        // making just-saved rows appear edited again.
        const allIds = [
          ...new Set([
            ...features.map((f) => f.id),
            ...pendingAdds.map((d) => d.id),
          ]),
        ];
        controller.batchEdit(
          allIds.map((id) => ({ id, key: "__geom__", value: null }))
        );

        controller.commit();

        formUndoSnapshotsRef.current.clear();
        setFormUndoStack([]);
        setTableUndoLocal([]);
        setTableEditing(null);
        setLastTableIndex(null);
        geomUndoRef.current = [];
        setGeomUndoCount(0);
        try {
          const { featureCollection } = await model.loadFromService(serviceId);
          rebuildMapFromCollection(featureCollection);

          // Invalidate the unique-values cache so column filter dropdowns
          // reflect the fresh data (not stale pre-save values).
          uniqueCacheRef.current.clear();

          // Restore selection — keep IDs as strings to match re-fetched
          // feature rows (OL GML parser returns all values as strings).
          if (result.insertedIds && result.insertedIds.length > 0) {
            const newIds = result.insertedIds.map((fid) => {
              const match = fid.match(/\.(\d+)$/);
              return match ? match[1] : fid;
            });
            setTableSelectedIds(new Set(newIds));
            setSelectedIds(new Set(newIds));
            if (newIds.length > 0) setFocusedId(newIds[0]);
            emitSelectionSync(newIds);
          } else if (updates.length > 0) {
            const updatedIds = updates.map((u) => u.id);
            setTableSelectedIds(new Set(updatedIds));
            setSelectedIds(new Set(updatedIds));
            emitSelectionSync(updatedIds);
          }
        } catch (_reloadError) {
          // With a partial failure the local state now overstates what was
          // saved, and the reload that would have shown the server's truth
          // failed too — that combination must be an explicit error, not the
          // cheerful "saved!" message.
          if (hasPartialFailure) {
            enqueueSnackbar(
              "⚠ Delvis sparat, och omläsningen misslyckades — tabellen kan visa osparade värden. Tryck F5 och kontrollera dina ändringar.",
              { variant: "error", autoHideDuration: 15000 }
            );
          } else {
            enqueueSnackbar("Data sparades! Tryck F5 för att se ändringarna.", {
              variant: "warning",
              autoHideDuration: 10000,
            });
          }
        }
        // The transaction itself succeeded (reload problems are cosmetic).
        return true;
      } else {
        throw new Error(result.message || "Transaction failed");
      }
    } catch (error) {
      enqueueSnackbar(`Fel vid sparande: ${error.message || "Okänt fel"}`, {
        variant: "error",
        autoHideDuration: 8000,
      });
      return false;
    } finally {
      savingLockRef.current = false;
      editBus.emit("edit:saving-finished", { source: "attribute-editor" });
    }
  }, [
    controller,
    flushDebouncedEdits,
    rebuildMapFromCollection,
    emitSelectionSync,
    FM,
    featureIndexRef,
    map,
    ogc,
    serviceId,
    model,
    showNotification,
    enqueueSnackbar,
  ]);

  const exportToExcel = useCallback(
    async (exportFeatures) => {
      try {
        const xlsx = await import("xlsx");

        const exportHeaders = visibleFM
          .filter((meta) => meta.type !== "geometry")
          .map((meta) => meta.label);

        const exportData = exportFeatures.map((feature) => {
          return visibleFM
            .filter((meta) => meta.type !== "geometry")
            .map((meta) => {
              const value = feature[meta.key];
              return value != null ? String(value) : "";
            });
        });

        const exportArray = [exportHeaders, ...exportData];

        const worksheet = xlsx.utils.aoa_to_sheet(exportArray);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(
          workbook,
          worksheet,
          "Attributlista".slice(0, 30)
        );

        // Colons are invalid in Windows filenames — use dashes in the time part
        const timestamp = new Date().toLocaleString("sv-SE").replace(/:/g, "-");
        const filename = `Attributlista-${timestamp}.xlsx`;

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
    [visibleFM, enqueueSnackbar]
  );

  const undoLatestTableChange = useCallback(() => {
    // Undo rewrites values outside the typing flow, so the debounce dedup
    // cache must be invalidated — otherwise re-typing the exact value that
    // was just undone is silently dropped (form shows it, model never gets
    // it). Clearing is always safe: the model ignores no-op edits itself.
    lastSentRef.current.clear();
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
      let k = 0;
      for (let i = formUndoStack.length - 1; i >= 0; i--) {
        if ((formUndoStack[i]?.when ?? -1) !== tForm) break;
        k++;
      }
      const group = formUndoStack.slice(-k);

      const ops = [];
      group.forEach(({ id, snapshot }) => {
        FM.forEach(({ key }) => {
          const v = snapshot[key];
          ops.push({ id, key, value: normalizeForCommit(key, v, FM) });
        });
      });
      if (ops.length) controller.batchEdit(ops);

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
        setTableUndoLocal((prev) => prev.slice(0, -1));
      }
      return;
    }

    // 3) GEOMETRY UNDO: restore geometry and remove highlight
    if (tGeom >= tModel && geomLast) {
      const { id, before } = geomLast;

      geomUndoRef.current.pop();
      setGeomUndoCount((c) => Math.max(0, c - 1));

      if (before) {
        setGeometryById(id, before);

        // Trigger validation for the restored geometry
        // Use a separate event to avoid interfering with undo logic
        editBus.emit("sketch:validate-geometry", { id });

        const hasMoreGeomEdits = geomUndoRef.current.some(
          (entry) => String(entry.id) === String(id)
        );

        // Only clear the __geom__ marker if no more geometry edits remain for this feature
        if (!hasMoreGeomEdits) {
          controller.batchEdit([{ id, key: "__geom__", value: null }]);
        }

        showNotification("Ångrade geometriändring");
      }

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

  // Ctrl+Z keyboard shortcut for undo
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle Ctrl+Z (or Cmd+Z on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        // Don't intercept if user is typing in an input/textarea
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea") {
          return; // Let native undo handle it
        }

        const hasTableUndo = tableUndoLocal?.length > 0;
        const hasFormUndo = formUndoStack?.length > 0;
        const hasModelUndo = state.undoStack?.length > 0;
        const hasGeomUndo = geomUndoRef.current?.length > 0;

        if (hasTableUndo || hasFormUndo || hasModelUndo || hasGeomUndo) {
          e.preventDefault();
          undoLatestTableChange();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undoLatestTableChange, tableUndoLocal, formUndoStack, state.undoStack]);

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
      return pendingAddsMap.get(focusedId) || null;
    }
    const base = featuresMap.get(focusedId);
    if (!base) return null;
    return { ...base, ...(pendingEdits[focusedId] || {}) };
  }, [focusedId, featuresMap, pendingAddsMap, pendingEdits]);

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
      const draft = pendingAddsMap.get(focusedId);
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

    const feat = featuresMap.get(focusedId);
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
  }, [
    focusedId,
    FM,
    features,
    featuresMap,
    pendingEdits,
    pendingAdds,
    pendingAddsMap,
    draftBaselineRef,
  ]);

  // EXTERNAL SYNCH FOR DRAFTS: when pendingAdds changes, immediately update editValues + changedFields (using originalValues)
  useEffect(() => {
    if (!focusedId || focusedId >= 0) return;
    const draft = pendingAddsMap.get(focusedId);
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
  }, [
    pendingAdds,
    pendingAddsMap,
    focusedId,
    FM,
    originalValues,
    draftBaselineRef,
  ]);

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

    const removedIds = [];
    for (const prevId of previousPendingAddsRef.current) {
      if (!existingDraftIds.has(prevId)) {
        removedIds.push(prevId);
      }
    }

    if (removedIds.length > 0) {
      const layer = vectorLayerRef?.current;
      const src = layer?.getSource?.();
      if (src) {
        removedIds.forEach((fid) => {
          const feature =
            src.getFeatureById?.(fid) ||
            src.getFeatures().find((f) => {
              const id = f.getId?.() ?? f.get?.("@_fid") ?? f.get?.("id");
              return id === fid;
            });

          if (feature) {
            src.removeFeature(feature);
            featureIndexRef.current.delete(fid);
            editBus.emit("sketch:feature-removed", { id: fid });
          }
        });
      }
    }

    previousPendingAddsRef.current = existingDraftIds;
  }, [pendingAdds, draftBaselineRef, vectorLayerRef, featureIndexRef]);

  function selectAllVisible() {
    if (ui.mode === "table") {
      const ids = filteredAndSorted.map((f) => f.id);
      setTableSelectedIds(new Set(ids));
      setSelectedIds(new Set(ids));
      if (!focusedId && ids.length) setFocusedId(ids[0]);
      emitSelectionSync(ids);
    } else {
      const ids = visibleFormList.map((f) => f.id);
      setSelectedIds(new Set(ids));
      setTableSelectedIds(new Set(ids));
      if (!focusedId && ids.length) setFocusedId(ids[0]);
      emitSelectionSync(ids);
    }
  }
  function clearSelection() {
    explicitClearRef.current = true;
    setSelectedIds(new Set());
    setTableSelectedIds(new Set());

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
    const fmKeys = visibleFM.map((m) => m.key);
    const keys = fmKeys.includes("id") ? fmKeys : ["id", ...fmKeys];

    const filtered = all.filter((row) => {
      // Always show negative IDs (i.e. drafts)
      const isNegativeId = isDraftId(row.id);

      // If "Select first" is active, use the FIRST ID
      // (frozen set holds String forms — see Toolbar)
      if (
        showOnlySelected &&
        !isNegativeId &&
        !frozenSelectedIds.has(String(row.id))
      ) {
        return false;
      }

      const matchesSearch =
        !sTerm ||
        keys.some((k) => {
          const v = row?.[k];
          return v != null && String(v).toLowerCase().includes(sTerm);
        });

      // Always show new features (negative IDs) regardless of column filters
      const dtKeySet = new Set(
        FM.filter((m) => m.type === "datetime").map((m) => m.key)
      );
      // Booleans match in the cells' "Ja"/"Nej" space (null counts as "Nej")
      const boolKeySet = new Set(
        FM.filter((m) => m.type === "boolean").map((m) => m.key)
      );
      const matchesColumnFilters =
        isNegativeId ||
        Object.entries(columnFilters || {}).every(([key, selectedValues]) => {
          if (!selectedValues || selectedValues.length === 0) return true;
          if (boolKeySet.has(key)) {
            const cell = isBooleanTrue(row[key]) ? "Ja" : "Nej";
            return selectedValues.some(
              (v) => (v === "(tom)" ? "Nej" : v) === cell
            );
          }
          const isDt = dtKeySet.has(key);
          const cellValue = isDt
            ? normDt(String(row[key] ?? ""))
            : String(row[key] ?? "");

          const normalizedSelected = selectedValues.map((v) => {
            const s = v === "(tom)" ? "" : v;
            return isDt ? normDt(s) : s;
          });

          return normalizedSelected.includes(cellValue);
        });

      return matchesSearch && matchesColumnFilters;
    });

    filtered.sort((a, b) => {
      // Drafts (negative IDs) stay in "new items" section, even if marked for deletion
      const ap = a.id < 0 ? 0 : a.__pending === "add" ? 0 : 1;
      const bp = b.id < 0 ? 0 : b.__pending === "add" ? 0 : 1;
      if (ap !== bp) return ap - bp;
      // Sort by ID for stable ordering regardless of server response order
      const aN = Number(a.id),
        bN = Number(b.id);
      if (Number.isFinite(aN) && Number.isFinite(bN)) return aN - bN;
      return String(a.id).localeCompare(String(b.id), "sv", { numeric: true });
    });

    return filtered;
  }, [
    features,
    pendingEdits,
    pendingAdds,
    pendingDeletes,
    searchText,
    FM,
    visibleFM,
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
        focusedId != null &&
        visibleFormList.some((f) => String(f.id) === String(focusedId)),
      selectedIdsValid:
        selectedIds.size > 0 &&
        Array.from(selectedIds).some((id) =>
          visibleFormList.some((f) => String(f.id) === String(id))
        ),
      firstVisibleId: visibleFormList[0]?.id ?? null,
      // First row (in list order) that is part of the current selection —
      // lets us repair an invalid focus without collapsing the selection.
      firstSelectedVisibleId:
        visibleFormList.find((f) =>
          Array.from(selectedIds).some((id) => String(id) === String(f.id))
        )?.id ?? null,
      explicitClear: explicitClearRef.current,
    }),
    [ui.mode, focusedId, selectedIds, visibleFormList]
  );

  const ensureFormSelection = React.useCallback(() => {
    const {
      mode,
      focusedId: focus,
      focusedIdValid,
      selectedIdsValid,
      firstVisibleId,
      firstSelectedVisibleId,
    } = ensureFormSelectionDeps;

    if (mode !== "form") return;

    if (explicitClearRef.current) return;
    if (focusedIdValid && selectedIdsValid) return;

    // Repair instead of collapse: a valid (multi-)selection whose focus
    // became invalid only needs a new focus — replacing the selection with
    // the first visible row threw away the user's marked rows.
    if (selectedIdsValid && !focusedIdValid) {
      if (firstSelectedVisibleId != null) {
        setFocusedId(firstSelectedVisibleId);
      }
      return;
    }

    // Valid focus but empty/invalid selection: select the focused row.
    if (focusedIdValid && !selectedIdsValid) {
      setSelectedIds(new Set([focus]));
      emitSelectionSync([focus]);
      return;
    }

    if (firstVisibleId != null) {
      setSelectedIds(new Set([firstVisibleId]));
      setFocusedId(firstVisibleId);
      emitSelectionSync([firstVisibleId]);
    }
  }, [ensureFormSelectionDeps, emitSelectionSync]); // Only depends on the memoized object

  React.useLayoutEffect(() => {
    ensureFormSelection();
  }, [ensureFormSelection]);

  const onFormRowClick = useCallback(
    (rowId, rowIndex, evt) => {
      explicitClearRef.current = false;
      const isShift = evt.shiftKey;
      const isToggle = evt.metaKey || evt.ctrlKey || evt.altKey; // Alt = toggle only

      let idx = rowIndex;
      if (idx == null || idx < 0) {
        idx = visibleFormList.findIndex((f) => f.id === rowId);
      }

      // The next selection and the focus decision are computed OUTSIDE the
      // setState updater. The old version ran handleBeforeChangeFocus and a
      // bus emit inside the updater — the View's own listener then re-entered
      // mid-update and overwrote the focus chosen here (updaters must also be
      // pure: StrictMode runs them twice, which doubled the emits).
      let next = new Set(selectedIds);
      let focusTarget = null;

      if (isShift) {
        let anchorIdx = anchorRef.current.index;
        if (anchorIdx == null || anchorIdx < 0) {
          const focusIdx = visibleFormList.findIndex(
            (f) => String(f.id) === String(focusedId)
          );
          anchorIdx = focusIdx >= 0 ? focusIdx : idx;
        }

        const [a, b] = [anchorIdx, idx].sort((x, y) => x - y);
        next = new Set();
        for (let i = a; i <= b; i++) next.add(visibleFormList[i].id);

        // Don't change focus (keep the current one), but
        // if the current focus is no longer valid and there is a value, jump to rowId:
        const focusStillVisible = visibleFormList.some(
          (f) => String(f.id) === String(focusedId)
        );
        if (!focusStillVisible && next.size) {
          focusTarget = rowId;
        }
      }

      // ---- TOGGLE (Alt/Ctrl/Cmd) ------------------------------------
      else if (isToggle) {
        next.has(rowId) ? next.delete(rowId) : next.add(rowId);

        // If toggle results in empty selection, mark as explicit clear
        // so ensureFormSelection doesn't auto-select the first row
        if (next.size === 0) {
          explicitClearRef.current = true;
        }

        if (
          String(rowId) === String(focusedId) &&
          !next.has(rowId) &&
          next.size > 0
        ) {
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
            focusTarget = candidate;
        }
      } else {
        next = new Set([rowId]);
        if (String(focusedId) !== String(rowId)) focusTarget = rowId;
        anchorRef.current = { id: rowId, index: idx };
      }

      setSelectedIds(next);
      setTableSelectedIds(new Set(next));
      if (focusTarget != null) handleBeforeChangeFocus(focusTarget);
      emitSelectionSync(next);

      // Preserve the focus cascade to Sketch (its EDIT/MOVE publish listens
      // on attrib:focus-id) that the old re-entrant listener provided — but
      // with the focus this click actually decided on, not pickPreferredId's.
      const effectiveFocus =
        focusTarget ??
        (focusedId != null &&
        Array.from(next).some((x) => String(x) === String(focusedId))
          ? focusedId
          : null);
      if (effectiveFocus != null) {
        editBus.emit("attrib:focus-id", {
          id: effectiveFocus,
          source: "view",
        });
      }
    },
    [
      visibleFormList,
      focusedId,
      handleBeforeChangeFocus,
      selectedIds,
      setTableSelectedIds,
      emitSelectionSync,
    ]
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
      emitSelectionSync([lastId]);
      scrollToRow(lastId);
      return;
    }

    const idx = order.indexOf(focusedId);
    if (idx > 0) {
      const newId = order[idx - 1];
      setFocusedId(newId);
      setSelectedIds(new Set([newId]));
      emitSelectionSync([newId]);
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
      emitSelectionSync([firstId]);
      scrollToRow(firstId);
      return;
    }

    const idx = order.indexOf(focusedId);
    if (idx > -1 && idx < order.length - 1) {
      const newId = order[idx + 1];
      setFocusedId(newId);
      setSelectedIds(new Set([newId]));
      emitSelectionSync([newId]);
      scrollToRow(newId);
    }
  }

  // Form-mode counterpart of TableMode's syncFilterOnCellChange: an edit in
  // a column with an active filter extends the filter with the new value so
  // the row doesn't vanish from the lists mid-typing. Unlike the table
  // version this runs BEFORE the debounced op lands in the model, so the
  // still-used check must NOT exclude the edited rows — their old value is
  // still live for up to a debounce window, and dropping it early would
  // blink the row out. The trade-off: the final value's last intermediate
  // (e.g. "Stockhol") can linger as a selected-but-unmatched filter entry,
  // which is invisible in the facet list and harmless.
  function syncFilterOnFormEdit(columnKey, toValue, fromValue) {
    const active = columnFilters?.[columnKey];
    if (!Array.isArray(active) || active.length === 0) return;

    const colType = FM.find((m) => m.key === columnKey)?.type;
    const normF = (v) => normalizeFilterValue(colType, v);
    const fromStr = normF(fromValue);
    const toStr = normF(toValue);
    if (fromStr === toStr) return;

    filterPageResetSuppressRef.current = true;
    setColumnFilters((prev) => {
      const before = prev?.[columnKey] || [];
      const nextSet = new Set(before.map(normF));
      if (toStr !== "") nextSet.add(toStr);
      if (fromStr !== "" && fromStr !== toStr) {
        const stillUsed = allRows.some(
          (r) => normF(r?.[columnKey]) === fromStr
        );
        if (!stillUsed) nextSet.delete(fromStr);
      }
      return { ...(prev || {}), [columnKey]: Array.from(nextSet) };
    });
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
          const base = features.find((f) => String(f.id) === String(id)) || {};
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

    // Buffer the commit-normalized value ("" -> null for date/textarea),
    // same as the saveChanges path — otherwise a cleared date field reaches
    // the WFS transaction as "" instead of null. editValues keeps "" since
    // controlled inputs can't take null.
    const commitVal = normalizeForCommit(key, norm, FM);
    const ops = [];
    ids.forEach((id) => {
      const lk = `${id}::${key}`;
      const last = lastSentRef.current.get(lk);
      if (last !== norm) {
        lastSentRef.current.set(lk, norm);
        ops.push({ id, key, value: commitVal });
      }
    });
    if (ops.length) {
      // Keep an active filter on this column in step with the edit (same
      // behavior as editing a cell in the table view). fromValue is the
      // field's previous form value — for multi-edits the other rows' old
      // values are filter selections already and stay untouched.
      syncFilterOnFormEdit(key, commitVal, editValues[key]);
      debouncedBatchEdit(ops);
    }
  }

  function saveChanges(opts = {}) {
    if (!focusedFeature) return;
    const override = opts.targetIds;

    const idsToUpdate =
      override?.length > 0
        ? override
        : selectedIds.size > 1
          ? Array.from(selectedIds)
          : focusedFeature
            ? [focusedFeature.id]
            : [];

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

  const discardAllChanges = useCallback(() => {
    // Same dedup-cache invalidation as in undo: discarding restores old
    // values, so a re-typed identical value must not be filtered out.
    lastSentRef.current.clear();
    controller.discardAll(state.features);
    // Restore the original geometries in the map as well — resetting the
    // attribute state alone leaves moved/redrawn features visible. The cached
    // collection from the last load is pristine (only loadFromService writes
    // it), so no refetch is needed; the sketch:source-cleared emit inside the
    // rebuild also removes drawn draft geometries, matching the model where
    // pendingAdds were just dropped. With no cached collection (no service
    // load yet) this is a no-op, i.e. the old attributes-only behavior.
    rebuildMapFromCollection(model.getFeatureCollection());
    uniqueCacheRef.current.clear();
    setEditValues({ ...originalValues });
    setChangedFields(new Set());
    setDirty(false);
    formUndoSnapshotsRef.current.clear();
    setFormUndoStack([]);
    setTableUndoLocal([]);
    setTableEditing(null);
    setLastTableIndex(null);
    geomUndoRef.current = [];
    setGeomUndoCount(0);
  }, [
    controller,
    state.features,
    originalValues,
    model,
    rebuildMapFromCollection,
  ]);

  function openInFormFromTable(rowId) {
    controller.setMode("form");
    setSelectedIds(new Set([rowId]));
    setFocusedId(rowId);
    emitSelectionSync([rowId]);
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
    emitSelectionSync(selected);
  }

  const combinedUndoStack = tableUndoLocal.length
    ? tableUndoLocal
    : tableUndoStack;

  const canUndo =
    (tableUndoLocal?.length ?? 0) > 0 ||
    (tableUndoStack?.length ?? 0) > 0 ||
    (formUndoStack?.length ?? 0) > 0 ||
    geomUndoCount > 0 ||
    dirty;

  const hasGeomUndo = geomUndoCount > 0;

  // Delete-marked rows must not be split/merged — the operations clone or
  // consume the feature, effectively resurrecting a row the user chose to
  // remove (as drafts inheriting its attributes).
  const isDeleteMarked = React.useCallback(
    (id) =>
      (pendingDeletes?.has?.(id) ?? false) ||
      pendingAdds.some(
        (d) => String(d.id) === String(id) && d.__pending === "delete"
      ),
    [pendingDeletes, pendingAdds]
  );

  // === Split Feature Logic ===
  const canSplitGeometry = React.useMemo(() => {
    const activeSelectedIds =
      ui.mode === "table" ? tableSelectedIds : selectedIds;

    if (activeSelectedIds.size !== 1) return false;
    const id = Array.from(activeSelectedIds)[0];
    if (isDeleteMarked(id)) return false;
    const feature = featureIndexRef.current?.get(id);
    if (!feature) return false;
    const type = feature.getGeometry?.()?.getType?.();
    return type === "Polygon" || type === "LineString";
  }, [ui.mode, tableSelectedIds, selectedIds, featureIndexRef, isDeleteMarked]);

  const splitFeature = React.useCallback(() => {
    const activeSelectedIds =
      ui.mode === "table" ? tableSelectedIds : selectedIds;
    if (activeSelectedIds.size !== 1) return;

    const id = Array.from(activeSelectedIds)[0];
    const feature = featureIndexRef.current?.get(id);
    if (!feature) return;

    const geometryType = feature.getGeometry()?.getType?.();
    if (geometryType !== "Polygon" && geometryType !== "LineString") {
      showNotification("Endast Polygon och LineString kan delas");
      return;
    }

    editBus.emit("attrib:split-start", {
      featureId: id,
      geometryType,
    });

    showNotification("Rita en linje som delar objektet");
  }, [
    ui.mode,
    tableSelectedIds,
    selectedIds,
    featureIndexRef,
    showNotification,
  ]);

  // Listen for split completion from Sketch
  React.useEffect(() => {
    const offSplitComplete = editBus.on("sketch:split-complete", (ev) => {
      const { originalFeatureId, splitFeatures } = ev.detail || {};
      if (!originalFeatureId || !splitFeatures?.length) return;

      const originalFeature = featureIndexRef.current?.get(originalFeatureId);
      if (!originalFeature) return;

      setDeleteState([originalFeatureId], "mark");

      const createdIds = [];
      splitFeatures.forEach((splitGeometry) => {
        const draftFeature = originalFeature.clone();
        draftFeature.setGeometry(splitGeometry);

        const draftId = model.addDraftFromFeature(draftFeature);
        createdIds.push(draftId);

        // Baseline for "Återställ" — the other draft-creation paths (drawn
        // and duplicated drafts) store one; without it a reset blanks the
        // attributes the split parts inherited from the original feature.
        const baseline = {};
        fieldMeta.forEach(({ key }) => {
          const val = draftFeature.get?.(key);
          baseline[key] = val == null ? "" : val;
        });
        draftBaselineRef.current.set(draftId, baseline);

        const layer = vectorLayerRef.current;
        const src = layer?.getSource?.();
        if (src) {
          draftFeature.setId?.(draftId);
          try {
            draftFeature.set?.("id", draftId, true);
            draftFeature.set?.("USER_DRAWN", true, true);
            draftFeature.set?.("EDIT_ACTIVE", false, true);
          } catch {
            // ignore
          }

          src.addFeature(draftFeature);
          featureIndexRef.current.set(draftId, draftFeature);
        }
      });

      if (createdIds.length > 0) {
        setTableSelectedIds(new Set(createdIds));
        setSelectedIds(new Set(createdIds));
        setFocusedId(createdIds[0]);

        editBus.emit("attrib:select-ids", {
          ids: createdIds,
          source: "view",
          mode: "replace",
        });
      }

      showNotification(`Objektet delades i ${splitFeatures.length} delar`);
    });

    const offSplitError = editBus.on("sketch:split-error", (ev) => {
      const { message } = ev.detail || {};
      showNotification(message || "Kunde inte dela objektet");
    });

    const offSplitCancelled = editBus.on("sketch:split-cancelled", () => {
      showNotification("Delning avbruten");
    });

    return () => {
      offSplitComplete();
      offSplitError();
      offSplitCancelled();
    };
  }, [
    model,
    featureIndexRef,
    vectorLayerRef,
    setDeleteState,
    showNotification,
    fieldMeta,
    draftBaselineRef,
  ]);

  // === Split Multi-Feature Logic ===
  const canSplitMultiFeature = React.useMemo(() => {
    const activeSelectedIds =
      ui.mode === "table" ? tableSelectedIds : selectedIds;

    if (activeSelectedIds.size !== 1) return false;
    const id = Array.from(activeSelectedIds)[0];
    if (isDeleteMarked(id)) return false;
    const feature = featureIndexRef.current?.get(id);
    if (!feature) return false;
    const type = feature.getGeometry?.()?.getType?.();
    if (!["MultiPoint", "MultiLineString", "MultiPolygon"].includes(type)) {
      return false;
    }
    const coords = feature.getGeometry()?.getCoordinates?.();
    return coords && coords.length > 1;
  }, [ui.mode, tableSelectedIds, selectedIds, featureIndexRef, isDeleteMarked]);

  const splitMultiFeature = React.useCallback(() => {
    const activeSelectedIds =
      ui.mode === "table" ? tableSelectedIds : selectedIds;
    if (activeSelectedIds.size !== 1) return;

    const id = Array.from(activeSelectedIds)[0];
    editBus.emit("attrib:split-multi-feature", { featureId: id });
  }, [ui.mode, tableSelectedIds, selectedIds]);

  // === Merge Features Logic ===
  const canMergeFeatures = React.useMemo(() => {
    if (!allowMultiGeom) return false;

    const activeSelectedIds =
      ui.mode === "table" ? tableSelectedIds : selectedIds;

    if (activeSelectedIds.size < 2) return false;

    const ids = Array.from(activeSelectedIds);
    if (ids.some(isDeleteMarked)) return false;
    const types = ids.map((id) => {
      const feature = featureIndexRef.current?.get(id);
      return feature?.getGeometry?.()?.getType?.();
    });

    const validTypes = types.filter((t) => t);
    if (validTypes.length !== ids.length) return false;

    const uniqueTypes = [...new Set(validTypes)];
    if (uniqueTypes.length !== 1) return false;

    // Allow merging simple types OR already-multi types (e.g. when the geometry column enforces Multi)
    return [
      "Point",
      "LineString",
      "Polygon",
      "MultiPoint",
      "MultiLineString",
      "MultiPolygon",
    ].includes(uniqueTypes[0]);
  }, [
    ui.mode,
    tableSelectedIds,
    selectedIds,
    featureIndexRef,
    allowMultiGeom,
    isDeleteMarked,
  ]);

  const mergeFeatures = React.useCallback(() => {
    const activeSelectedIds =
      ui.mode === "table" ? tableSelectedIds : selectedIds;
    if (activeSelectedIds.size < 2) return;

    const ids = Array.from(activeSelectedIds);
    editBus.emit("attrib:merge-features", { featureIds: ids });
  }, [ui.mode, tableSelectedIds, selectedIds]);

  // Listen for split-multi and merge completion/error events
  React.useEffect(() => {
    const offSplitMultiComplete = editBus.on(
      "sketch:split-multi-complete",
      (ev) => {
        const { count, newIds } = ev.detail || {};
        showNotification(`Multi-objektet delades upp i ${count} delar`);
        if (newIds?.length > 0) {
          editBus.emit("attrib:select-ids", {
            ids: newIds,
            source: "view",
            mode: "replace",
          });
        }
      }
    );

    const offSplitMultiError = editBus.on("sketch:split-multi-error", (ev) => {
      const { message } = ev.detail || {};
      showNotification(message || "Kunde inte dela upp multi-objektet");
    });

    const offMergeComplete = editBus.on("sketch:merge-complete", (ev) => {
      const { newId } = ev.detail || {};
      showNotification("Objekten slogs ihop till ett multi-objekt");
      if (newId != null) {
        editBus.emit("attrib:select-ids", {
          ids: [newId],
          source: "view",
          mode: "replace",
        });
      }
    });

    const offMergeError = editBus.on("sketch:merge-error", (ev) => {
      const { message } = ev.detail || {};
      showNotification(message || "Kunde inte slå ihop objekten");
    });

    return () => {
      offSplitMultiComplete();
      offSplitMultiError();
      offMergeComplete();
      offMergeError();
    };
  }, [showNotification]);

  return (
    <div style={s.shell}>
      <Toolbar
        s={s}
        isMobile={isMobile}
        mode={ui.mode}
        setMode={controller.setMode}
        title={ui.title}
        color={ui.color}
        features={features}
        filteredAndSorted={filteredAndSorted}
        tableSelectedIds={tableSelectedIds}
        selectedIds={selectedIds}
        selectAllVisible={selectAllVisible}
        clearSelection={clearSelection}
        setPluginSettings={setPluginSettings}
        dirty={dirty}
        saveChanges={saveChanges}
        commitTableEdits={commitTableEdits}
        tablePendingAdds={pendingAdds}
        tablePendingEdits={pendingEdits}
        tablePendingDeletes={pendingDeletes}
        summary={saveSummary}
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
        onDiscard={discardAllChanges}
      />

      {serviceId === "NONE_ID" ? (
        <div style={s.paneWrap}>
          <div style={{ ...s.pane, gridColumn: "1 / -1" }}>
            <div style={s.formEmpty}>Inget redigeringsbart lager vald.</div>
          </div>
        </div>
      ) : isMobile ? (
        <MobileForm
          s={s}
          mobileActiveTab={mobileActiveTab}
          setMobileActiveTab={setMobileActiveTab}
          visibleFormList={visibleFormList}
          selectedIds={selectedIds}
          focusedId={focusedId}
          handleBeforeChangeFocus={handleBeforeChangeFocus}
          onFormRowClick={onFormRowClick}
          focusedFeature={focusedFeature}
          FIELD_META={visibleFM}
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
          summary={saveSummary}
          tableUndoStack={tableUndoStack}
          undoLatestTableChange={undoLatestTableChange}
          formUndoStack={formUndoStack}
          undoLatestFormChange={undoLatestFormChange}
          tablePendingEdits={pendingEdits}
          tablePendingAdds={pendingAdds}
          duplicateInForm={duplicateInForm}
          splitFeature={splitFeature}
          canSplitGeometry={canSplitGeometry}
          splitMultiFeature={splitMultiFeature}
          canSplitMultiFeature={canSplitMultiFeature}
          mergeFeatures={mergeFeatures}
          canMergeFeatures={canMergeFeatures}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          hasGeomUndo={hasGeomUndo}
          exportToExcel={exportToExcel}
          addFeatureFromGps={addFeatureFromGps}
          gpsLoading={gpsLoading}
          supportsPointGeometry={supportsPointGeometry}
          isLoading={isLoading}
          onDiscard={discardAllChanges}
        />
      ) : ui.mode === "table" ? (
        <TableMode
          s={s}
          theme={theme}
          FIELD_META={visibleFM}
          isMobile={isMobile}
          features={features}
          featuresMap={featuresMap}
          filteredAndSorted={filteredAndSorted}
          tableSelectedIds={tableSelectedIds}
          tableHasPending={tableHasPending}
          duplicateSelectedRows={duplicateSelectedRows}
          splitFeature={splitFeature}
          canSplitGeometry={canSplitGeometry}
          splitMultiFeature={splitMultiFeature}
          canSplitMultiFeature={canSplitMultiFeature}
          mergeFeatures={mergeFeatures}
          canMergeFeatures={canMergeFeatures}
          openSelectedInFormFromTable={openSelectedInFormFromTable}
          commitTableEdits={commitTableEdits}
          summary={saveSummary}
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
          addFeatureFromGps={addFeatureFromGps}
          gpsLoading={gpsLoading}
          supportsPointGeometry={supportsPointGeometry}
          isLoading={isLoading}
          onDiscard={discardAllChanges}
        />
      ) : (
        <DesktopForm
          s={s}
          filterPageResetSuppressRef={filterPageResetSuppressRef}
          visibleFormList={visibleFormList}
          selectedIds={selectedIds}
          onFormRowClick={onFormRowClick}
          focusedId={focusedId}
          handleBeforeChangeFocus={handleBeforeChangeFocus}
          focusPrev={focusPrev}
          focusNext={focusNext}
          focusedFeature={focusedFeature}
          FIELD_META={visibleFM}
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
          summary={saveSummary}
          tableUndoStack={
            tableUndoLocal.length ? tableUndoLocal : tableUndoStack
          }
          undoLatestTableChange={undoLatestTableChange}
          formUndoStack={formUndoStack}
          undoLatestFormChange={undoLatestFormChange}
          setDeleteState={setDeleteState}
          tablePendingEdits={pendingEdits}
          tablePendingAdds={pendingAdds}
          duplicateInForm={duplicateInForm}
          splitFeature={splitFeature}
          canSplitGeometry={canSplitGeometry}
          splitMultiFeature={splitMultiFeature}
          canSplitMultiFeature={canSplitMultiFeature}
          mergeFeatures={mergeFeatures}
          canMergeFeatures={canMergeFeatures}
          hasGeomUndo={hasGeomUndo}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          handleRowHover={handleRowHover}
          handleRowLeave={handleRowLeave}
          app={app}
          exportToExcel={exportToExcel}
          addFeatureFromGps={addFeatureFromGps}
          gpsLoading={gpsLoading}
          supportsPointGeometry={supportsPointGeometry}
          isLoading={isLoading}
          onDiscard={discardAllChanges}
        />
      )}
      <NotificationBar s={s} theme={theme} text={notification} />
    </div>
  );
}

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";

//import { FIELD_META } from "./dummy/DummyData";
import { themes, makeStyles } from "./theme/Styles";
import {
  isEditableField,
  isMissingValue,
  renderInput,
} from "./helpers/helpers";

import Toolbar from "./components/Toolbar";
import TableMode from "./components/TableMode";
import MobileForm from "./components/MobileForm";
import DesktopForm from "./components/DesktopForm";
import NotificationBar from "./helpers/NotificationBar";
import { editBus } from "../../buses/editBus";

export default function AttributeEditorView({
  state,
  controller,
  ui,
  setPluginSettings,
  ogc,
  fieldMeta,
}) {
  const [serviceId, setServiceId] = React.useState("NONE_ID");
  const [tableEditing, setTableEditing] = useState(null); // { id, key, startValue } | null

  const [isMobile, setIsMobile] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState("list");

  const [tableSearch, setTableSearch] = useState("");
  const [sort, setSort] = useState({ key: "geoid", dir: "asc" });
  const [tableSelectedIds, setTableSelectedIds] = useState(new Set());
  const [lastTableIndex, setLastTableIndex] = useState(null);
  const [tableUndoLocal, setTableUndoLocal] = useState([]);
  const pushTableUndo = useCallback((entry) => {
    setTableUndoLocal((prev) => [...prev, { ...entry, when: Date.now() }]);
  }, []);

  const [formSearch, setFormSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [focusedId, setFocusedId] = useState(null);
  const [lastFormIndex, setLastFormIndex] = useState(null);
  const lastEditTargetIdsRef = useRef(null);

  const [columnFilters, setColumnFilters] = useState({});
  const [openFilterColumn, setOpenFilterColumn] = useState(null);
  const filterOverlayRef = useRef(null);
  const firstColumnRef = useRef(null);

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
    if (serviceId !== "NONE_ID") return;
    setTableSelectedIds(new Set());
    setSelectedIds(new Set());
    setFocusedId(null);
    setOpenFilterColumn(null);
    setTableEditing(null);
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

  const setTablePendingEdits = useCallback(
    (updaterOrObj) => {
      const prev = pendingEdits;
      const next =
        typeof updaterOrObj === "function" ? updaterOrObj(prev) : updaterOrObj;

      const ids = new Set([
        ...Object.keys(prev).map(Number),
        ...Object.keys(next).map(Number),
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

  const duplicateSelectedRows = useCallback(() => {
    if (!tableSelectedIds.size) return;
    const ids = [...tableSelectedIds];
    const start = state.nextTempId;
    controller.duplicateRows(ids);
    if (typeof start === "number") {
      const created = ids.map((_, i) => start - i);
      setTableSelectedIds(new Set(created));
    }
    showNotification(
      `${ids.length} ${ids.length === 1 ? "utkast" : "utkast"} skapade`
    );
  }, [tableSelectedIds, controller, state.nextTempId, showNotification]);

  const duplicateInForm = React.useCallback(() => {
    const ids = selectedIds.size
      ? Array.from(selectedIds)
      : focusedId != null
        ? [focusedId]
        : [];

    if (!ids.length) return;

    const start = state.nextTempId;

    controller.duplicateRows(ids);

    if (typeof start === "number") {
      const created = ids.map((_, i) => start - i);
      setSelectedIds(new Set(created));
      setFocusedId(created[0]);
    }

    showNotification(
      `${ids.length} ${ids.length === 1 ? "utkast" : "utkast"} skapade`
    );
  }, [selectedIds, focusedId, controller, state.nextTempId, showNotification]);

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
    const editedFeatures = features.map((f) => {
      const patch = pendingEdits[f.id];
      let row = patch ? { ...f, ...patch } : f;
      if (pendingDeletes?.has?.(f.id)) row = { ...row, __pending: "delete" };
      return row;
    });
    return [...editedFeatures, ...pendingAdds];
  }, [features, pendingAdds, pendingEdits, pendingDeletes]);

  const FM = useMemo(() => {
    if (serviceId === "NONE_ID") return [];
    if (Array.isArray(fieldMeta) && fieldMeta.length) return fieldMeta;
    const keys = Object.keys(allRows[0] || {});
    return keys.map((key) => ({ key, label: key }));
  }, [allRows, serviceId, fieldMeta]);

  const filteredAndSorted = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();

    let rows = allRows.filter((f) => {
      const matchesSearch = !q
        ? true
        : Object.values(f).some((val) =>
            String(val ?? "")
              .toLowerCase()
              .includes(q)
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

    const pri = (r) => (r.__pending === "add" ? 0 : 1);
    rows.sort((a, b) => {
      const p = pri(a) - pri(b);
      if (p !== 0) return p;
      const res = cmp(a[sort.key], b[sort.key]);
      return sort.dir === "asc" ? res : -res;
    });

    return rows;
  }, [allRows, tableSearch, sort, columnFilters]);

  const getUniqueColumnValues = useCallback(
    (columnKey) => {
      const values = new Set();
      allRows.forEach((f) => {
        const val = String(f[columnKey] ?? "");
        if (val) values.add(val);
      });
      return Array.from(values).sort();
    },
    [allRows]
  );

  const toggleSort = (key) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  const handleRowClick = useCallback(
    (rowId, rowIndex, evt) => {
      setTableSelectedIds((prev) => {
        const next = new Set(prev);
        if (evt.shiftKey && lastTableIndex !== null) {
          const [a, b] = [lastTableIndex, rowIndex].sort((x, y) => x - y);
          for (let i = a; i <= b; i++) next.add(filteredAndSorted[i].id);
        } else if (evt.metaKey || evt.ctrlKey) {
          next.has(rowId) ? next.delete(rowId) : next.add(rowId);
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

  const commitTableEdits = useCallback(() => {
    controller.commit();
    formUndoSnapshotsRef.current.clear();
    setFormUndoStack([]);
    setTableUndoLocal([]);
    setTableEditing(null);
    setLastTableIndex(null);
  }, [controller]);

  const undoLatestTableChange = useCallback(() => {
    const modelLast = state.undoStack?.[state.undoStack.length - 1] ?? null;
    const tableLast = tableUndoLocal[tableUndoLocal.length - 1] ?? null;
    const formLast = formUndoStack[formUndoStack.length - 1] ?? null;
    const tModel = modelLast?.when ?? -Infinity;
    const tTable = tableLast?.when ?? -Infinity;
    const tForm = formLast?.when ?? -Infinity;

    if (tForm >= tTable && tForm >= tModel && formLast) {
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
          ops.push({
            id,
            key,
            value:
              v === "" && (key === "ar_utbredning" || key === "ar_anteckning")
                ? null
                : v,
          });
        });
      });
      if (ops.length) controller.batchEdit(ops);
      const hit = group.find((g) => g.id === focusedId);
      if (hit?.snapshot) {
        const snap = hit.snapshot;
        setEditValues({ ...snap });
        const nextChanged = new Set();
        FM.forEach(({ key }) => {
          if ((snap[key] ?? "") !== (originalValues[key] ?? ""))
            nextChanged.add(key);
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

    if (tTable >= tModel && tableLast) {
      if (tableLast.type === "edit_cell") {
        controller.batchEdit([
          { id: tableLast.id, key: tableLast.key, value: tableLast.prevValue },
        ]);
        setTableUndoLocal((prev) => prev.slice(0, -1));
        showNotification("Ångrade celländring");
      } else {
        setTableUndoLocal((prev) => prev.slice(0, -1));
      }
      return;
    }

    if (modelLast) {
      controller.undo();
      return;
    }
  }, [
    state.undoStack,
    tableUndoLocal,
    formUndoStack,
    controller,
    focusedId,
    originalValues,
    showNotification,
    FM,
  ]);

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

    const feat =
      focusedId < 0
        ? pendingAdds.find((d) => d.id === focusedId)
        : features.find((f) => f.id === focusedId);
    if (!feat) return;

    const base = {};
    const effective = {};
    const patch = focusedId < 0 ? {} : pendingEdits[focusedId] || {};

    FM.forEach(({ key }) => {
      const baseVal = normalize(feat[key]);
      base[key] = baseVal;
      const effVal =
        focusedId < 0
          ? baseVal
          : key in patch
            ? normalize(patch[key])
            : baseVal;
      effective[key] = effVal;
    });

    setOriginalValues(base);
    setEditValues(effective);

    const changed = new Set();
    FM.forEach(({ key }) => {
      if ((effective[key] ?? "") !== (base[key] ?? "")) changed.add(key);
    });
    setChangedFields(changed);
    setDirty(false);
  }, [focusedId, features, pendingAdds, pendingEdits, FM]);

  useEffect(() => {
    if (!focusedId || dirty) return;
    const feat = features.find((f) => f.id === focusedId);
    if (!feat) return;

    const base = {};
    const effective = {};
    const patch = pendingEdits[focusedId] || {};

    FM.forEach(({ key }) => {
      const baseVal = normalize(feat[key]);
      base[key] = baseVal;
      const effVal =
        focusedId < 0
          ? baseVal
          : key in patch
            ? normalize(patch[key])
            : baseVal;
      effective[key] = effVal;
    });

    setOriginalValues(base);
    setEditValues(effective);

    const changed = new Set();
    FM.forEach(({ key }) => {
      if ((effective[key] ?? "") !== (base[key] ?? "")) changed.add(key);
    });
    setChangedFields(changed);
    setDirty(false);
  }, [pendingEdits, features, focusedId, dirty, FM]);

  function normalize(v) {
    return v == null ? "" : v;
  }

  function selectAllVisible() {
    const ids = visibleFormList.map((f) => f.id);
    setSelectedIds(new Set(ids));
    if (!focusedId && ids.length) setFocusedId(ids[0]);
  }
  function clearSelection() {
    setSelectedIds(new Set());
  }

  const visibleFormList = useMemo(() => {
    const sTerm = formSearch.trim().toLowerCase();
    const existing = features.map((f, idx) => {
      let r = { ...f, ...(pendingEdits[f.id] || {}), __idx: idx };
      if (pendingDeletes?.has?.(f.id)) r = { ...r, __pending: "delete" };
      return r;
    });
    const startIdx = existing.length;
    const drafts = pendingAdds.map((d, i) => ({ ...d, __idx: startIdx + i }));

    const all = [...existing, ...drafts];
    const fmKeys = FM.map((m) => m.key);
    const searchKeys = fmKeys
      .filter((k) => !["id", "geoid", "oracle_geoid"].includes(k))
      .slice(0, 5);

    const filtered = all.filter((f) => {
      if (!sTerm) return true;
      return searchKeys.some((k) =>
        String(f[k] ?? "")
          .toLowerCase()
          .includes(sTerm)
      );
    });

    filtered.sort((a, b) => {
      const ap = a.__pending === "add" ? 0 : 1;
      const bp = b.__pending === "add" ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.__idx - b.__idx;
    });

    return filtered;
  }, [features, pendingEdits, pendingAdds, pendingDeletes, formSearch, FM]);

  const ensureFormSelection = React.useCallback(() => {
    if (ui.mode !== "form") return;
    const focusOk =
      focusedId != null && visibleFormList.some((f) => f.id === focusedId);
    const selOk =
      selectedIds.size > 0 &&
      Array.from(selectedIds).some((id) =>
        visibleFormList.some((f) => f.id === id)
      );

    if (focusOk && selOk) return;

    // select first visible row as fallback
    const cand = visibleFormList[0]?.id;
    if (cand != null) {
      setSelectedIds(new Set([cand]));
      setFocusedId(cand);
    }
  }, [ui.mode, focusedId, selectedIds, visibleFormList]);

  React.useLayoutEffect(() => {
    ensureFormSelection();
  }, [ensureFormSelection]);

  const onFormRowClick = useCallback(
    (rowId, rowIndex, evt) => {
      handleBeforeChangeFocus(rowId);
      setSelectedIds((prev) => {
        let next = new Set(prev);
        const anchorIndex = lastFormIndex ?? rowIndex;
        if (evt.shiftKey && anchorIndex !== -1) {
          const [a, b] = [anchorIndex, rowIndex].sort((x, y) => x - y);
          next = new Set();
          for (let i = a; i <= b; i++) next.add(visibleFormList[i].id);
        } else if (evt.metaKey || evt.ctrlKey) {
          next.has(rowId) ? next.delete(rowId) : next.add(rowId);
        } else {
          next = new Set([rowId]);
        }
        setLastFormIndex(rowIndex);
        return next;
      });
    },
    [visibleFormList, lastFormIndex, handleBeforeChangeFocus]
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
    setEditValues((prev) => ({ ...prev, [key]: value }));

    setChangedFields((prev) => {
      const next = new Set(prev);
      const baseValue = originalValues[key] ?? "";
      if ((value ?? "") !== baseValue) next.add(key);
      else next.delete(key);
      setDirty(next.size > 0);
      return next;
    });

    const ids = selectedIds.size
      ? Array.from(selectedIds)
      : focusedId != null
        ? [focusedId]
        : [];
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
        FM.forEach(({ key }) => (snap[key] = effective[key] ?? ""));
        formUndoSnapshotsRef.current.set(id, snap);
        snapshotsToPush.push({ id, snapshot: snap, when: now });
      }
    });
    if (snapshotsToPush.length) {
      setFormUndoStack((prev) => [...prev, ...snapshotsToPush]);
    }
    const ops = ids.map((id) => ({ id, key, value }));
    controller.batchEdit(ops);
  }

  function saveChanges(opts = {}) {
    if (!focusedFeature) return;
    const override = opts.targetIds;
    const idsToUpdate =
      (override && override.length ? override : null) ??
      (selectedIds.size ? Array.from(selectedIds) : [focusedFeature.id]);

    if (!idsToUpdate.length) return;

    const keys = FM.map((f) => f.key);
    const ops = [];
    idsToUpdate.forEach((id) => {
      keys.forEach((k) => {
        if (!changedFields.has(k) && id !== focusedId) return;
        let newVal = editValues[k];
        if (
          ["ar_utbredning", "ar_anteckning", "ar_datum"].includes(k) &&
          newVal === ""
        ) {
          newVal = null;
        }
        ops.push({ id, key: k, value: newVal });
      });
    });

    if (ops.length) controller.batchEdit(ops);

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
    /*if (tableHasPending) {
      window.alert(
        "Du har osparade ändringar i tabelläget. Spara eller ångra dem först."
      );
      return;
    }*/
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
  const canUndo = Boolean(combinedUndoStack?.length || formUndoStack?.length);

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
        tableSearch={tableSearch}
        setTableSearch={setTableSearch}
        formSearch={formSearch}
        setFormSearch={setFormSearch}
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
      />

      {serviceId === "NONE_ID" ? (
        <div style={s.paneWrap}>
          <div style={{ ...s.pane, gridColumn: "1 / -1" }}>
            <div style={s.formEmpty}>Ingen redigeringstjänst vald.</div>
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
        />
      )}
      <NotificationBar s={s} theme={theme} text={notification} />
    </div>
  );
}

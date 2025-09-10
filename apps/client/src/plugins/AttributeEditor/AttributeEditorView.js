// views/AttributeEditorView.js
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { FIELD_META } from "./dummy/DummyData";
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

export default function AttributeEditorView({ state, controller, ui }) {
  // === UI-only ===
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

  // === Wrappers: compat för gamla TableMode/DesktopForm props ===

  // 1) setTablePendingEdits: tar updater(prev) och översätter till batchEdit mot modellen
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
            // Ny "next" saknar key -> vill rensa pending -> sätt till basvärde
            const baseVal = base[key];
            if (prevVal !== undefined) {
              ops.push({ id, key, value: baseVal });
            }
          } else {
            const nextVal = nextRow[key];
            // Skriv-through (modell tar bort pending om = base)
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

  // 2) setTablePendingAdds: uppdaterar drafts + deras __pending (delete/add)
  const setTablePendingAdds = useCallback(
    (updater) => {
      const prev = pendingAdds;
      const next =
        typeof updater === "function"
          ? updater(prev)
          : Array.isArray(updater)
            ? updater
            : prev;

      // indexera
      const byIdPrev = new Map(prev.map((d) => [d.id, d]));
      const byIdNext = new Map(next.map((d) => [d.id, d]));

      // För drafts som finns i båda: jämför fält
      const editOps = [];
      const toggleIdsMark = [];
      const toggleIdsUnmark = [];

      byIdNext.forEach((draftNext, id) => {
        const draftPrev = byIdPrev.get(id);
        if (!draftPrev) return; // nya drafts bör skapas via duplicateRows, inte här

        Object.keys(draftNext).forEach((key) => {
          if (key === "__pending") return;
          const prevVal = draftPrev[key];
          const nextVal = draftNext[key];
          if ((prevVal ?? "") !== (nextVal ?? "")) {
            editOps.push({ id, key, value: nextVal });
          }
        });

        // hantera __pending mark/unmark
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

  // 3) delete toggle (kompat)
  const setDeleteState = useCallback(
    (ids, mode) => controller.toggleDelete(ids, mode),
    [controller]
  );

  // 4) duplicate (kompat)
  const duplicateSelectedRows = useCallback(() => {
    if (!tableSelectedIds.size) return;
    const ids = [...tableSelectedIds];
    const start = state.nextTempId; // nya drafts blir start, start-1, ...
    controller.duplicateRows(ids);
    // välj de nyskapade id:na (negativa)
    if (typeof start === "number") {
      const created = ids.map((_, i) => start - i);
      setTableSelectedIds(new Set(created));
    }
    showNotification(
      `${ids.length} ${ids.length === 1 ? "utkast" : "utkast"} skapade`
    );
  }, [tableSelectedIds, controller, state.nextTempId, showNotification]);

  // --- duplicera i formulärläget ---
  const duplicateInForm = React.useCallback(() => {
    // vilka id:n ska dupliceras?
    const ids = selectedIds.size
      ? Array.from(selectedIds)
      : focusedId != null
        ? [focusedId]
        : [];

    if (!ids.length) return;

    // minnesanteckning om första genererade id:t (negativa)
    const start = state.nextTempId;

    // skapa utkast i modellen
    controller.duplicateRows(ids);

    // välj de nyskapade och sätt fokus – de får id: start, start-1, ...
    if (typeof start === "number") {
      const created = ids.map((_, i) => start - i);
      setSelectedIds(new Set(created));
      setFocusedId(created[0]);
    }

    // stanna kvar i formulärläge och visa en notis
    showNotification(
      `${ids.length} ${ids.length === 1 ? "utkast" : "utkast"} skapade`
    );
  }, [selectedIds, focusedId, controller, state.nextTempId, showNotification]);

  // === Table: filter/sort/search ===
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
      if (p !== 0) return p; // utkast (add) först
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

  const commitTableEdits = useCallback(() => {
    controller.commit();
    formUndoSnapshotsRef.current.clear();
    setFormUndoStack([]);
  }, [controller]);

  const undoLatestTableChange = useCallback(() => {
    if (tableUndoLocal.length) {
      const last = tableUndoLocal[tableUndoLocal.length - 1];
      setTableUndoLocal((prev) => prev.slice(0, -1));

      if (last.type === "edit_cell") {
        // Återställ cellen med en batch in i modellen
        controller.batchEdit([
          { id: last.id, key: last.key, value: last.prevValue },
        ]);
        showNotification("Ångrade celländring");
      } else {
        // Om vi i framtiden skulle lägga andra lokala steg, hantera dem här.
        // För duplicera/radera använder vi modellens undo nedan.
      }
    } else if (state.undoStack?.length) {
      // Inga lokala steg kvar? Falla tillbaka till modellens undo (t.ex. för radera/duplicera)
      controller.undo();
    }
  }, [tableUndoLocal, controller, state.undoStack, showNotification]);

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
      // Utkast
      return pendingAdds.find((d) => d.id === focusedId) || null;
    }
    const base = features.find((f) => f.id === focusedId);
    if (!base) return null;
    return { ...base, ...(pendingEdits[focusedId] || {}) };
  }, [focusedId, features, pendingAdds, pendingEdits]);

  // Sync form vid fokusbyte
  // Synca formuläret ENDAST när fokus byter objekt
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

    FIELD_META.forEach(({ key }) => {
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
    FIELD_META.forEach(({ key }) => {
      if ((effective[key] ?? "") !== (base[key] ?? "")) changed.add(key);
    });
    setChangedFields(changed);
    setDirty(false);
  }, [focusedId, features, pendingAdds, pendingEdits]); // ⬅️ viktigt: enbart fokusbyten triggar

  // Hålla form i sync när model-pending ändras (om inte smutsigt)
  useEffect(() => {
    if (!focusedId || dirty) return;
    const feat = features.find((f) => f.id === focusedId);
    if (!feat) return;

    const base = {};
    const effective = {};
    const patch = pendingEdits[focusedId] || {};

    FIELD_META.forEach(({ key }) => {
      const baseVal = normalize(feat[key]);
      base[key] = baseVal;
      const effVal =
        focusedId < 0
          ? baseVal // drafts: inga pendingEdits; värdet kommer direkt från draft
          : key in patch
            ? normalize(patch[key])
            : baseVal;
      effective[key] = effVal;
    });

    setOriginalValues(base);
    setEditValues(effective);

    const changed = new Set();
    FIELD_META.forEach(({ key }) => {
      if ((effective[key] ?? "") !== (base[key] ?? "")) changed.add(key);
    });
    setChangedFields(changed);
    setDirty(false);
  }, [pendingEdits, features, focusedId, dirty]);

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

    // 1) Existerande + pending edits + ev. delete-markering
    const existing = features.map((f, idx) => {
      let r = { ...f, ...(pendingEdits[f.id] || {}), __idx: idx };
      if (pendingDeletes?.has?.(f.id)) r = { ...r, __pending: "delete" };
      return r;
    });
    // 2) Drafts (pendingAdds) läggs till sist temporärt, de får egen __idx efter existing
    const startIdx = existing.length;
    const drafts = pendingAdds.map((d, i) => ({ ...d, __idx: startIdx + i }));

    const all = [...existing, ...drafts];

    // 3) Filter
    const filtered = all.filter((f) =>
      !sTerm
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
            .some((token) => token.includes(sTerm))
    );

    // 4) Sortera: utkast först, annars stabilt på __idx
    filtered.sort((a, b) => {
      const ap = a.__pending === "add" ? 0 : 1;
      const bp = b.__pending === "add" ? 0 : 1;
      if (ap !== bp) return ap - bp; // utkast överst
      return a.__idx - b.__idx; // stabil ordning i övrigt
    });

    return filtered;
  }, [features, pendingEdits, pendingAdds, pendingDeletes, formSearch]);

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

  // Form: använd write-through (batchEdit) men behåll lokal undo för att kunna ångra senaste fältet
  function handleFieldChange(key, value) {
    // 1) UI: uppdatera fältet + dirty/changedFields
    setEditValues((prev) => ({ ...prev, [key]: value }));

    setChangedFields((prev) => {
      const next = new Set(prev);
      const baseValue = originalValues[key] ?? "";
      if ((value ?? "") !== baseValue) next.add(key);
      else next.delete(key);
      setDirty(next.size > 0);
      return next;
    });

    // 2) Vilka objekt påverkas?
    const ids = selectedIds.size
      ? Array.from(selectedIds)
      : focusedId != null
        ? [focusedId]
        : [];
    if (!ids.length) return;

    // 3) Snapshot: en gång per objekt (för objekt-undo i ett klick)
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
        FIELD_META.forEach(({ key }) => (snap[key] = effective[key] ?? ""));
        formUndoSnapshotsRef.current.set(id, snap);
        snapshotsToPush.push({ id, snapshot: snap, when: Date.now() });
      }
    });
    if (snapshotsToPush.length) {
      setFormUndoStack((prev) => [...prev, ...snapshotsToPush]);
    }

    // 4) Write-through till modellen (så table-mode ser ändringen direkt)
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

    const keys = FIELD_META.map((f) => f.key);
    const ops = [];
    idsToUpdate.forEach((id) => {
      keys.forEach((k) => {
        if (!changedFields.has(k) && id !== focusedId) return;
        let newVal = editValues[k];
        if (["ar_utbredning", "ar_anteckning"].includes(k) && newVal === "") {
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

  function undoLatestFormChange() {
    setFormUndoStack((prev) => {
      if (!prev.length) return prev;
      const { id, snapshot } = prev[prev.length - 1] || {};
      if (id == null || !snapshot) return prev.slice(0, -1);

      // Återställ alla fält via modellen i ett steg
      const ops = FIELD_META.map(({ key }) => ({
        id,
        key,
        value:
          snapshot[key] === "" &&
          (key === "ar_utbredning" || key === "ar_anteckning")
            ? null
            : snapshot[key],
      }));
      controller.batchEdit(ops);

      // Uppdatera formuläret om samma objekt är i fokus
      if (focusedId === id) {
        setEditValues({ ...snapshot });
        const nextChanged = new Set();
        FIELD_META.forEach(({ key }) => {
          if ((snapshot[key] ?? "") !== (originalValues[key] ?? "")) {
            nextChanged.add(key);
          }
        });
        setChangedFields(nextChanged);
        setDirty(nextChanged.size > 0);
      }

      formUndoSnapshotsRef.current.delete(id);
      return prev.slice(0, -1);
    });
  }

  function openInFormFromTable(rowId) {
    controller.setMode("form");
    setSelectedIds(new Set([rowId]));
    setFocusedId(rowId);
  }

  function openSelectedInFormFromTable() {
    if (tableHasPending) {
      window.alert(
        "Du har osparade ändringar i tabelläget. Spara eller ångra dem först."
      );
      return;
    }
    if (tableSelectedIds.size === 0) return;
    controller.setMode("form");

    const selected = new Set(tableSelectedIds);
    setSelectedIds(selected);

    const first =
      filteredAndSorted.find((r) => selected.has(r.id))?.id ??
      Array.from(selected)[0];
    setFocusedId(first);
  }

  return (
    <div style={s.shell}>
      <Toolbar
        s={s}
        isMobile={isMobile}
        mode={ui.mode}
        setMode={controller.setMode}
        dark={ui.dark}
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
      />

      {ui.mode === "table" ? (
        <TableMode
          s={s}
          theme={theme}
          FIELD_META={FIELD_META}
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
          pushTableUndo={pushTableUndo} // <— ge TableMode en riktig push
          tableUndoStack={
            tableUndoLocal.length ? tableUndoLocal : tableUndoStack
          } // <— visa lokala steg om de finns, annars modellens
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
          FIELD_META={FIELD_META}
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
          FIELD_META={FIELD_META}
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
          tableUndoStack={tableUndoStack}
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

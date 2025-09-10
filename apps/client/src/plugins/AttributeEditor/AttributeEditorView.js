import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { FIELD_META, createDummyFeatures } from "./dummy/DummyData";
import { themes, makeStyles } from "./theme/Styles";
import {
  isEditableField,
  getNextGeoidSeed,
  isMissingValue,
  renderInput,
} from "./helpers/helpers";

import Toolbar from "./components/Toolbar";
import TableMode from "./components/TableMode";
import MobileForm from "./components/MobileForm";
import DesktopForm from "./components/DesktopForm";
import NotificationBar from "./helpers/NotificationBar";

export default function AttributeEditorView({ initialFeatures }) {
  /* === Component === */
  const [mode, setMode] = useState("table");
  const [dark, setDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState("list"); // "list" | "form"

  const [tablePendingDeletes, setTablePendingDeletes] = useState(new Set());

  const [tableUndoStack, setTableUndoStack] = useState([]); // [{type, ...payload}]
  const [formUndoStack, setFormUndoStack] = useState([]); // [{key, prevValue}] (per fokus)
  const pushTableUndo = useCallback((entry) => {
    setTableUndoStack((prev) => [...prev, { ...entry, when: Date.now() }]);
  }, []);

  const [tablePendingAdds, setTablePendingAdds] = useState([]); // rows waiting to be saved
  const tempIdRef = useRef(-1); // temporary negative ids for drafts

  // Inline cell editing state
  const [tableEditing, setTableEditing] = useState(null); // { id: number, key: string, startValue: any } | null

  // Pending cell edits for existing rows (not drafts)
  const [tablePendingEdits, setTablePendingEdits] = useState({}); // Record<number, Record<string, any>>
  const tableHasPending =
    tablePendingAdds.length > 0 ||
    Object.keys(tablePendingEdits).length > 0 ||
    tablePendingDeletes.size > 0;

  const theme = dark ? themes.dark : themes.light;
  const s = useMemo(() => makeStyles(theme, isMobile), [theme, isMobile]);

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

  const [nextId, setNextId] = useState(() => {
    const base = initialFeatures ?? createDummyFeatures();
    const max = base.length ? Math.max(...base.map((f) => f.id)) : 0;
    return max + 1;
  });

  const [notification, setNotification] = useState(null);

  // === Table: search, sort & selection and filter ===
  const [tableSearch, setTableSearch] = useState("");
  const [sort, setSort] = useState({ key: "geoid", dir: "asc" });
  const [tableSelectedIds, setTableSelectedIds] = useState(new Set());
  const [lastTableIndex, setLastTableIndex] = useState(null);
  const [lastFormIndex, setLastFormIndex] = useState(null);
  const lastEditTargetIdsRef = useRef(null);
  const [columnFilters, setColumnFilters] = useState({});
  const [openFilterColumn, setOpenFilterColumn] = useState(null);
  const filterOverlayRef = useRef(null);
  const firstColumnRef = useRef(null);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  function undoLatestTableChange() {
    setTableUndoStack((prev) => {
      if (prev.length === 0) return prev;

      const last = prev[prev.length - 1];

      if (last.type === "batch_edit" && Array.isArray(last.ops)) {
        const batchOps = last.ops; // [{id, key, prevValue, isDraft:false}, ...]

        const nonDraft = batchOps.filter((o) => !o.isDraft);
        if (nonDraft.length) {
          setTablePendingEdits((prevEdits) => {
            const next = { ...prevEdits };
            nonDraft.forEach(({ id, key, prevValue }) => {
              const baseVal = (features.find((f) => f.id === id) || {})[key];
              const current = { ...(next[id] || {}) };

              if ((prevValue ?? "") === (baseVal ?? "")) {
                delete current[key];
              } else {
                current[key] = prevValue;
              }

              if (Object.keys(current).length) {
                next[id] = current;
              } else {
                delete next[id];
              }
            });
            return next;
          });

          if (focusedId != null) {
            const relevantOps = nonDraft.filter((op) => op.id === focusedId);
            if (relevantOps.length > 0) {
              setEditValues((prev) => {
                const updated = { ...prev };
                relevantOps.forEach(({ key, prevValue }) => {
                  updated[key] = prevValue ?? "";
                });
                return updated;
              });

              const base = features.find((f) => f.id === focusedId) || {};
              const newChangedFields = new Set();

              setChangedFields(() => {
                relevantOps.forEach(({ key, prevValue }) => {
                  const baseVal = base[key] ?? "";
                  if ((prevValue ?? "") !== baseVal) {
                    newChangedFields.add(key);
                  }
                });
                return newChangedFields;
              });

              setDirty(newChangedFields.size > 0);
            }
          }
        }

        const draftOps = batchOps.filter((o) => o.isDraft);
        if (draftOps.length) {
          setTablePendingAdds((prevAdds) => {
            const byId = new Map(prevAdds.map((d) => [d.id, d]));
            draftOps.forEach(({ id, key, prevValue }) => {
              const draft = byId.get(id);
              if (draft) draft[key] = prevValue ?? null;
            });
            return Array.from(byId.values());
          });
        }

        showNotification(
          `Ångrade ${batchOps.length} ändring${batchOps.length > 1 ? "ar" : ""}`
        );
        return prev.slice(0, -1);
      }

      let opsToUndo = [last];
      let removeCount = 1;

      if (last.type === "edit_cell" && last.groupId) {
        let i = prev.length - 1;
        while (
          i >= 0 &&
          prev[i].type === "edit_cell" &&
          prev[i].groupId === last.groupId
        ) {
          i--;
        }
        opsToUndo = prev.slice(i + 1);
        removeCount = opsToUndo.length;
      }

      const editOps = opsToUndo.filter(
        (op) => op.type === "edit_cell" && !op.isDraft
      );
      if (editOps.length) {
        setTablePendingEdits((prevEdits) => {
          const next = { ...prevEdits };
          editOps.forEach(({ id, key, prevValue }) => {
            const current = { ...(next[id] || {}) };
            const original = features.find((f) => f.id === id)?.[key];
            if (prevValue === original) delete current[key];
            else current[key] = prevValue;
            if (Object.keys(current).length) next[id] = current;
            else delete next[id];
          });
          return next;
        });
      }

      const draftEditOps = opsToUndo.filter(
        (op) => op.type === "edit_cell" && op.isDraft
      );
      if (draftEditOps.length) {
        setTablePendingAdds((prevAdds) => {
          const byId = new Map(prevAdds.map((d) => [d.id, d]));
          draftEditOps.forEach(({ id, key, prevValue }) => {
            const draft = byId.get(id);
            if (draft) draft[key] = prevValue;
          });
          return Array.from(byId.values());
        });
      }

      if (opsToUndo.length === 1) {
        const op = opsToUndo[0];
        if (op.type === "mark_delete") {
          const ids = new Set(op.ids);
          setTablePendingDeletes((prevDel) => {
            const out = new Set(prevDel);
            ids.forEach((id) => out.delete(id));
            return out;
          });
          setTablePendingAdds((prevAdds) =>
            prevAdds.map((d) =>
              ids.has(d.id) ? { ...d, __pending: "add" } : d
            )
          );
        } else if (op.type === "create_drafts") {
          const ids = new Set(op.ids);
          setTablePendingAdds((prevAdds) =>
            prevAdds.filter((d) => !ids.has(d.id))
          );
        }
      }

      const nextStack = prev.slice(0, prev.length - removeCount);
      const n = opsToUndo.length;
      showNotification(`Ångrade ${n} ändring${n > 1 ? "ar" : ""}`);
      return nextStack;
    });
  }

  function undoLatestFormChange() {
    setFormUndoStack((prev) => {
      if (prev.length === 0) return prev;

      const nextStack = prev.slice(0, -1);
      const { key, prevValue } = prev[prev.length - 1];

      setEditValues((vals) => ({ ...vals, [key]: prevValue }));

      if (focusedId != null) {
        setTablePendingEdits((prevEdits) => {
          const next = { ...prevEdits };
          const baseVal = (features.find((f) => f.id === focusedId) || {})[key];
          const current = { ...(next[focusedId] || {}) };

          if ((prevValue ?? "") === (baseVal ?? "")) {
            delete current[key];
          } else {
            current[key] = prevValue;
          }

          if (Object.keys(current).length) next[focusedId] = current;
          else delete next[focusedId];

          return next;
        });
      }

      setChangedFields((cf) => {
        const next = new Set(cf);
        const baseVal = originalValues[key] ?? "";
        if ((prevValue ?? "") !== baseVal) next.add(key);
        else next.delete(key);
        return next;
      });
      setDirty(nextStack.length > 0);

      const label = FIELD_META.find((f) => f.key === key)?.label || key;
      showNotification(`Ångrade fältändring: ${label}`);
      return nextStack;
    });
  }

  function setDeleteState(ids, mode /* 'toggle' | 'mark' | 'unmark' */) {
    const idsSet = new Set(ids.map(Number));

    setTablePendingAdds((prev) =>
      prev.map((d) =>
        idsSet.has(d.id)
          ? {
              ...d,
              __pending:
                mode === "toggle"
                  ? d.__pending === "delete"
                    ? "add"
                    : "delete"
                  : mode === "mark"
                    ? "delete"
                    : "add",
            }
          : d
      )
    );

    setTablePendingDeletes((prev) => {
      const next = new Set(prev);
      features.forEach((f) => {
        if (!idsSet.has(f.id)) return;
        if (mode === "toggle") {
          next.has(f.id) ? next.delete(f.id) : next.add(f.id);
        } else if (mode === "mark") {
          next.add(f.id);
        } else {
          next.delete(f.id);
        }
      });
      return next;
    });

    pushTableUndo({ type: "mark_delete", ids: Array.from(idsSet) });
  }

  const duplicateSelectedRows = () => {
    if (tableSelectedIds.size === 0) return;

    const newDrafts = [];

    features.forEach((f) => {
      if (tableSelectedIds.has(f.id)) {
        const draft = {
          ...f,
          id: tempIdRef.current--, // temp negative for drafts
          __pending: "add",
          ar_anteckning: f.ar_anteckning
            ? `${f.ar_anteckning} (kopia)`
            : "(kopia)",
        };

        // Clear all read-only fields (e.g. geoid) so they are counted as missing
        FIELD_META.forEach((m) => {
          if (m.readOnly) draft[m.key] = null;
        });

        newDrafts.push(draft);
      }
    });

    if (newDrafts.length === 0) return;

    setTablePendingAdds((prev) => [...prev, ...newDrafts]);
    setTableSelectedIds(new Set(newDrafts.map((d) => d.id)));

    if (newDrafts.length) {
      pushTableUndo({ type: "create_drafts", ids: newDrafts.map((d) => d.id) });
    }

    showNotification(
      `${newDrafts.length} ${newDrafts.length === 1 ? "utkast" : "utkast"} skapade`
    );
  };

  function commitTableEdits() {
    if (!tableHasPending) return;

    let currentNextId = nextId;

    setFeatures((prev) => {
      const withEdits = prev.map((f) =>
        tablePendingEdits[f.id] ? { ...f, ...tablePendingEdits[f.id] } : f
      );

      const afterDeletes = withEdits.filter(
        (f) => !tablePendingDeletes.has(f.id)
      );

      let nextGeoid = getNextGeoidSeed(afterDeletes);

      const committedAdds = tablePendingAdds
        .filter((p) => p.__pending !== "delete")
        .map((p) => {
          const needsGeoid = p.geoid == null || p.geoid === "";
          return {
            ...p,
            id: currentNextId++,
            geoid: needsGeoid ? nextGeoid++ : p.geoid,
            __pending: undefined,
          };
        });

      return [...afterDeletes, ...committedAdds];
    });

    const committedAddsCount = tablePendingAdds.filter(
      (p) => p.__pending !== "delete"
    ).length;
    setNextId((n) => n + committedAddsCount);
    setTablePendingAdds([]);
    setTablePendingEdits({});
    setTablePendingDeletes(new Set());
    setTableEditing(null);
    setTableSelectedIds(new Set());
    setTableUndoStack([]);

    const parts = [];
    if (Object.keys(tablePendingEdits).length) parts.push("ändringar");
    if (tablePendingDeletes.size) parts.push("raderingar");
    if (committedAddsCount) parts.push("utkast");
    showNotification(`Sparade ${parts.join(" + ")}`);
  }

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

  const allRows = useMemo(() => {
    const editedFeatures = features.map((f) => {
      const patch = tablePendingEdits[f.id];
      let row = patch ? { ...f, ...patch } : f;
      if (tablePendingDeletes?.has(f.id)) {
        row = { ...row, __pending: "delete" };
      }
      return row;
    });
    return [...editedFeatures, ...tablePendingAdds];
  }, [features, tablePendingAdds, tablePendingEdits, tablePendingDeletes]);

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

    const cmp = (x, y) => {
      const ax = x ?? "";
      const by = y ?? "";
      const nx = Number(ax),
        ny = Number(by);
      const bothNum = Number.isFinite(nx) && Number.isFinite(ny);
      return bothNum
        ? nx - ny
        : String(ax).localeCompare(String(by), "sv", {
            numeric: true,
            sensitivity: "base",
          });
    };
    rows.sort((a, b) => {
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
  const [dirty, setDirty] = useState(false);

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
          if (next.has(rowId)) next.delete(rowId);
          else next.add(rowId);
        } else {
          next = new Set([rowId]);
        }
        setLastFormIndex(rowIndex);
        return next;
      });
    },
    [visibleFormList, lastFormIndex, handleBeforeChangeFocus]
  );

  useEffect(() => {
    if (!focusedId) {
      setEditValues({});
      setOriginalValues({});
      setChangedFields(new Set());
      setDirty(false);
      setFormUndoStack([]);
      return;
    }

    const feat = features.find((f) => f.id === focusedId);
    if (!feat) return;

    const base = {};
    const effective = {};
    const patch = tablePendingEdits[focusedId] || {};

    FIELD_META.forEach(({ key }) => {
      const baseVal = normalize(feat[key]);
      base[key] = baseVal;
      const effVal = key in patch ? normalize(patch[key]) : baseVal;
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
    setFormUndoStack([]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedId]);

  useEffect(() => {
    if (!focusedId || dirty) return;

    const feat = features.find((f) => f.id === focusedId);
    if (!feat) return;

    const base = {};
    const effective = {};
    const patch = tablePendingEdits[focusedId] || {};

    FIELD_META.forEach(({ key }) => {
      const baseVal = normalize(feat[key]);
      base[key] = baseVal;
      const effVal = key in patch ? normalize(patch[key]) : baseVal;
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
  }, [tablePendingEdits, features, focusedId, dirty]);

  function normalize(v) {
    return v == null ? "" : v;
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
      if (dirty && focusedId != null) {
        saveChanges({ toPending: true, targetIds: [focusedId] });
      }
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
      if (dirty && focusedId != null) {
        saveChanges({ toPending: true, targetIds: [focusedId] });
      }
      setFocusedId(newId);
      setTimeout(() => {
        document
          .querySelector(`[data-row-id="${newId}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 0);
    }
  }

  function handleBeforeChangeFocus(targetId) {
    const prevId = focusedId;
    if (dirty && prevId != null) {
      setChangedFields(new Set());
      setDirty(false);
      setFormUndoStack([]);
    }

    setFocusedId(targetId);
  }

  function saveChanges(opts = {}) {
    if (!focusedFeature) return;
    const override = opts.targetIds;
    const idsToUpdate =
      (override && override.length ? override : null) ??
      (selectedIds.size ? Array.from(selectedIds) : [focusedFeature.id]);

    if (!idsToUpdate.length) return;

    const keys = FIELD_META.map((f) => f.key);
    const norm = (v) => (v == null ? "" : v);
    const batchOps = []; // [{ id, key, prevValue, isDraft:false }, ...]

    setTablePendingEdits((prev) => {
      const next = { ...prev };

      idsToUpdate.forEach((id) => {
        const base = features.find((f) => f.id === id) || {};
        const current = { ...(next[id] || {}) };
        keys.forEach((k) => {
          if (!changedFields.has(k) && id !== focusedId) return;
          let newVal = editValues[k];
          if (["ar_utbredning", "ar_anteckning"].includes(k) && newVal === "") {
            newVal = null;
          }

          const baseVal = base[k];
          const previousPendingVal = prev[id]?.[k];
          const diff = norm(newVal) !== norm(baseVal);

          if (diff) {
            const prevValue =
              previousPendingVal !== undefined ? previousPendingVal : baseVal;
            current[k] = newVal;

            if (norm(newVal) !== norm(prevValue)) {
              batchOps.push({ id, key: k, prevValue, isDraft: false });
            }
          } else {
            delete current[k];
          }
        });

        if (Object.keys(current).length) next[id] = current;
        else delete next[id];
      });

      return next;
    });

    // Lägg in EN batch i undo-stack ENDAST om det faktiskt finns ändringar
    if (batchOps.length > 0) {
      pushTableUndo({
        type: "batch_edit",
        ops: batchOps,
        when: Date.now(),
      });
    }

    // Nollställ lokala formflaggor
    setChangedFields(new Set());
    setDirty(false);
    setFormUndoStack([]);

    if (batchOps.length > 0) {
      showNotification(
        idsToUpdate.length > 1
          ? `Ändringar buffrade för ${idsToUpdate.length} objekt`
          : "Ändringar buffrade"
      );
    }
  }

  function resetEdits() {
    if (!focusedFeature) return;
    setEditValues({ ...originalValues });
    setChangedFields(new Set());
    setDirty(false);
  }

  function handleFieldChange(key, value) {
    const currentValue = editValues[key] ?? "";

    // Lägg bara till i undo-stack om värdet faktiskt ändras
    if (value !== currentValue) {
      setFormUndoStack((stack) => [
        ...stack,
        {
          key,
          prevValue: currentValue,
          when: Date.now(),
        },
      ]);
    }

    setEditValues((prev) => ({ ...prev, [key]: value }));

    setChangedFields((prev) => {
      const next = new Set(prev);
      const baseValue = originalValues[key] ?? "";
      if ((value ?? "") !== baseValue) {
        next.add(key);
      } else {
        next.delete(key);
      }
      setDirty(next.size > 0);
      return next;
    });

    const ids = selectedIds.size
      ? Array.from(selectedIds)
      : focusedId != null
        ? [focusedId]
        : [];

    if (ids.length) {
      lastEditTargetIdsRef.current = ids;
    }

    // Uppdatera tablePendingEdits direkt när vi ändrar
    if (ids.length) {
      setTablePendingEdits((prev) => {
        const next = { ...prev };
        ids.forEach((id) => {
          const base = features.find((f) => f.id === id) || {};
          const current = { ...(next[id] || {}) };
          const baseVal = base[key];

          // Lägg till i undo-stack om detta är första gången vi ändrar detta värde
          if (!(id in prev) || !(key in (prev[id] || {}))) {
            pushTableUndo({
              type: "batch_edit",
              ops: [{ id, key, prevValue: baseVal, isDraft: false }],
              when: Date.now(),
            });
          }

          if ((value ?? "") === (baseVal ?? "")) {
            delete current[key];
          } else {
            current[key] = value;
          }

          if (Object.keys(current).length) {
            next[id] = current;
          } else {
            delete next[id];
          }
        });
        return next;
      });
    }
  }

  function openInFormFromTable(rowId) {
    setMode("form");
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
    setMode("form");

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
        mode={mode}
        setMode={setMode}
        dark={dark}
        setDark={setDark}
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
      {mode === "table" ? (
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
          tablePendingEdits={tablePendingEdits}
          setTablePendingEdits={setTablePendingEdits}
          setTablePendingAdds={setTablePendingAdds}
          isEditableField={isEditableField}
          isMissingValue={isMissingValue}
          handleRowClick={handleRowClick}
          openInFormFromTable={openInFormFromTable}
          firstColumnRef={firstColumnRef}
          filterOverlayRef={filterOverlayRef}
          setDeleteState={setDeleteState}
          tablePendingDeletes={tablePendingDeletes}
          pushTableUndo={pushTableUndo}
          tablePendingAdds={tablePendingAdds}
          tableUndoStack={tableUndoStack}
          undoLatestTableChange={undoLatestTableChange}
        />
      ) : isMobile ? (
        <MobileForm
          s={s}
          theme={theme}
          isMobile={isMobile}
          mode={mode}
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
          tablePendingDeletes={tablePendingDeletes}
          setDeleteState={setDeleteState}
          tableHasPending={tableHasPending}
          commitTableEdits={commitTableEdits}
          tableUndoStack={tableUndoStack}
          undoLatestTableChange={undoLatestTableChange}
          formUndoStack={formUndoStack}
          undoLatestFormChange={undoLatestFormChange}
          tablePendingEdits={tablePendingEdits}
          tablePendingAdds={tablePendingAdds}
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
          tablePendingDeletes={tablePendingDeletes}
          commitTableEdits={commitTableEdits}
          tableUndoStack={tableUndoStack}
          undoLatestTableChange={undoLatestTableChange}
          formUndoStack={formUndoStack}
          undoLatestFormChange={undoLatestFormChange}
          setDeleteState={setDeleteState}
          tablePendingEdits={tablePendingEdits}
          tablePendingAdds={tablePendingAdds}
          lastEditTargetIdsRef={lastEditTargetIdsRef}
        />
      )}
      {<NotificationBar s={s} theme={theme} text={notification} />}
    </div>
  );
}

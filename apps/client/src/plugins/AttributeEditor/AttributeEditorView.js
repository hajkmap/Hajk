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
      const nextStack = prev.slice(0, -1);
      const op = prev[prev.length - 1];
      if (!op) return prev;

      switch (op.type) {
        case "mark_delete": {
          const ids = new Set(op.ids);
          // 1) remove delete marking from existing rows
          setTablePendingDeletes((prevDel) => {
            const out = new Set(prevDel);
            ids.forEach((id) => out.delete(id));
            return out;
          });
          // 2) drafts that were marked delete: back to "add"
          setTablePendingAdds((prevAdds) =>
            prevAdds.map((d) =>
              ids.has(d.id) ? { ...d, __pending: "add" } : d
            )
          );
          break;
        }
        case "create_drafts": {
          const ids = new Set(op.ids);
          setTablePendingAdds((prevAdds) =>
            prevAdds.filter((d) => !ids.has(d.id))
          );
          break;
        }
        case "edit_cell": {
          const { id, key, prevValue, isDraft } = op;
          if (isDraft) {
            setTablePendingAdds((prevAdds) =>
              prevAdds.map((d) =>
                d.id === id ? { ...d, [key]: prevValue } : d
              )
            );
          } else {
            setTablePendingEdits((prev) => {
              const next = { ...prev };
              const current = { ...(next[id] || {}) };
              const original = features.find((f) => f.id === id)?.[key];
              if (prevValue === original) {
                delete current[key];
              } else {
                current[key] = prevValue;
              }
              if (Object.keys(current).length) next[id] = current;
              else delete next[id];
              return next;
            });
          }
          break;
        }
        default:
          break;
      }

      showNotification("Senaste åtgärden ångrades");
      return nextStack;
    });
  }

  function undoLatestFormChange() {
    setFormUndoStack((prev) => {
      if (prev.length === 0) return prev;

      const nextStack = prev.slice(0, -1);
      const { key, prevValue } = prev[prev.length - 1];

      // Roll back a field
      setEditValues((vals) => ({ ...vals, [key]: prevValue }));

      // Update changed/dirtiness
      setChangedFields((cf) => {
        const next = new Set(cf);
        if ((prevValue ?? "") !== (originalValues[key] ?? "")) next.add(key);
        else next.delete(key);
        setDirty(next.size > 0);
        return next;
      });

      const label = FIELD_META.find((f) => f.key === key)?.label || key;
      showNotification(`Ångrade fältändring: ${label}`);

      return nextStack;
    });
  }

  function markDeleteOnlyByIds(ids) {
    if (!ids?.length) return;
    const idsNum = ids.map((x) => Number(x)); // normalize

    // Drafts: set __pending = "delete" if they exist among adds
    setTablePendingAdds((prev) =>
      prev.map((d) =>
        idsNum.includes(d.id) ? { ...d, __pending: "delete" } : d
      )
    );

    // Existing: add to pendingDeletes (no toggle, just add)
    setTablePendingDeletes((prev) => {
      const next = new Set(prev);
      idsNum.forEach((id) => next.add(id));
      return next;
    });

    // Undo step for just this deletion marking
    pushTableUndo({ type: "mark_delete", ids: idsNum });
  }

  function toggleDeleteSelectedRows(idsOverride) {
    const idsSet =
      idsOverride instanceof Set
        ? idsOverride
        : Array.isArray(idsOverride)
          ? new Set(idsOverride)
          : new Set(Array.from(tableSelectedIds));

    if (idsSet.size === 0) return;

    setTablePendingAdds((prev) =>
      prev.map((d) =>
        idsSet.has(d.id)
          ? { ...d, __pending: d.__pending === "delete" ? "add" : "delete" }
          : d
      )
    );

    setTablePendingDeletes((prev) => {
      const next = new Set(prev);
      features.forEach((f) => {
        if (!idsSet.has(f.id)) return;
        next.has(f.id) ? next.delete(f.id) : next.add(f.id);
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
  const [applyToSelection, setApplyToSelection] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (focusedFeature) {
      const patch = tablePendingEdits[focusedFeature.id] || {};
      const fresh = {};
      FIELD_META.forEach(({ key }) => {
        const base = focusedFeature[key];
        const val = key in patch ? patch[key] : base;
        fresh[key] = normalize(val);
      });
      setEditValues(fresh);
      setOriginalValues(fresh);
      setChangedFields(new Set());
      setDirty(false);
      setFormUndoStack([]);
    } else {
      setEditValues({});
      setOriginalValues({});
      setChangedFields(new Set());
      setDirty(false);
      setFormUndoStack([]);
    }
  }, [focusedFeature, tablePendingEdits]);

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
      if (dirty) saveChanges({ applyToSelection: false, toPending: true });
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
      if (dirty) saveChanges({ applyToSelection: false, toPending: true });
      setFocusedId(newId);
      setTimeout(() => {
        document
          .querySelector(`[data-row-id="${newId}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 0);
    }
  }

  function handleBeforeChangeFocus(targetId) {
    if (dirty) saveChanges({ applyToSelection: false, toPending: true });
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
    const toPending = opts.toPending ?? false;

    const idsToUpdate =
      applyMany && selectedIds.size
        ? Array.from(selectedIds)
        : [focusedFeature.id];

    if (toPending) {
      setTablePendingEdits((prev) => {
        const next = { ...prev };
        idsToUpdate.forEach((id) => {
          const base = features.find((f) => f.id === id) || {};
          const patchCandidate = projectToFeature(editValues, true);
          const cleaned = { ...patchCandidate };
          Object.keys(cleaned).forEach((k) => {
            if (cleaned[k] === base[k]) delete cleaned[k];
          });
          if (Object.keys(cleaned).length) {
            next[id] = { ...(next[id] || {}), ...cleaned };
            Object.keys(cleaned).forEach((key) => {
              const prevValue = base[key];
              pushTableUndo({
                type: "edit_cell",
                id,
                key,
                prevValue,
                isDraft: false,
              });
            });
          } else {
            delete next[id];
          }
        });
        return next;
      });

      setOriginalValues({ ...editValues });
      setChangedFields(new Set());
      setDirty(false);

      showNotification(
        applyMany && idsToUpdate.length > 1
          ? `Ändringar buffrade för ${idsToUpdate.length} objekt`
          : "Ändringar buffrade"
      );
      return;
    }

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
    setFormUndoStack([]);

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
    setFormUndoStack((stack) => {
      const prevVal = editValues[key] ?? "";
      return value === prevVal
        ? stack
        : [...stack, { key, prevValue: prevVal, when: Date.now() }];
    });

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

    setApplyToSelection(selected.size > 1);
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
          toggleDeleteSelectedRows={toggleDeleteSelectedRows}
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
          toggleSelect={toggleSelect}
          focusPrev={focusPrev}
          focusNext={focusNext}
          focusedFeature={focusedFeature}
          FIELD_META={FIELD_META}
          changedFields={changedFields}
          editValues={editValues}
          handleFieldChange={handleFieldChange}
          renderInput={renderInput}
          applyToSelection={applyToSelection}
          setApplyToSelection={setApplyToSelection}
          dirty={dirty}
          resetEdits={resetEdits}
          saveChanges={saveChanges}
          tablePendingDeletes={tablePendingDeletes}
          onDeleteSelected={(ids) => markDeleteOnlyByIds(ids)}
          tableHasPending={tableHasPending}
          commitTableEdits={commitTableEdits}
          tableUndoStack={tableUndoStack}
          undoLatestTableChange={undoLatestTableChange}
          formUndoStack={formUndoStack}
          undoLatestFormChange={undoLatestFormChange}
          tablePendingEdits={tablePendingEdits}
          tablePendingAdds={tablePendingAdds}
        />
      ) : (
        <DesktopForm
          s={s}
          theme={theme}
          visibleFormList={visibleFormList}
          selectedIds={selectedIds}
          toggleSelect={toggleSelect}
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
          applyToSelection={applyToSelection}
          setApplyToSelection={setApplyToSelection}
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
          onDeleteSelected={(ids) => markDeleteOnlyByIds(ids)}
          tablePendingEdits={tablePendingEdits}
          tablePendingAdds={tablePendingAdds}
        />
      )}
      {<NotificationBar s={s} theme={theme} text={notification} />}
    </div>
  );
}

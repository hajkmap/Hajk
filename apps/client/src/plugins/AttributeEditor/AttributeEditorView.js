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

  const [tablePendingAdds, setTablePendingAdds] = useState([]); // rows waiting to be saved
  const tempIdRef = useRef(-1); // temporary negative ids for drafts

  // Inline cell editing state
  const [tableEditing, setTableEditing] = useState(null); // { id: number, key: string, startValue: any } | null

  // Pending cell edits for existing rows (not drafts)
  const [tablePendingEdits, setTablePendingEdits] = useState({}); // Record<number, Record<string, any>>
  const tableHasPending =
    tablePendingAdds.length > 0 || Object.keys(tablePendingEdits).length > 0;

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

    showNotification(
      `${newDrafts.length} ${newDrafts.length === 1 ? "utkast" : "utkast"} skapade`
    );
  };

  function commitTableEdits() {
    if (!tableHasPending) return;

    // 1) Apply cell edits to existing rows
    const hadEdits = Object.keys(tablePendingEdits).length > 0;
    if (hadEdits) {
      setFeatures((prev) =>
        prev.map((f) =>
          tablePendingEdits[f.id] ? { ...f, ...tablePendingEdits[f.id] } : f
        )
      );
    }

    // 2) Commit drafts (adds)
    const hadAdds = tablePendingAdds.length > 0;
    if (hadAdds) {
      let currentNextId = nextId;

      let nextGeoid = getNextGeoidSeed(features);

      const committedAdds = tablePendingAdds.map((p) => {
        const needsGeoid = p.geoid == null || p.geoid === "";
        return {
          ...p,
          id: currentNextId++,
          geoid: needsGeoid ? nextGeoid++ : p.geoid,
          __pending: undefined,
        };
      });

      setFeatures((prev) => [...prev, ...committedAdds]);
      setNextId(currentNextId);
    }

    // 3) Reset pending states
    setTablePendingAdds([]);
    setTablePendingEdits({});
    setTableEditing(null);
    setTableSelectedIds(new Set());

    const parts = [];
    if (hadEdits) parts.push("ändringar");
    if (hadAdds) parts.push("utkast");
    showNotification(`Sparade ${parts.join(" + ")}`);
  }

  function revertTableEdits() {
    if (!tableHasPending) return;
    setTablePendingAdds([]);
    setTablePendingEdits({});
    setTableEditing(null);
    setTableSelectedIds(new Set());
    showNotification("Osparade ändringar ångrade");
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
      return patch ? { ...f, ...patch } : f;
    });
    return [...editedFeatures, ...tablePendingAdds];
  }, [features, tablePendingAdds, tablePendingEdits]);

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
          revertTableEdits={revertTableEdits}
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
        />
      ) : isMobile ? (
        <MobileForm
          s={s}
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
        />
      ) : (
        <DesktopForm
          s={s}
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
        />
      )}
      {<NotificationBar s={s} theme={theme} text={notification} />}
    </div>
  );
}

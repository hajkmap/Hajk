import LocalStorageHelper from "../../utils/LocalStorageHelper";
import { editBus } from "../../buses/editBus";

export const Action = {
  INIT: "INIT",
  BATCH_EDIT: "BATCH_EDIT", // { ops: [{ id, key, value }] }
  DUPLICATE_ROWS: "DUPLICATE_ROWS", // { ids, readOnlyKeys: string[], annotateField?: string }
  SET_DELETE_STATE: "SET_DELETE_STATE", // { ids, mode: 'toggle'|'mark'|'unmark' }
  COMMIT: "COMMIT",
  UNDO: "UNDO",
  CREATE_DRAFTS: "CREATE_DRAFTS",
};

export const MAX_UNDO = 100;

const initialState = {
  features: [],
  featuresMap: new Map(), // O(1) lookup by id
  nextId: 1,
  nextTempId: -1,

  pendingAdds: [], // [{ id: -1, __pending: 'add'|'delete', ... }]
  pendingEdits: {}, // { [id]: { [key]: value } }
  pendingDeletes: new Set(), // Set<number>

  undoStack: [], // [{ label, inverse: Array<InverseOp> }]
};

const buildFeaturesMap = (features) => {
  const map = new Map();
  for (const f of features) {
    map.set(f.id, f);
    map.set(String(f.id), f); // string version
    const n = Number(f.id);
    if (Number.isFinite(n)) map.set(n, f); // numeric version
  }
  return map;
};

const isEmpty = (v) => v === null || v === undefined || v === "";

const getNextGeoidSeed = (source) => {
  const nums = source
    .map((f) => Number(f.geoid))
    .filter((n) => Number.isFinite(n));
  return nums.length ? Math.max(...nums) + 1 : 1;
};

const clampUndo = (stack) =>
  stack.length > MAX_UNDO ? stack.slice(-MAX_UNDO) : stack;

const pushUndo = (state, label, inverseOps) => ({
  ...state,
  undoStack: clampUndo([
    ...state.undoStack,
    { label, inverse: inverseOps, when: Date.now() },
  ]),
});

// InverseOps: { kind: 'edit'|'draft_edit'|'delete_state'|'create_drafts', payload: {...} }
const applyEditToExisting = (state, id, key, value, suppressUndo = false) => {
  const base = state.featuresMap.get(id); // O(1) lookup
  const prevPending = state.pendingEdits[id]?.[key];
  const effectivePrev = prevPending !== undefined ? prevPending : base?.[key];

  if ((value ?? "") === (effectivePrev ?? "")) return state;

  const nextPendingEdits = { ...state.pendingEdits };
  const curr = { ...(nextPendingEdits[id] || {}) };

  if ((value ?? "") === (base?.[key] ?? "")) delete curr[key];
  else curr[key] = value;
  if (Object.keys(curr).length) nextPendingEdits[id] = curr;
  else delete nextPendingEdits[id];

  let next = { ...state, pendingEdits: nextPendingEdits };
  if (!suppressUndo) {
    next = pushUndo(next, "Edit", [
      { kind: "edit", payload: { id, key, value: effectivePrev } },
    ]);
  }
  return next;
};

const applyEditToDraft = (state, id, key, value, suppressUndo = false) => {
  const idx = state.pendingAdds.findIndex((d) => d.id === id);
  if (idx === -1) return state;
  const draft = state.pendingAdds[idx];
  const prev = draft[key];
  if ((value ?? "") === (prev ?? "")) return state;

  const nextAdds = state.pendingAdds.slice();
  nextAdds[idx] = { ...draft, [key]: value };

  let next = { ...state, pendingAdds: nextAdds };
  if (!suppressUndo) {
    next = pushUndo(next, "Edit draft", [
      { kind: "draft_edit", payload: { id, key, value: prev } },
    ]);
  }
  return next;
};

const applyInverse = (state, op) => {
  switch (op.kind) {
    case "delete_state_batch": {
      const { pendingDeletes, drafts } = op.payload;
      const restoredDel = new Set(pendingDeletes);
      const restoredAdds = state.pendingAdds.map((d) => {
        const had = Object.prototype.hasOwnProperty.call(drafts, d.id);
        const v = had ? drafts[d.id] : d.__pending;
        return v === d.__pending ? d : { ...d, __pending: v };
      });
      return {
        ...state,
        pendingDeletes: restoredDel,
        pendingAdds: restoredAdds,
      };
    }
    case "edit": {
      const { id, key, value } = op.payload;
      return applyEditToExisting(state, id, key, value, true);
    }
    case "draft_edit": {
      const { id, key, value } = op.payload;
      return applyEditToDraft(state, id, key, value, true);
    }
    case "delete_state": {
      const { ids, modeBefore, draftsBefore } = op.payload;
      const nextDel = new Set(state.pendingDeletes);
      ids.forEach((id) => {
        if (id < 0) return;
        if (modeBefore === "mark") nextDel.add(id);
        else if (modeBefore === "unmark") nextDel.delete(id);
      });
      const nextAdds = state.pendingAdds.map((d) => {
        const m = draftsBefore?.[d.id];
        return m !== undefined ? { ...d, __pending: m } : d;
      });
      return { ...state, pendingDeletes: nextDel, pendingAdds: nextAdds };
    }
    case "create_drafts": {
      const { createdIds } = op.payload;
      return {
        ...state,
        pendingAdds: state.pendingAdds.filter(
          (d) => !createdIds.includes(d.id)
        ),
      };
    }
    default:
      return state;
  }
};

const reducer = (state, action) => {
  switch (action.type) {
    case Action.INIT: {
      const features = action.features || [];
      const numericIds = features
        .map((f) => Number(f.id))
        .filter((n) => Number.isFinite(n));
      const max = numericIds.length ? Math.max(...numericIds) : 0;
      return {
        ...initialState,
        features,
        featuresMap: buildFeaturesMap(features),
        nextId: max + 1,
      };
    }

    case Action.CREATE_DRAFTS: {
      const { rows = [] } = action;
      if (!rows.length) return state;

      let nextTempId = state.nextTempId; // starts at -1, -2, ...
      const drafts = rows.map((r) => {
        const id = nextTempId--;
        return { ...r, id, __pending: "add" };
      });

      return pushUndo(
        {
          ...state,
          pendingAdds: [...state.pendingAdds, ...drafts],
          nextTempId,
        },
        `Create drafts (${drafts.length})`,
        [
          {
            kind: "create_drafts",
            payload: { createdIds: drafts.map((d) => d.id) },
          },
        ]
      );
    }

    case Action.BATCH_EDIT: {
      const { ops } = action; // [{id, key, value}]
      if (!ops?.length) return state;

      let s = state;
      ops.forEach(({ id, key, value }) => {
        if (id < 0) {
          s = applyEditToDraft(s, id, key, value, true);
        } else {
          s = applyEditToExisting(s, id, key, value, true);
        }
      });

      return s;
    }

    case Action.DUPLICATE_ROWS: {
      const { ids, readOnlyKeys = [], annotateField } = action;
      if (!ids?.length) return state;

      const drafts = [];
      let nextTempId = state.nextTempId;

      ids.forEach((id) => {
        const base = state.featuresMap.get(id); // O(1) lookup
        if (!base) return;

        // Merge base row with pending edits to get the effective row
        const effective = { ...base, ...(state.pendingEdits[id] || {}) };
        const copy = { ...effective };

        readOnlyKeys.forEach((k) => {
          copy[k] = null;
        });
        if (annotateField) {
          const prev = copy[annotateField];
          copy[annotateField] = prev ? `${prev} (kopia)` : "(kopia)";
        }
        drafts.push({ ...copy, id: nextTempId--, __pending: "add" });
      });

      if (!drafts.length) return state;
      return pushUndo(
        {
          ...state,
          pendingAdds: [...state.pendingAdds, ...drafts],
          nextTempId,
        },
        `Create drafts (${drafts.length})`,
        [
          {
            kind: "create_drafts",
            payload: { createdIds: drafts.map((d) => d.id) },
          },
        ]
      );
    }

    case Action.SET_DELETE_STATE: {
      const { ids = [], mode = "toggle" } = action;
      if (!ids.length) return state;

      const before = {
        pendingDeletes: new Set(state.pendingDeletes),
        drafts: Object.fromEntries(
          state.pendingAdds.map((d) => [d.id, d.__pending])
        ),
      };

      const idsSet = new Set(ids);

      const nextAdds = state.pendingAdds.map((d) => {
        if (!idsSet.has(d.id)) return d;
        const nextPending =
          mode === "toggle"
            ? d.__pending === "delete"
              ? "add"
              : "delete"
            : mode === "mark"
              ? "delete"
              : "add";
        return { ...d, __pending: nextPending };
      });

      const nextDel = new Set(state.pendingDeletes);
      state.features.forEach((f) => {
        if (!idsSet.has(f.id)) return;
        if (mode === "toggle") {
          nextDel.has(f.id) ? nextDel.delete(f.id) : nextDel.add(f.id);
        } else if (mode === "mark") {
          nextDel.add(f.id);
        } else {
          nextDel.delete(f.id);
        }
      });

      return pushUndo(
        { ...state, pendingAdds: nextAdds, pendingDeletes: nextDel },
        "Toggle delete",
        [
          {
            kind: "delete_state_batch",
            payload: before,
          },
        ]
      );
    }

    case Action.COMMIT: {
      // 1) apply edits
      const withEdits = state.features.map((f) =>
        state.pendingEdits[f.id] ? { ...f, ...state.pendingEdits[f.id] } : f
      );
      // 2) remove deletes (existing)
      const afterDeletes = withEdits.filter(
        (f) => !state.pendingDeletes.has(f.id)
      );
      // 3) add drafts not marked delete
      let nextId = state.nextId;
      let nextGeoid = getNextGeoidSeed(afterDeletes);
      const committedAdds = state.pendingAdds
        .filter((d) => d.__pending !== "delete")
        .map((d) => ({
          ...d,
          id: nextId++,
          geoid: isEmpty(d.geoid) ? nextGeoid++ : d.geoid,
          __pending: undefined,
        }));

      const newFeatures = [...afterDeletes, ...committedAdds];
      return {
        ...state,
        features: newFeatures,
        featuresMap: buildFeaturesMap(newFeatures),
        nextId,
        pendingAdds: [],
        pendingEdits: {},
        pendingDeletes: new Set(),
        undoStack: [],
      };
    }

    case Action.UNDO: {
      if (!state.undoStack.length) return state;
      const last = state.undoStack[state.undoStack.length - 1];
      let s = state;
      last.inverse.forEach((op) => {
        s = applyInverse(s, op);
      });
      return {
        ...s,
        undoStack: state.undoStack.slice(0, -1),
      };
    }

    default:
      return state;
  }
};

export default class AttributeEditorModel {
  #map;
  #app;
  #storageKey;
  #fieldMeta;
  #ogc;
  #layerProjection = null;
  #lastFeatureCollection = null;
  #listeners = new Set();
  #state = { ...initialState };

  constructor(settings) {
    this.#ogc = settings.ogc || null;
    this.#map = settings.map;
    this.#app = settings.app;
    this.#storageKey = "AttributeEditor";
    this.#fieldMeta = settings.fieldMeta || null;
    const initFeatures = settings.initialFeatures || [];
    const numericInit = initFeatures
      .map((f) => Number(f.id))
      .filter((n) => Number.isFinite(n));
    const max = numericInit.length ? Math.max(...numericInit) : 0;

    // featuresMap must mirror features from the start — leaving it as the
    // empty initialState Map breaks id lookups (DUPLICATE_ROWS, edit
    // baselines) for rows passed via initialFeatures.
    this.#state = {
      ...initialState,
      features: initFeatures,
      featuresMap: buildFeaturesMap(initFeatures),
      nextId: max + 1,
    };
  }

  // === Getters/setters ===
  getFieldMetadata = () => this.#fieldMeta || [];
  getFeatureCollection = () => this.#lastFeatureCollection;
  clearFeatureCollection = () => {
    this.#lastFeatureCollection = null;
  };
  getLayerProjection = () => this.#layerProjection || "EPSG:3006";

  // === API data normalization ===
  normalizeApiFeatures = (payload) => {
    // Payload is FeatureCollection: { type, features: [ { id, properties, geometry } ] }
    const raw = Array.isArray(payload) ? payload : (payload?.features ?? []);
    return raw.map((f, i) => {
      const props = f?.properties ?? {};
      const id = f?.id ?? props?.id ?? i + 1;
      // NOTE: the props spread comes last ON PURPOSE — when the layer has an
      // attribute column literally named "id", that value wins over the fid
      // and becomes the row id. Feature<->row bridges all over the plugin
      // (styleFn/buildVizSet in AttributeEditor.jsx, the DragBox visibility
      // check, the Sketch hook's deleted-ids mirror, TableMode's selection
      // reconciliation) extract the "id" property first and assume row ids
      // live in that same space. Letting the fid win here breaks map
      // selection on such layers (WFS-T addressing still works: the fid is
      // derived from the id/pk column, and formatFeatureId bridges the
      // suffix). Do not flip this without reworking those bridges too.
      return { id, ...props };
    });
  };

  // === Heuristic field metadata ===
  inferFieldMetaFromFeatures = (rows = []) => {
    const nRows = rows.length;
    const keys = new Set();
    rows.forEach((r) => Object.keys(r).forEach((k) => keys.add(k)));
    const samples = {};
    const nullCounts = {};
    const maxLen = {};
    keys.forEach((k) => {
      samples[k] = new Set();
      nullCounts[k] = 0;
      maxLen[k] = 0;
    });

    rows.slice(0, 300).forEach((r) => {
      keys.forEach((k) => {
        const v = r[k];
        if (v === null || v === undefined || v === "") {
          nullCounts[k] += 1;
          return;
        }
        const s = String(v);
        if (samples[k].size < 50) samples[k].add(s);
        if (s.length > maxLen[k]) maxLen[k] = s.length;
      });
    });

    const isDateLike = (s) => /^\d{4}-\d{2}-\d{2}/.test(String(s || ""));
    const isDateTime = (s) =>
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(String(s || ""));

    const isParagraphish = (k) =>
      maxLen[k] >= 80 || // Long fields (e.g. descriptions)
      Array.from(samples[k]).some((t) => /\r\n|\n\r|\n|\r/.test(t)); // Line breaks

    const meta = Array.from(keys).map((k) => {
      const arr = Array.from(samples[k]);
      const uniq = arr.length;
      const nullRate = nRows ? nullCounts[k] / nRows : 0;

      const hasDateTime = arr.some(isDateTime);
      const hasDate = arr.some(isDateLike);
      const isPara = isParagraphish(k);
      const enumCandidate =
        nRows >= 50 &&
        uniq > 0 &&
        uniq <= 6 &&
        uniq / Math.max(1, nRows) <= 0.1 &&
        nullRate < 0.5 &&
        arr.every((v) => v.length <= 24);

      const m = { key: k, label: k };

      if (hasDateTime) {
        m.type = "datetime"; // Has time component
      } else if (hasDate) {
        m.type = "date"; // Date only
      } else if (isPara) {
        m.type = "textarea";
      } else if (enumCandidate) {
        m.type = "select";
        m.options = arr.sort((a, b) =>
          String(a).localeCompare(String(b), "sv")
        );
      }

      // Mark ID fields as read-only
      if (["id", "geoid", "oracle_geoid"].includes(k)) m.readOnly = true;
      return m;
    });

    return meta;
  };

  // === Load data from service ===
  loadFromService = async (serviceId, extraParams = {}, { signal } = {}) => {
    if (!this.#ogc)
      throw new Error("OGC API missing (inject via settings.ogc)");

    const payload = await this.#ogc.fetchWfstFeatures(
      serviceId,
      {
        limit: 10000,
        ...extraParams,
      },
      { signal }
    );

    if (signal?.aborted) return null;

    this.#lastFeatureCollection = payload;

    // The fetch hit the feature cap — the layer likely contains more objects
    // than were loaded. Let the UI warn the user instead of silently showing
    // a truncated dataset.
    if (payload?.limitReached) {
      editBus.emit("attrib:load-truncated", {
        limit: payload.limitReached,
        count: payload.features?.length ?? 0,
      });
    }

    // Store layer's native projection for coordinate transformations
    // Backend provides: layerProjection (from layer config) or crsName (actual data CRS)
    if (payload.layerProjection || payload.crsName) {
      this.#layerProjection = payload.layerProjection || payload.crsName;
    }

    const rows = this.normalizeApiFeatures(payload);
    const fieldMeta = this.inferFieldMetaFromFeatures(rows);

    // Apply defaultValue from layer config (set in Admin) to each field
    const configFields = [
      ...(payload.layerConfig?.editableFields || []),
      ...(payload.layerConfig?.nonEditableFields || []),
    ];
    for (const cf of configFields) {
      const fm = fieldMeta.find((m) => m.key === cf.name);
      if (!fm) continue;
      if (cf.defaultValue != null && cf.defaultValue !== "")
        fm.defaultValue = cf.defaultValue;
      if (cf.textType === "positive") fm.min = 1;
      if (cf.textType === "negative") fm.max = -1;
      if (cf.hidden === true) fm.hidden = true;
    }

    if (signal?.aborted) return null;

    this.#state = reducer(this.#state, { type: Action.INIT, features: rows });

    this.setFieldMetadata(fieldMeta);

    this.#emit();

    return { features: rows, fieldMeta, featureCollection: payload };
  };

  setAttributeEditorKeyInStorage = (key, value) => {
    LocalStorageHelper.set(this.#storageKey, {
      ...LocalStorageHelper.get(this.#storageKey),
      [key]: value,
    });
  };

  getMap = () => this.#map;
  getApp = () => this.#app;

  setFieldMetadata = (meta) => {
    this.#fieldMeta = meta;
  };
  readOnlyKeys = () =>
    Array.isArray(this.#fieldMeta)
      ? this.#fieldMeta.filter((m) => m.readOnly).map((m) => m.key)
      : [];

  getSnapshot = () => this.#state;
  subscribe = (listener) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };
  #emit() {
    this.#listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.warn("AttributeEditorModel: listener error", e);
      }
    });
  }

  dispatch = (action) => {
    const next = reducer(this.#state, action);
    if (next !== this.#state) {
      this.#state = next;
      this.#emit();
    }
  };

  #makeDraftFromFeature = (feature, fieldMeta = []) => {
    const props = feature?.getProperties ? feature.getProperties() : {};
    const rest = Object.fromEntries(
      Object.entries(props).filter(([k]) => k !== "geometry")
    );
    const fmKeys = Array.isArray(fieldMeta) ? fieldMeta.map((m) => m.key) : [];

    const fmByKey = Array.isArray(fieldMeta)
      ? Object.fromEntries(fieldMeta.map((m) => [m.key, m]))
      : {};

    const row = {};
    if (fmKeys.length) {
      fmKeys.forEach((k) => {
        if (k === "id") return; // id is set in reducer
        row[k] = rest[k] ?? fmByKey[k]?.defaultValue ?? null;
      });
    } else {
      Object.keys(rest).forEach((k) => {
        if (k === "id") return;
        row[k] = rest[k] ?? fmByKey[k]?.defaultValue ?? null;
      });
    }
    return row;
  };

  addDraftFromFeature = (feature) => {
    const draft = this.#makeDraftFromFeature(feature, this.#fieldMeta);
    this.dispatch({ type: Action.CREATE_DRAFTS, rows: [draft] });
    // temp-id just created = nextTempId + 1 (we decremented in the reducer)
    return this.#state.nextTempId + 1; // negativt id: -1, -2, ...
  };
}

import LocalStorageHelper from "../../utils/LocalStorageHelper";

export const Action = {
  INIT: "INIT",
  EDIT: "EDIT", // { id, key, value }
  BATCH_EDIT: "BATCH_EDIT", // { ops: [{ id, key, value }] }
  DUPLICATE_ROWS: "DUPLICATE_ROWS", // { ids, readOnlyKeys: string[], annotateField?: string }
  SET_DELETE_STATE: "SET_DELETE_STATE", // { ids, mode: 'toggle'|'mark'|'unmark' }
  COMMIT: "COMMIT",
  UNDO: "UNDO",
  CREATE_DRAFTS: "CREATE_DRAFTS",
  REMOVE_DRAFTS: "REMOVE_DRAFTS",
};

export const MAX_UNDO = 100;

const initialState = {
  features: [],
  nextId: 1,
  nextTempId: -1,

  pendingAdds: [], // [{ id: -1, __pending: 'add'|'delete', ... }]
  pendingEdits: {}, // { [id]: { [key]: value } }
  pendingDeletes: new Set(), // Set<number>

  undoStack: [], // [{ label, inverse: Array<InverseOp> }]
  redoStack: [],
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
  redoStack: [],
});

// InverseOps: { kind: 'edit'|'draft_edit'|'delete_state'|'create_drafts', payload: {...} }
const applyEditToExisting = (state, id, key, value, suppressUndo = false) => {
  const base = state.features.find((f) => f.id === id);
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
    case "restore_drafts": {
      const { drafts } = op.payload;
      const minNeg = Math.min(...drafts.map((d) => d.id), state.nextTempId);
      return {
        ...state,
        nextTempId: Math.min(state.nextTempId, minNeg),
        pendingAdds: [...state.pendingAdds, ...drafts],
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
      return { ...initialState, features, nextId: max + 1 };
    }

    case Action.CREATE_DRAFTS: {
      const { rows = [] } = action;
      if (!rows.length) return state;

      let nextTempId = state.nextTempId; // startar på -1, -2, ...
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

    case Action.REMOVE_DRAFTS: {
      const ids = new Set(action.ids || []);
      if (!ids.size) return state;

      const removed = state.pendingAdds.filter((d) => ids.has(d.id));
      if (!removed.length) return state;

      // ta bort från pendingAdds
      const nextAdds = state.pendingAdds.filter((d) => !ids.has(d.id));

      // undo: kunna ångra borttagningen genom att återskapa utkasten
      return pushUndo(
        { ...state, pendingAdds: nextAdds },
        `Remove drafts (${removed.length})`,
        [
          {
            kind: "restore_drafts",
            payload: { drafts: removed },
          },
        ]
      );
    }

    case Action.EDIT: {
      const { id, key, value } = action;
      if (id < 0) return applyEditToDraft(state, id, key, value);
      return applyEditToExisting(state, id, key, value);
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
        const base = state.features.find((f) => f.id === id);
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

      return {
        ...state,
        features: [...afterDeletes, ...committedAdds],
        nextId,
        pendingAdds: [],
        pendingEdits: {},
        pendingDeletes: new Set(),
        undoStack: [],
        redoStack: [],
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
        redoStack: [...state.redoStack, last],
      };
    }

    default:
      return state;
  }
};

export const selectors = {
  selectHasPending: (s) =>
    s.pendingAdds.length > 0 ||
    Object.keys(s.pendingEdits).length > 0 ||
    s.pendingDeletes.size > 0,

  selectAllRows: (s) => {
    const edited = s.features.map((f) =>
      s.pendingEdits[f.id] ? { ...f, ...s.pendingEdits[f.id] } : f
    );
    const marked = edited.map((f) =>
      s.pendingDeletes.has(f.id) ? { ...f, __pending: "delete" } : f
    );
    return [...marked, ...s.pendingAdds];
  },

  selectEffectiveFeature: (s, id) => {
    if (id == null) return null;
    const base = s.features.find((f) => f.id === id);
    if (!base) return null;
    return { ...base, ...(s.pendingEdits[id] || {}) };
  },

  selectEffectiveList: (s) =>
    s.features.map((f) => ({ ...f, ...(s.pendingEdits[f.id] || {}) })),
};

export default class AttributeEditorModel {
  #map;
  #app;
  #localObserver;
  #storageKey;
  #fieldMeta;
  #ogc;
  #layerProjection = null;

  _lastFeatureCollection = null;

  constructor(settings) {
    this.#ogc = settings.ogc || null;
    this.#map = settings.map;
    this.#app = settings.app;
    this.#localObserver = settings.localObserver;
    this.#storageKey = "AttributeEditor";
    this.#fieldMeta = settings.fieldMeta || null;
    this._listeners = new Set();
    const initFeatures = settings.initialFeatures || [];
    const numericInit = initFeatures
      .map((f) => Number(f.id))
      .filter((n) => Number.isFinite(n));
    const max = numericInit.length ? Math.max(...numericInit) : 0;

    this._state = {
      ...initialState,
      features: initFeatures,
      nextId: max + 1,
    };

    this.#initSubscriptions();
  }

  // === Getters/setters ===
  getFieldMetadata = () => this.#fieldMeta || [];
  getFeatureCollection = () => this._lastFeatureCollection;
  clearFeatureCollection = () => {
    this._lastFeatureCollection = null;
  };
  getLayerProjection = () => this.#layerProjection || "EPSG:3006";

  // === API data normalization ===
  normalizeApiFeatures = (payload) => {
    // Payload is FeatureCollection: { type, features: [ { id, properties, geometry } ] }
    const raw = Array.isArray(payload) ? payload : (payload?.features ?? []);
    return raw.map((f, i) => {
      const props = f?.properties ?? {};
      const id = f?.id ?? props?.id ?? i + 1;
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

      // Detect date/datetime types
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

    // Fetch feature collection from backend (pass signal to allow cancellation)
    const payload = await this.#ogc.fetchWfstFeatures(
      serviceId,
      {
        limit: 10000,
        ...extraParams,
      },
      { signal }
    );

    // If aborted after fetch, don't update state
    if (signal?.aborted) return null;

    this._lastFeatureCollection = payload;

    // Store layer's native projection for coordinate transformations
    if (payload.layerProjection) {
      this.#layerProjection = payload.layerProjection;
    }

    // Normalize data to table rows and infer field metadata
    const rows = this.normalizeApiFeatures(payload);
    const fieldMeta = this.inferFieldMetaFromFeatures(rows);

    // Final abort check before updating state
    if (signal?.aborted) return null;

    // Initialize state with fetched features
    this._state = reducer(this._state, { type: Action.INIT, features: rows });

    // Set field metadata in the model
    this.setFieldMetadata(fieldMeta);

    // Notify subscribers (UI updates)
    this._emit();

    return { features: rows, fieldMeta, featureCollection: payload };
  };

  #initSubscriptions = () => {
    this.#localObserver.subscribe(
      "AttributeEditorEvent",
      this.#handleAttributeEditorEvent
    );
  };

  #handleAttributeEditorEvent = (message = "") => {
    console.log(`AttributeEditor-event caught in model! Message: ${message}`);
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

  getSnapshot = () => this._state;
  subscribe = (listener) => {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  };
  _emit() {
    this._listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.warn("AttributeEditorModel: listener error", e);
      }
    });
  }

  dispatch = (action) => {
    const next = reducer(this._state, action);
    if (next !== this._state) {
      this._state = next;
      this._emit();
    }
  };

  // Plocka ut attribut från en OL Feature (utan geometry)
  _makeDraftFromFeature = (feature, fieldMeta = []) => {
    const props = feature?.getProperties ? feature.getProperties() : {};
    const { geometry, ...rest } = props;
    const fmKeys = Array.isArray(fieldMeta) ? fieldMeta.map((m) => m.key) : [];

    const row = {};
    if (fmKeys.length) {
      fmKeys.forEach((k) => {
        if (k === "id") return; // id sätts i reducer
        row[k] = rest[k] ?? null; // null → visas som tomt / “#saknas” för readOnly
      });
    } else {
      Object.keys(rest).forEach((k) => {
        if (k === "id") return;
        row[k] = rest[k] ?? null;
      });
    }
    return row;
  };

  addDraftFromFeature = (feature) => {
    const draft = this._makeDraftFromFeature(feature, this.#fieldMeta);
    this.dispatch({ type: Action.CREATE_DRAFTS, rows: [draft] });
    // temp-id som just skapades = nextTempId + 1 (vi dekrementerade i reducern)
    return this._state.nextTempId + 1; // negativt id: -1, -2, ...
  };
}

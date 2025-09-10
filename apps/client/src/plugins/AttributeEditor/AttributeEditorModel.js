import LocalStorageHelper from "../../utils/LocalStorageHelper";

export const Action = {
  INIT: "INIT",
  EDIT: "EDIT", // { id, key, value }
  BATCH_EDIT: "BATCH_EDIT", // { ops: [{ id, key, value }] }
  DUPLICATE_ROWS: "DUPLICATE_ROWS", // { ids, readOnlyKeys: string[], annotateField?: string }
  SET_DELETE_STATE: "SET_DELETE_STATE", // { ids, mode: 'toggle'|'mark'|'unmark' }
  COMMIT: "COMMIT",
  UNDO: "UNDO",
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
      const max = features.length ? Math.max(...features.map((f) => f.id)) : 0;
      return { ...initialState, features, nextId: max + 1 };
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
        const src = state.features.find((f) => f.id === id);
        if (!src) return;
        const copy = { ...src };
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

      const beforeDeletes = new Set(state.pendingDeletes);
      const draftsBefore = {};
      state.pendingAdds.forEach((d) => {
        draftsBefore[d.id] = d.__pending;
      });

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

      const perIdInverse = [];
      ids.forEach((id) => {
        if (id < 0) return;
        const wasMarked = beforeDeletes.has(id);
        perIdInverse.push({
          kind: "delete_state",
          payload: {
            ids: [id],
            modeBefore: wasMarked ? "mark" : "unmark",
            draftsBefore: {},
          },
        });
      });

      const inverseForDrafts = {
        kind: "delete_state",
        payload: {
          ids: ids.filter((id) => id < 0),
          modeBefore: null,
          draftsBefore,
        },
      };

      return pushUndo(
        { ...state, pendingAdds: nextAdds, pendingDeletes: nextDel },
        "Toggle delete",
        [...perIdInverse, inverseForDrafts]
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

  constructor(settings) {
    this.#map = settings.map;
    this.#app = settings.app;
    this.#localObserver = settings.localObserver;
    this.#storageKey = "AttributeEditor";
    this.#fieldMeta = settings.fieldMeta || null;
    this._listeners = new Set();
    const initFeatures = settings.initialFeatures || [];
    const max = initFeatures.length
      ? Math.max(...initFeatures.map((f) => f.id))
      : 0;

    this._state = {
      ...initialState,
      features: initFeatures,
      nextId: max + 1,
    };

    this.#initSubscriptions();
  }

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
        /* eslint-disable no-empty */
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
}

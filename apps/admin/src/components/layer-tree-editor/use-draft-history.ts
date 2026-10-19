import { useEffect, useState } from "react";

import type { MapBackgroundLayer } from "../../api/layer-tree";
import type { LayerTreeDraft, LayerTreeFlatNode } from "./layer-tree-model";
import type { LayerTreeSettings } from "./layer-tree-settings";

/** How many changes back Ctrl+Z goes. */
const MAX_STEPS = 50;

/** Undo and redo, as the toolbar shows them. */
export interface LayerTreeHistoryControls {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/** What the editor shows, whole: its draft or, without one, the saved tree. */
export interface LayerTreeEditorState {
  nodes: LayerTreeFlatNode[];
  settings: LayerTreeSettings;
  background: MapBackgroundLayer[];
  /** Layer ids, top first, as the draw order list shows them. */
  drawOrder: string[];
}

interface History {
  /** The tree the history belongs to; another one starts afresh. */
  owner: string;
  /** The saved version the steps go with; null until the tree is loaded. */
  version: number | null;
  past: LayerTreeEditorState[];
  future: LayerTreeEditorState[];
  /** The draft last set from here, to tell when the page changed it. */
  last: LayerTreeDraft | null;
}

interface UseDraftHistoryOptions {
  /** Which tree, e.g. "map:map_1". */
  owner: string;
  /** The saved tree's version; null while it loads. */
  savedVersion: number | null;
  /** Whether this tab saved that version of the tree itself. */
  savedHere: (version: number) => boolean;
  draft: LayerTreeDraft | null;
  onDraftChange: (draft: LayerTreeDraft | null) => void;
  /** What the editor shows now. */
  current: LayerTreeEditorState;
  /** The draft that shows a state; none when the state is the saved tree. */
  draftFor: (state: LayerTreeEditorState) => LayerTreeDraft | null;
  /** While saving, the keys do nothing. */
  disabled: boolean;
}

/**
 * Ctrl+Z is the editor's when nothing has the focus or its window or move
 * zone (marked data-layer-tree-editor) has, but not in a field: text fields
 * keep their own, and the rest of the page (a group's other settings, a
 * dialog) is left alone.
 */
const isEditorKey = (target: EventTarget | null) =>
  target === document.body ||
  (target instanceof HTMLElement &&
    !target.isContentEditable &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) &&
    target.closest("[data-layer-tree-editor]") !== null);

/** Saving this draft creates groups; a step back to before it would again. */
const createsGroups = (draft: LayerTreeDraft | null) =>
  draft?.nodes.some((node) => node.data.isNew) ?? false;

const fresh = (
  owner: string,
  version: number | null,
  last: LayerTreeDraft | null,
): History => ({ owner, version, past: [], future: [], last });

/**
 * Undo and redo for the editor's changes (Ctrl+Z, and Ctrl+Y or
 * Ctrl+Shift+Z), also back past the saves made here: a step back to before a
 * save is a draft again, saved like any other, and a step forward to what was
 * saved leaves nothing to save. A new change after stepping back drops the
 * steps forward. Starts afresh in another tree, when the editor closes, when
 * the page drops a draft it hasn't just saved (as on a reload after a refused
 * save), when a version this tab didn't save is loaded, and after a save that
 * created groups.
 */
export function useDraftHistory({
  owner,
  savedVersion,
  savedHere,
  draft,
  onDraftChange,
  current,
  draftFor,
  disabled,
}: UseDraftHistoryOptions): LayerTreeHistoryControls & {
  change: (draft: LayerTreeDraft | null) => void;
} {
  const [history, setHistory] = useState<History>(() =>
    fresh(owner, savedVersion, draft),
  );

  // Kept in step with the page and the saved tree while rendering.
  let next = history;
  if (next.owner !== owner) next = fresh(owner, savedVersion, draft);
  // While the tree loads again it has no version yet; wait for it.
  if (savedVersion !== null) {
    if (next.version !== savedVersion) {
      const keep =
        next.version !== null &&
        savedHere(savedVersion) &&
        !createsGroups(next.last);
      next = keep
        ? { ...next, version: savedVersion }
        : { ...next, version: savedVersion, past: [], future: [] };
    }
    if (draft !== next.last) {
      // The page dropped the draft this tab just saved: the steps stay. A
      // newer version saved by someone else (a reload after a refused save)
      // starts afresh, or a step back would be saved over their change.
      const saved =
        draft === null &&
        next.last !== null &&
        savedHere(savedVersion) &&
        next.last.version < savedVersion;
      next = saved
        ? { ...next, last: null }
        : fresh(owner, savedVersion, draft);
    }
  }
  if (next !== history) setHistory(next);

  const canUndo = next.past.length > 0;
  const canRedo = next.future.length > 0;

  const change = (target: LayerTreeDraft | null) => {
    if (target === draft) return;
    setHistory({
      ...next,
      past: [...next.past, current].slice(-MAX_STEPS),
      future: [],
      last: target,
    });
    onDraftChange(target);
  };

  const go = (
    state: LayerTreeEditorState,
    past: LayerTreeEditorState[],
    future: LayerTreeEditorState[],
  ) => {
    const target = draftFor(state);
    setHistory({ ...next, past, future, last: target });
    onDraftChange(target);
  };

  const undo = () => {
    if (!canUndo) return;
    go(next.past[next.past.length - 1], next.past.slice(0, -1), [
      current,
      ...next.future,
    ]);
  };

  const redo = () => {
    if (!canRedo) return;
    const [state, ...rest] = next.future;
    go(state, [...next.past, current], rest);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        disabled ||
        !(event.ctrlKey || event.metaKey) ||
        !isEditorKey(event.target)
      ) {
        return;
      }
      const letter = event.key.toLowerCase();
      if (letter === "z" && !event.shiftKey && canUndo) {
        event.preventDefault();
        undo();
      } else if (
        ((letter === "z" && event.shiftKey) || letter === "y") &&
        canRedo
      ) {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return { change, undo, redo, canUndo, canRedo };
}

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
  /** When the saved tree it was made on was saved. */
  savedAt: string | null;
  past: LayerTreeEditorState[];
  future: LayerTreeEditorState[];
  /** The draft last set from here, to tell when the page changed it. */
  last: LayerTreeDraft | null;
}

interface UseDraftHistoryOptions {
  /** Which tree, e.g. "map:map_1". */
  owner: string;
  /** When the saved tree shown was saved. */
  savedAt: string | null;
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
  savedAt: string | null,
  last: LayerTreeDraft | null,
): History => ({
  owner,
  savedAt,
  past: [],
  future: [],
  last,
});

/**
 * Undo and redo for the editor's changes (Ctrl+Z, and Ctrl+Y or
 * Ctrl+Shift+Z), also back past the saves made here: a step back to before a
 * save is a draft again, saved like any other, and a step forward to what was
 * saved leaves nothing to save. A new change after stepping back drops the
 * steps forward. Starts afresh in another tree, when the editor closes, when
 * the page sets a draft of its own, after a save that created groups, and
 * when a save made elsewhere is loaded.
 */
export function useDraftHistory({
  owner,
  savedAt,
  draft,
  onDraftChange,
  current,
  draftFor,
  disabled,
}: UseDraftHistoryOptions): LayerTreeHistoryControls & {
  change: (draft: LayerTreeDraft | null) => void;
} {
  const [history, setHistory] = useState<History>(() =>
    fresh(owner, savedAt, draft),
  );

  // Kept in step with the page while rendering.
  let next = history;
  if (next.owner !== owner) next = fresh(owner, savedAt, draft);
  if (next.savedAt !== savedAt) {
    // The saved tree changed. Saved from the draft here, the steps stay;
    // loaded without a draft, from a save made elsewhere, a step back would
    // undo that save.
    next =
      next.last !== null ? { ...next, savedAt } : fresh(owner, savedAt, draft);
  }
  if (draft !== next.last) {
    // The page dropped the draft, as when it has saved it: the steps stay,
    // unless the save created groups, which a step back would create again.
    next =
      draft === null && next.last !== null && !createsGroups(next.last)
        ? { ...next, last: null }
        : fresh(owner, savedAt, draft);
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

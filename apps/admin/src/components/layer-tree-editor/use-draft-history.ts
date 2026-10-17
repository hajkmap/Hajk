import { useEffect, useState } from "react";

import type { LayerTreeDraft } from "./layer-tree-model";

/** How many changes back Ctrl+Z goes. */
const MAX_STEPS = 50;

/** Undo and redo, as the toolbar shows them. */
export interface LayerTreeHistoryControls {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface History {
  /** What the history belongs to; another one starts afresh. */
  key: unknown;
  past: (LayerTreeDraft | null)[];
  future: (LayerTreeDraft | null)[];
  /** The draft last set from here, to tell when the page changed it. */
  last: LayerTreeDraft | null;
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

/**
 * Undo and redo for the editor's changes (Ctrl+Z, and Ctrl+Y or
 * Ctrl+Shift+Z). Starts afresh when the saved tree is loaded again or the
 * page sets the draft itself, as when it saves or cancels.
 */
export function useDraftHistory(
  draft: LayerTreeDraft | null,
  onDraftChange: (draft: LayerTreeDraft | null) => void,
  key: unknown,
): LayerTreeHistoryControls & {
  change: (draft: LayerTreeDraft | null) => void;
} {
  const [history, setHistory] = useState<History>({
    key,
    past: [],
    future: [],
    last: draft,
  });
  if (history.key !== key || history.last !== draft) {
    setHistory({ key, past: [], future: [], last: draft });
  }

  const change = (next: LayerTreeDraft | null) => {
    if (next === draft) return;
    setHistory({
      key,
      past: [...history.past, draft].slice(-MAX_STEPS),
      future: [],
      last: next,
    });
    onDraftChange(next);
  };

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const undo = () => {
    if (!canUndo) return;
    const previous = history.past[history.past.length - 1];
    setHistory({
      key,
      past: history.past.slice(0, -1),
      future: [draft, ...history.future],
      last: previous,
    });
    onDraftChange(previous);
  };

  const redo = () => {
    if (!canRedo) return;
    const [next, ...rest] = history.future;
    setHistory({
      key,
      past: [...history.past, draft],
      future: rest,
      last: next,
    });
    onDraftChange(next);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !isEditorKey(event.target)) {
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

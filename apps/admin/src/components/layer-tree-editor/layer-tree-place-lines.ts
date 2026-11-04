import { createContext } from "react";

import type { LayerTreeClickPart } from "./layer-tree-model";

/** The row and the part of it the pointer is over, in click and place. */
export interface LayerTreeHover {
  id: string;
  part: LayerTreeClickPart;
}

/**
 * Where the pointer is over the tree. It is kept outside React state, so a
 * move re-renders only the lines it leaves and reaches, not the whole tree.
 */
export function createHoverStore() {
  let hover: LayerTreeHover | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => hover,
    set: (next: LayerTreeHover | null) => {
      if (next?.id === hover?.id && next?.part === hover?.part) return;
      hover = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type LayerTreeHoverStore = ReturnType<typeof createHoverStore>;

/** Click and place while something is held: where it would go, and if it may. */
export interface LayerTreePlaceLines {
  hover: LayerTreeHoverStore;
  lineAt: (
    nodeId: string,
    part: LayerTreeClickPart,
  ) => { part: LayerTreeClickPart; ok: boolean } | null;
}

export const LayerTreePlaceLinesContext =
  createContext<LayerTreePlaceLines | null>(null);

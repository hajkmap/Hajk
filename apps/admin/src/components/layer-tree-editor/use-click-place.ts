import { useEffect, useState } from "react";

import type { LayerTreeCatalogItem } from "./layer-tree-model";

/** What is held in click and place, and where it was picked. */
export type LayerTreeClickPick =
  | { source: "catalog"; items: LayerTreeCatalogItem[] }
  | { source: "tree"; nodeIds: string[] }
  | { source: "zone"; keys: string[] };

/**
 * Lagerordning's click and place: pick in the catalog, the tree or the move
 * zone (Ctrl or Cmd adds to what is held from the same place), then click
 * where it goes. Escape lets go.
 */
export function useClickPlace(enabled: boolean) {
  const [on, setOn] = useState(false);
  const [pick, setPick] = useState<LayerTreeClickPick | null>(null);
  const active = enabled && on;

  useEffect(() => {
    if (!active || !pick) return;
    const letGo = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPick(null);
    };
    window.addEventListener("keydown", letGo);
    return () => window.removeEventListener("keydown", letGo);
  }, [active, pick]);

  /** A click picks one thing; again lets go; with Ctrl or Cmd adds or drops it. */
  function toggled<T>(
    held: T[] | undefined,
    value: T,
    same: (a: T, b: T) => boolean,
    additive: boolean,
  ): T[] {
    if (additive && held) {
      return held.some((other) => same(other, value))
        ? held.filter((other) => !same(other, value))
        : [...held, value];
    }
    return held?.length === 1 && same(held[0], value) ? [] : [value];
  }

  return {
    active,
    on,
    toggle: () => {
      setOn((current) => !current);
      setPick(null);
    },
    pick: active ? pick : null,
    clear: () => setPick(null),
    pickCatalog: (item: LayerTreeCatalogItem, additive: boolean) =>
      setPick((current) => {
        const items = toggled(
          current?.source === "catalog" ? current.items : undefined,
          item,
          (a, b) => a.kind === b.kind && a.id === b.id,
          additive,
        );
        return items.length > 0 ? { source: "catalog", items } : null;
      }),
    pickTree: (nodeId: string, additive: boolean) =>
      setPick((current) => {
        const nodeIds = toggled(
          current?.source === "tree" ? current.nodeIds : undefined,
          nodeId,
          (a, b) => a === b,
          additive,
        );
        return nodeIds.length > 0 ? { source: "tree", nodeIds } : null;
      }),
    pickZone: (key: string, additive: boolean) =>
      setPick((current) => {
        const keys = toggled(
          current?.source === "zone" ? current.keys : undefined,
          key,
          (a, b) => a === b,
          additive,
        );
        return keys.length > 0 ? { source: "zone", keys } : null;
      }),
  };
}

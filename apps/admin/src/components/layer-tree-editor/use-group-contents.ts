import { useMemo } from "react";

import { useLayerTreePlacements } from "../../api/layer-tree";

export interface LayerTreeGroupContents {
  /** Layers in the group, those in nested groups included. */
  layers: number;
  /** Groups inside the group, at any depth. */
  groups: number;
}

/**
 * What each group holds in the layer tree model, counted through nested
 * groups as the editor does. Built from the placements ("layer X is in group
 * G" turned around), so it needs no request of its own.
 */
export function useGroupContents() {
  const { data: placements } = useLayerTreePlacements();

  return useMemo(() => {
    const directLayers = new Map<string, number>();
    const childGroups = new Map<string, string[]>();
    for (const placement of Object.values(placements?.layers ?? {})) {
      for (const parent of placement.groups) {
        directLayers.set(parent.id, (directLayers.get(parent.id) ?? 0) + 1);
      }
    }
    for (const [groupId, placement] of Object.entries(
      placements?.groups ?? {},
    )) {
      for (const parent of placement.groups) {
        childGroups.set(parent.id, [
          ...(childGroups.get(parent.id) ?? []),
          groupId,
        ]);
      }
    }

    const count = (
      groupId: string,
      path: Set<string>,
    ): LayerTreeGroupContents => {
      const contents = { layers: directLayers.get(groupId) ?? 0, groups: 0 };
      for (const child of childGroups.get(groupId) ?? []) {
        // The backend stops a group from holding itself; this guards old data.
        if (path.has(child)) continue;
        const inner = count(child, new Set(path).add(child));
        contents.layers += inner.layers;
        contents.groups += 1 + inner.groups;
      }
      return contents;
    };

    return (groupId: string) => count(groupId, new Set([groupId]));
  }, [placements]);
}

import type { LayerSwitcherTreeNode } from "../../../api/groups";

export interface GroupCompositionStats {
  layerCount: number;
  nestedGroupCount: number;
  nestingLevel: number;
}

export function computeGroupCompositionStats(
  tree: LayerSwitcherTreeNode[] | undefined,
  directLayerCount = 0,
): GroupCompositionStats {
  if (!tree?.length) {
    return {
      layerCount: directLayerCount,
      nestedGroupCount: 0,
      nestingLevel: 1,
    };
  }

  let layerCount = 0;
  let nestedGroupCount = 0;

  const walk = (nodes: LayerSwitcherTreeNode[]) => {
    for (const node of nodes) {
      if (node.type === "layer") {
        layerCount += 1;
      } else {
        nestedGroupCount += 1;
        if (node.children?.length) {
          walk(node.children);
        }
      }
    }
  };

  walk(tree);

  const maxGroupDepth = (
    nodes: LayerSwitcherTreeNode[],
    depth: number,
  ): number => {
    let max = 0;
    for (const node of nodes) {
      if (node.type === "group") {
        max = Math.max(max, depth + 1);
        if (node.children?.length) {
          max = Math.max(max, maxGroupDepth(node.children, depth + 1));
        }
      }
    }
    return max;
  };

  const groupDepth = maxGroupDepth(tree, 0);
  const nestingLevel = groupDepth === 0 ? 1 : groupDepth + 1;

  return {
    layerCount: layerCount || directLayerCount,
    nestedGroupCount,
    nestingLevel,
  };
}

/** Catalog composition shown in lists and DnD source panels. */
export interface GroupCatalogMeta {
  layerCount?: number;
  nestedGroupCount?: number;
  nestingLevel?: number;
  /** Map placement: toggled = "Toggla alla-knapp" in legacy admin. */
  toggleAllEnabled?: boolean;
}

export function groupToCatalogMeta(group: {
  layerCount?: number;
  nestedGroupCount?: number;
  nestingLevel?: number;
}): GroupCatalogMeta {
  return {
    layerCount: group.layerCount ?? 0,
    nestedGroupCount: group.nestedGroupCount ?? 0,
    nestingLevel: group.nestingLevel ?? 1,
  };
}

/** Legacy admin: toggled on map group placement controls toggle-all checkbox. */
export function isGroupToggleAllEnabled(toggled: boolean | undefined): boolean {
  return toggled ?? false;
}

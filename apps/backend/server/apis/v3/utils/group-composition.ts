import type { Prisma } from "@prisma/client";

const LAYER_SWITCHER_TREE_OPTIONS_KEY = "layerSwitcherTree";

export type LayerSwitcherTreeNode =
  | { type: "layer"; id: string }
  | {
      type: "group";
      id: string;
      name: string;
      children: LayerSwitcherTreeNode[];
    };

export interface GroupCompositionStats {
  layerCount: number;
  nestedGroupCount: number;
  nestingLevel: number;
}

export function extractLayerSwitcherTree(
  options: Prisma.JsonValue | null | undefined
): LayerSwitcherTreeNode[] | undefined {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return undefined;
  }
  const tree = (options as Record<string, unknown>)[
    LAYER_SWITCHER_TREE_OPTIONS_KEY
  ];
  return Array.isArray(tree) ? (tree as LayerSwitcherTreeNode[]) : undefined;
}

export function computeGroupCompositionStats(
  tree: LayerSwitcherTreeNode[] | undefined,
  directLayerCount = 0
): GroupCompositionStats {
  if (!tree?.length) {
    return {
      layerCount: directLayerCount,
      nestedGroupCount: 0,
      nestingLevel: directLayerCount > 0 || directLayerCount === 0 ? 1 : 1,
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

  const maxGroupDepth = (nodes: LayerSwitcherTreeNode[], depth: number): number => {
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

export function buildGroupCompositionMap(
  instances: {
    groupId: string | null;
    options: Prisma.JsonValue | null;
  }[]
): Map<string, LayerSwitcherTreeNode[] | undefined> {
  const byGroupId = new Map<string, LayerSwitcherTreeNode[] | undefined>();

  for (const instance of instances) {
    if (!instance.groupId || byGroupId.has(instance.groupId)) continue;
    byGroupId.set(instance.groupId, extractLayerSwitcherTree(instance.options));
  }

  return byGroupId;
}

import type { LayerSwitcherTreeNode } from "../../../api/groups/types";
import type {
  GroupDisplaySettings,
  GroupLayerTreeNode,
  LayerDisplaySettings,
} from "../types";
import {
  DEFAULT_GROUP_DISPLAY_SETTINGS,
  DEFAULT_GROUP_METADATA,
  DEFAULT_LAYER_DISPLAY_SETTINGS,
  GROUP_LAYER_TREE_ROOT_ID,
} from "../types";
import {
  parseTreeNodeSourceId,
  sortSiblingNodes,
  toLayerTreeNodeId,
} from "./tree-model";

/** Nested group shape stored in layerswitcher Tool.options.groups (map_1.json). */
export interface ClientLayerSwitcherLayerRef {
  id: string;
  drawOrder?: number;
  visibleAtStart?: boolean;
  infobox?: string;
}

export interface ClientLayerSwitcherGroup {
  id: string;
  type?: string;
  name: string;
  toggled?: boolean;
  expanded?: boolean;
  exclusiveGroup?: boolean;
  parent?: string;
  infogroupvisible?: boolean;
  infogrouptitle?: string;
  infogrouptext?: string;
  infogroupurl?: string;
  infogroupurltext?: string;
  infogroupopendatalink?: string;
  infogroupowner?: string;
  layers?: ClientLayerSwitcherLayerRef[];
  groups?: ClientLayerSwitcherGroup[];
}

/**
 * Convert nested client `options.groups` into the flat-children
 * `LayerSwitcherTreeNode` shape used by `layerSwitcherTreeToNodeModels`.
 * Sibling order: layers first, then nested groups (matches map_1.json layout).
 */
export function clientGroupsToLayerSwitcherTree(
  groups: ClientLayerSwitcherGroup[],
): LayerSwitcherTreeNode[] {
  return groups.map((group) => {
    const layerChildren: LayerSwitcherTreeNode[] = (group.layers ?? []).map(
      (layer) => ({
        type: "layer",
        id: layer.id,
      }),
    );

    const groupChildren = clientGroupsToLayerSwitcherTree(group.groups ?? []);

    return {
      type: "group" as const,
      id: group.id,
      name: group.name,
      children: [...layerChildren, ...groupChildren],
    };
  });
}

/**
 * Serialize Kartlager flat tree + display settings back to client
 * `options.groups` for layerswitcher Tool.options.
 */
export function nodeModelsToClientGroups(
  tree: GroupLayerTreeNode[],
  groupDisplaySettings: Record<string, GroupDisplaySettings>,
  layerDisplaySettings: Record<string, LayerDisplaySettings>,
  parentId: GroupLayerTreeNode["parent"] = GROUP_LAYER_TREE_ROOT_ID,
): ClientLayerSwitcherGroup[] {
  const siblings = tree
    .filter((node) => node.parent === parentId)
    .slice()
    .sort(sortSiblingNodes);

  const result: ClientLayerSwitcherGroup[] = [];

  for (const node of siblings) {
    if (node.data?.kind !== "group") {
      continue;
    }

    const sourceId = node.data.sourceId;
    const settings =
      groupDisplaySettings[sourceId] ?? DEFAULT_GROUP_DISPLAY_SETTINGS;
    const children = tree
      .filter((child) => child.parent === node.id)
      .slice()
      .sort(sortSiblingNodes);

    const layers: ClientLayerSwitcherLayerRef[] = [];
    for (const child of children) {
      if (child.data?.kind !== "layer") {
        continue;
      }

      const layerSettings =
        layerDisplaySettings[child.data.sourceId] ??
        DEFAULT_LAYER_DISPLAY_SETTINGS;

      layers.push({
        id: child.data.sourceId,
        drawOrder: layerSettings.drawOrder ?? 1000,
        visibleAtStart: layerSettings.layerVisibleAtStart,
        infobox: layerSettings.layerInfoBox,
      });
    }

    result.push({
      id: sourceId,
      type: "group",
      name: node.text,
      toggled: settings.toggled,
      expanded: settings.expanded,
      exclusiveGroup: settings.exclusiveGroup,
      parent:
        parentId === GROUP_LAYER_TREE_ROOT_ID
          ? "-1"
          : parseTreeNodeSourceId(parentId),
      infogroupvisible: settings.infoDocument,
      infogrouptitle: settings.metadata.title,
      infogrouptext: settings.metadata.description,
      infogroupurl: settings.metadata.url,
      infogroupurltext: settings.metadata.urlTitle,
      infogroupopendatalink: settings.metadata.urlOpenData,
      infogroupowner: settings.metadata.owner,
      layers,
      groups: nodeModelsToClientGroups(
        tree,
        groupDisplaySettings,
        layerDisplaySettings,
        node.id,
      ),
    });
  }

  return result;
}

export function hydrateDisplaySettingsFromClientGroups(
  groups: ClientLayerSwitcherGroup[],
): {
  groupDisplaySettings: Record<string, GroupDisplaySettings>;
  layerDisplaySettings: Record<string, LayerDisplaySettings>;
  visibleIds: Set<string>;
} {
  const groupDisplaySettings: Record<string, GroupDisplaySettings> = {};
  const layerDisplaySettings: Record<string, LayerDisplaySettings> = {};
  const visibleIds = new Set<string>();

  const walk = (nodes: ClientLayerSwitcherGroup[]) => {
    for (const group of nodes) {
      groupDisplaySettings[group.id] = {
        ...DEFAULT_GROUP_DISPLAY_SETTINGS,
        toggled: group.toggled ?? DEFAULT_GROUP_DISPLAY_SETTINGS.toggled,
        expanded: group.expanded ?? DEFAULT_GROUP_DISPLAY_SETTINGS.expanded,
        exclusiveGroup:
          group.exclusiveGroup ?? DEFAULT_GROUP_DISPLAY_SETTINGS.exclusiveGroup,
        infoDocument: Boolean(group.infogroupvisible),
        metadata: {
          ...DEFAULT_GROUP_METADATA,
          title: group.infogrouptitle ?? "",
          description: group.infogrouptext ?? "",
          owner: group.infogroupowner ?? "",
          url: group.infogroupurl ?? "",
          urlTitle: group.infogroupurltext ?? "",
          urlOpenData: group.infogroupopendatalink ?? "",
        },
      };

      for (const layer of group.layers ?? []) {
        layerDisplaySettings[layer.id] = {
          ...DEFAULT_LAYER_DISPLAY_SETTINGS,
          layerVisibleAtStart: layer.visibleAtStart ?? false,
          layerInfoBox: layer.infobox ?? "",
          drawOrder: layer.drawOrder ?? 1000,
        };

        if (layer.visibleAtStart) {
          visibleIds.add(String(toLayerTreeNodeId(layer.id)));
        }
      }

      if (group.groups?.length) {
        walk(group.groups);
      }
    }
  };

  walk(groups);

  return { groupDisplaySettings, layerDisplaySettings, visibleIds };
}

export function getClientGroupsFromToolOptions(
  options: Record<string, unknown> | undefined | null,
): ClientLayerSwitcherGroup[] {
  if (!options || !Array.isArray(options.groups)) {
    return [];
  }

  return options.groups as ClientLayerSwitcherGroup[];
}

export function buildLayerswitcherOptionsWithGroups(
  baseOptions: Record<string, unknown>,
  groups: ClientLayerSwitcherGroup[],
): Record<string, unknown> {
  return {
    ...baseOptions,
    groups,
  };
}

/** Stable JSON used to detect Kartlager dirty state (same shape as save payload). */
export function serializeClientGroupsJson(
  tree: GroupLayerTreeNode[],
  groupDisplaySettings: Record<string, GroupDisplaySettings>,
  layerDisplaySettings: Record<string, LayerDisplaySettings>,
): string {
  return JSON.stringify(
    nodeModelsToClientGroups(
      tree,
      groupDisplaySettings,
      layerDisplaySettings,
    ),
  );
}

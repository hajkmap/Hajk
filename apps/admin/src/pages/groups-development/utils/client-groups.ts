import type { LayerSwitcherTreeNode } from "../../../api/groups/types";
import type {
  ClientLayerSwitcherGroup,
  ClientLayerSwitcherLayerRef,
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

export type { ClientLayerSwitcherGroup, ClientLayerSwitcherLayerRef };

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
 * Serialize Kartlager flat tree + display settings back to nested
 * layerswitcher groups (catalog layer ids for admin writes).
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

/** Remove catalog layers from an unsaved Kartlager/Bakgrund draft (e.g. on Lager deactivate). */
export function removeLayersFromLayerSwitcherDraft(
  draft: { groups: ClientLayerSwitcherGroup[]; baselayers: { layerId: string }[] },
  layerIds: ReadonlySet<string>,
): { groups: ClientLayerSwitcherGroup[]; baselayers: { layerId: string }[] } {
  if (layerIds.size === 0) {
    return draft;
  }

  const stripGroups = (
    groups: ClientLayerSwitcherGroup[],
  ): ClientLayerSwitcherGroup[] =>
    groups.map((group) => ({
      ...group,
      layers: (group.layers ?? []).filter((layer) => !layerIds.has(layer.id)),
      groups: stripGroups(group.groups ?? []),
    }));

  return {
    groups: stripGroups(draft.groups),
    baselayers: draft.baselayers.filter(
      (entry) => !layerIds.has(entry.layerId),
    ),
  };
}

/** Keep only layers that remain active on the Lager tab. */
export function pruneLayerSwitcherDraftToActiveLayers(
  draft: { groups: ClientLayerSwitcherGroup[]; baselayers: { layerId: string }[] },
  activeLayerIds: ReadonlySet<string>,
): { groups: ClientLayerSwitcherGroup[]; baselayers: { layerId: string }[] } {
  const stripGroups = (
    groups: ClientLayerSwitcherGroup[],
  ): ClientLayerSwitcherGroup[] =>
    groups.map((group) => ({
      ...group,
      layers: (group.layers ?? []).filter((layer) =>
        activeLayerIds.has(layer.id),
      ),
      groups: stripGroups(group.groups ?? []),
    }));

  return {
    groups: stripGroups(draft.groups),
    baselayers: draft.baselayers.filter((entry) =>
      activeLayerIds.has(entry.layerId),
    ),
  };
}

/** Stable JSON for Kartlager dirty checks; inactive Lager layers are ignored. */
export function layerSwitcherDraftComparableSignature(
  draft: {
    groups: ClientLayerSwitcherGroup[];
    baselayers: {
      layerId: string;
      visibleAtStart?: boolean;
      infobox?: string;
    }[];
  },
  activeLayerIds?: ReadonlySet<string> | null,
): string {
  const comparable =
    activeLayerIds != null
      ? pruneLayerSwitcherDraftToActiveLayers(draft, activeLayerIds)
      : draft;

  const normalizeGroups = (
    groups: ClientLayerSwitcherGroup[],
  ): unknown[] =>
    groups.map((group) => ({
      id: group.id,
      name: group.name ?? "",
      toggled: Boolean(group.toggled),
      expanded: Boolean(group.expanded),
      exclusiveGroup: Boolean(group.exclusiveGroup),
      infogroupvisible: Boolean(group.infogroupvisible),
      infogrouptitle: group.infogrouptitle ?? "",
      infogrouptext: group.infogrouptext ?? "",
      infogroupurl: group.infogroupurl ?? "",
      infogroupurltext: group.infogroupurltext ?? "",
      infogroupopendatalink: group.infogroupopendatalink ?? "",
      infogroupowner: group.infogroupowner ?? "",
      layers: (group.layers ?? []).map((layer) => ({
        id: layer.id,
        drawOrder: layer.drawOrder ?? 1000,
        visibleAtStart: Boolean(layer.visibleAtStart),
        infobox: layer.infobox ?? "",
      })),
      groups: normalizeGroups(group.groups ?? []),
    }));

  return JSON.stringify({
    groups: normalizeGroups(comparable.groups),
    baselayers: comparable.baselayers.map((entry) => ({
      layerId: entry.layerId,
      visibleAtStart: entry.visibleAtStart ?? false,
      infobox: entry.infobox ?? "",
    })),
  });
}

/** Layer catalog ids listed as layerswitcher baselayers (background layers). */
export function getBaselayerIdsFromToolOptions(
  options: Record<string, unknown> | undefined | null,
): Set<string> {
  const ids = new Set<string>();
  if (!options || !Array.isArray(options.baselayers)) {
    return ids;
  }

  for (const entry of options.baselayers) {
    if (typeof entry === "string" || typeof entry === "number") {
      ids.add(String(entry));
      continue;
    }
    if (
      entry &&
      typeof entry === "object" &&
      "id" in entry &&
      (entry as { id?: unknown }).id != null
    ) {
      ids.add(String((entry as { id: unknown }).id));
    }
  }

  return ids;
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

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
 * Merge layers[] + groups[] into interleaved sibling order.
 * Prefers explicit `index` on each entry; falls back to layers-then-groups.
 */
export function buildSiblingOrderFromLayersAndGroups(
  layers: { id: string; index?: number }[],
  groups: { id: string; index?: number }[],
): { type: "layer" | "group"; id: string }[] {
  const layerEntries = layers.map((layer, fallback) => ({
    type: "layer" as const,
    id: layer.id,
    index: layer.index,
    fallback,
  }));
  const groupEntries = groups.map((group, fallback) => ({
    type: "group" as const,
    id: group.id,
    index: group.index,
    fallback,
  }));
  const hasIndexed =
    layerEntries.some((entry) => entry.index != null) ||
    groupEntries.some((entry) => entry.index != null);

  if (!hasIndexed) {
    return [
      ...layerEntries.map(({ type, id }) => ({ type, id })),
      ...groupEntries.map(({ type, id }) => ({ type, id })),
    ];
  }

  return [...layerEntries, ...groupEntries]
    .sort((a, b) => {
      const indexA = a.index ?? Number.MAX_SAFE_INTEGER;
      const indexB = b.index ?? Number.MAX_SAFE_INTEGER;
      if (indexA !== indexB) {
        return indexA - indexB;
      }
      if (a.type !== b.type) {
        return a.type === "layer" ? -1 : 1;
      }
      return a.fallback - b.fallback;
    })
    .map(({ type, id }) => ({ type, id }));
}

/**
 * Convert nested client `options.groups` into the flat-children
 * `LayerSwitcherTreeNode` shape used by `layerSwitcherTreeToNodeModels`.
 * Prefers interleaved `layerSwitcherTree` when present; otherwise merges by
 * `index` on layers/groups (legacy: layers then groups).
 */
export function clientGroupsToLayerSwitcherTree(
  groups: ClientLayerSwitcherGroup[],
): LayerSwitcherTreeNode[] {
  return groups.map((group) => {
    const layerNodesById = new Map(
      (group.layers ?? []).map((layer) => [
        layer.id,
        { type: "layer" as const, id: layer.id },
      ]),
    );
    const nestedGroupsById = new Map(
      (group.groups ?? []).map((nested) => [nested.id, nested]),
    );

    let children: LayerSwitcherTreeNode[];
    if (group.layerSwitcherTree && group.layerSwitcherTree.length > 0) {
      children = [];
      const usedLayers = new Set<string>();
      const usedGroups = new Set<string>();
      for (const entry of group.layerSwitcherTree) {
        if (entry.type === "layer") {
          const layerNode = layerNodesById.get(entry.id);
          if (layerNode && !usedLayers.has(entry.id)) {
            children.push(layerNode);
            usedLayers.add(entry.id);
          }
          continue;
        }
        const nested = nestedGroupsById.get(entry.id);
        if (nested && !usedGroups.has(entry.id)) {
          children.push(...clientGroupsToLayerSwitcherTree([nested]));
          usedGroups.add(entry.id);
        }
      }
      for (const [id, layerNode] of layerNodesById) {
        if (!usedLayers.has(id)) {
          children.push(layerNode);
        }
      }
      for (const [id, nested] of nestedGroupsById) {
        if (!usedGroups.has(id)) {
          children.push(...clientGroupsToLayerSwitcherTree([nested]));
        }
      }
    } else {
      const order = buildSiblingOrderFromLayersAndGroups(
        group.layers ?? [],
        group.groups ?? [],
      );
      children = [];
      for (const entry of order) {
        if (entry.type === "layer") {
          const layerNode = layerNodesById.get(entry.id);
          if (layerNode) {
            children.push(layerNode);
          }
          continue;
        }
        const nested = nestedGroupsById.get(entry.id);
        if (nested) {
          children.push(...clientGroupsToLayerSwitcherTree([nested]));
        }
      }
    }

    return {
      type: "group" as const,
      id: group.id,
      name: group.name,
      children,
    };
  });
}

/**
 * Serialize Maplayers flat tree + display settings back to nested
 * layerswitcher groups (catalog layer ids for admin writes).
 * Sibling order is stored as `index` on each layer and nested group.
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

  const groupNodes = siblings.filter((node) => node.data?.kind === "group");

  return groupNodes.map((node) => {
    const sourceId = node.data!.sourceId;
    const settings =
      groupDisplaySettings[sourceId] ?? DEFAULT_GROUP_DISPLAY_SETTINGS;

    const childSiblings = tree
      .filter((child) => child.parent === node.id)
      .slice()
      .sort(sortSiblingNodes);

    const nestedBySourceId = new Map(
      nodeModelsToClientGroups(
        tree,
        groupDisplaySettings,
        layerDisplaySettings,
        node.id,
      ).map((nested) => [nested.id, nested]),
    );

    const layers: ClientLayerSwitcherLayerRef[] = [];
    const nestedGroups: ClientLayerSwitcherGroup[] = [];

    childSiblings.forEach((child, index) => {
      if (child.data?.kind === "layer") {
        const layerSettings =
          layerDisplaySettings[child.data.sourceId] ??
          DEFAULT_LAYER_DISPLAY_SETTINGS;
        layers.push({
          id: child.data.sourceId,
          index,
          drawOrder: layerSettings.drawOrder ?? 1000,
          visibleAtStart: layerSettings.layerVisibleAtStart,
          infobox: layerSettings.layerInfoBox,
        });
        return;
      }
      if (child.data?.kind !== "group") {
        return;
      }
      const nested = nestedBySourceId.get(child.data.sourceId);
      if (!nested) {
        return;
      }
      nestedGroups.push({
        ...nested,
        index,
      });
    });

    return {
      id: sourceId,
      type: "group" as const,
      name: node.text,
      toggled: settings.toggled,
      expanded: settings.expanded,
      exclusive: settings.exclusive,
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
      groups: nestedGroups,
    };
  });
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
        exclusive: group.exclusive ?? DEFAULT_GROUP_DISPLAY_SETTINGS.exclusive,
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

/** Catalog layer ids nested under layerswitcher `options.groups`. */
export function collectLayerIdsFromClientGroups(
  groups: ClientLayerSwitcherGroup[],
): Set<string> {
  const ids = new Set<string>();
  const walk = (nodes: ClientLayerSwitcherGroup[]) => {
    for (const group of nodes) {
      for (const layer of group.layers ?? []) {
        ids.add(layer.id);
      }
      if (group.groups?.length) {
        walk(group.groups);
      }
    }
  };
  walk(groups);
  return ids;
}

/**
 * Activate layers referenced by a LayerSwitcher tool: groups → Aktivt,
 * baselayers → Aktivt + Bakgrund. Other BACKGROUND flags are cleared.
 */
export function applyLayerswitcherOptionsToActivationRows<
  T extends {
    layerId: string;
    layerKind?: string;
    active: boolean;
    isBackground: boolean;
  },
>(
  rows: T[],
  options: Record<string, unknown> | undefined | null,
): T[] {
  const groupLayerIds = collectLayerIdsFromClientGroups(
    getClientGroupsFromToolOptions(options),
  );
  const backgroundIds = new Set(
    getClientBaselayersFromToolOptions(options).map((entry) => entry.layerId),
  );

  return rows.map((row) => {
    const canBeBackground = (row.layerKind ?? "display") === "display";
    const inBackground = canBeBackground && backgroundIds.has(row.layerId);
    const inGroups = groupLayerIds.has(row.layerId);
    if (!inBackground && !inGroups) {
      return row.isBackground ? { ...row, isBackground: false } : row;
    }
    return {
      ...row,
      active: true,
      isBackground: inBackground,
    };
  });
}

/** Baselayers from the active LayerSwitcher Tool.options (empty when absent). */
export function getClientBaselayersFromToolOptions(
  options: Record<string, unknown> | undefined | null,
): {
  layerId: string;
  visibleAtStart: boolean;
  infobox: string;
}[] {
  if (!options || !Array.isArray(options.baselayers)) {
    return [];
  }

  const baselayers: {
    layerId: string;
    visibleAtStart: boolean;
    infobox: string;
  }[] = [];

  for (const entry of options.baselayers) {
    if (typeof entry === "string" || typeof entry === "number") {
      baselayers.push({
        layerId: String(entry),
        visibleAtStart: false,
        infobox: "",
      });
      continue;
    }
    if (
      entry &&
      typeof entry === "object" &&
      "id" in entry &&
      (entry as { id?: unknown }).id != null
    ) {
      const record = entry as {
        id: unknown;
        visibleAtStart?: unknown;
        infobox?: unknown;
      };
      baselayers.push({
        layerId: String(record.id),
        visibleAtStart: record.visibleAtStart === true,
        infobox: typeof record.infobox === "string" ? record.infobox : "",
      });
    }
  }

  return baselayers;
}

/** Remove catalog layers from an unsaved Map-and-background draft (e.g. on Lager deactivate). */
export function removeLayersFromLayerSwitcherDraft<
  TBaselayer extends { layerId: string },
>(
  draft: {
    groups: ClientLayerSwitcherGroup[];
    baselayers: TBaselayer[];
  },
  layerIds: ReadonlySet<string>,
): { groups: ClientLayerSwitcherGroup[]; baselayers: TBaselayer[] } {
  if (layerIds.size === 0) {
    return draft;
  }

  const stripGroups = (
    groups: ClientLayerSwitcherGroup[],
  ): ClientLayerSwitcherGroup[] =>
    groups.map((group) => {
      const layers = (group.layers ?? []).filter(
        (layer) => !layerIds.has(layer.id),
      );
      const nestedGroups = stripGroups(group.groups ?? []);
      return {
        ...group,
        layers,
        groups: nestedGroups,
        layerSwitcherTree: undefined,
      };
    });

  return {
    groups: stripGroups(draft.groups),
    baselayers: draft.baselayers.filter(
      (entry) => !layerIds.has(entry.layerId),
    ),
  };
}

/** Keep only layers that remain active on the Lager tab. */
export function pruneLayerSwitcherDraftToActiveLayers<
  TBaselayer extends { layerId: string },
>(
  draft: {
    groups: ClientLayerSwitcherGroup[];
    baselayers: TBaselayer[];
  },
  activeLayerIds: ReadonlySet<string>,
): { groups: ClientLayerSwitcherGroup[]; baselayers: TBaselayer[] } {
  const stripGroups = (
    groups: ClientLayerSwitcherGroup[],
  ): ClientLayerSwitcherGroup[] =>
    groups.map((group) => {
      const layers = (group.layers ?? []).filter((layer) =>
        activeLayerIds.has(layer.id),
      );
      const nestedGroups = stripGroups(group.groups ?? []);
      return {
        ...group,
        layers,
        groups: nestedGroups,
        layerSwitcherTree: undefined,
      };
    });

  return {
    groups: stripGroups(draft.groups),
    baselayers: draft.baselayers.filter((entry) =>
      activeLayerIds.has(entry.layerId),
    ),
  };
}

export interface LayerSwitcherComparableDraft {
  groups: ClientLayerSwitcherGroup[];
  baselayers: {
    layerId: string;
    visibleAtStart?: boolean;
    infobox?: string;
  }[];
  /** Bakgrund list order (top → bottom). */
  baselayerOrder?: string[];
  /** Ritordning list order (top → bottom). */
  drawOrderSequence?: string[];
}

/** Stable JSON for Maplayers dirty checks; inactive Lager layers are ignored. */
export function layerSwitcherDraftComparableSignature(
  draft: LayerSwitcherComparableDraft,
  activeLayerIds?: ReadonlySet<string> | null,
): string {
  const comparable =
    activeLayerIds != null
      ? pruneLayerSwitcherDraftToActiveLayers(draft, activeLayerIds)
      : draft;

  const normalizeGroups = (groups: ClientLayerSwitcherGroup[]): unknown[] =>
    groups.map((group) => ({
      id: group.id,
      name: group.name ?? "",
      index: group.index ?? null,
      toggled: Boolean(group.toggled),
      expanded: Boolean(group.expanded),
      exclusive: Boolean(group.exclusive),
      infogroupvisible: Boolean(group.infogroupvisible),
      infogrouptitle: group.infogrouptitle ?? "",
      infogrouptext: group.infogrouptext ?? "",
      infogroupurl: group.infogroupurl ?? "",
      infogroupurltext: group.infogroupurltext ?? "",
      infogroupopendatalink: group.infogroupopendatalink ?? "",
      infogroupowner: group.infogroupowner ?? "",
      layers: (group.layers ?? []).map((layer) => ({
        id: layer.id,
        index: layer.index ?? null,
        drawOrder: layer.drawOrder ?? 1000,
        visibleAtStart: Boolean(layer.visibleAtStart),
        infobox: layer.infobox ?? "",
      })),
      groups: normalizeGroups(group.groups ?? []),
    }));

  const baselayerOrderSource =
    draft.baselayerOrder ?? comparable.baselayers.map((entry) => entry.layerId);
  const baselayerOrder =
    activeLayerIds != null
      ? baselayerOrderSource.filter((id) => activeLayerIds.has(id))
      : baselayerOrderSource;

  const drawOrderSequence =
    activeLayerIds != null
      ? (draft.drawOrderSequence ?? []).filter((id) => activeLayerIds.has(id))
      : (draft.drawOrderSequence ?? []);

  return JSON.stringify({
    groups: normalizeGroups(comparable.groups),
    baselayerOrder,
    baselayers: comparable.baselayers.map((entry) => ({
      layerId: entry.layerId,
      visibleAtStart: entry.visibleAtStart ?? false,
      infobox: entry.infobox ?? "",
    })),
    drawOrderSequence,
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

/** Stable JSON used to detect Maplayers dirty state (same shape as save payload). */
export function serializeClientGroupsJson(
  tree: GroupLayerTreeNode[],
  groupDisplaySettings: Record<string, GroupDisplaySettings>,
  layerDisplaySettings: Record<string, LayerDisplaySettings>,
): string {
  return JSON.stringify(
    nodeModelsToClientGroups(tree, groupDisplaySettings, layerDisplaySettings),
  );
}

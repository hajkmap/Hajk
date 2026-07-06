import type { Prisma } from "@prisma/client";
import { UseType } from "@prisma/client";

import log4js from "log4js";
import prisma from "../../../common/prisma.ts";
import {
  activeLayerInstanceWhere,
  layerInstanceIncludeAll,
} from "./layer-instance.ts";

const logger = log4js.getLogger("util.build-layer-switcher-groups");

const LAYER_SWITCHER_TREE_OPTIONS_KEY = "layerSwitcherTree";

export type LayerSwitcherTreeNode =
  | { type: "layer"; id: string }
  | {
      type: "group";
      id: string;
      name: string;
      children: LayerSwitcherTreeNode[];
    };

export interface ClientLayerSwitcherLayerRef {
  id: string;
  drawOrder: number;
  visibleAtStart: boolean;
  infobox: string;
}

export interface ClientLayerSwitcherGroupNode {
  id: string;
  type: "group";
  name: string;
  toggled: boolean;
  expanded: boolean;
  parent: string;
  infogroupvisible: boolean;
  infogrouptitle: string;
  infogrouptext: string;
  infogroupurl: string;
  infogroupurltext: string;
  infogroupopendatalink: string;
  infogroupowner: string;
  layers: ClientLayerSwitcherLayerRef[];
  groups: ClientLayerSwitcherGroupNode[];
}

type LayerInstanceRow = Prisma.LayerInstanceGetPayload<{
  include: typeof layerInstanceIncludeAll;
}>;

type GroupsOnMapsRow = Prisma.GroupsOnMapsGetPayload<{
  include: { group: true };
}>;

const INFOGROUP_DEFAULTS = {
  infogroupvisible: false,
  infogrouptitle: "",
  infogrouptext: "",
  infogroupurl: "",
  infogroupurltext: "",
  infogroupopendatalink: "",
  infogroupowner: "",
} as const;

function extractLayerSwitcherTree(
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

function getLayerKey(instance: LayerInstanceRow): string | null {
  return (
    instance.displayLayerId ??
    instance.searchLayerId ??
    instance.editingLayerId ??
    null
  );
}

function toClientLayerRef(instance: LayerInstanceRow): ClientLayerSwitcherLayerRef {
  const options =
    instance.options &&
    typeof instance.options === "object" &&
    !Array.isArray(instance.options)
      ? (instance.options as Record<string, unknown>)
      : {};

  const infobox =
    typeof options.infobox === "string" ? options.infobox : "";

  return {
    id: instance.id,
    drawOrder: instance.zIndex,
    visibleAtStart: instance.visibleAtStart,
    infobox,
  };
}

interface GroupComposition {
  instances: LayerInstanceRow[];
  layerKeyToInstance: Map<string, LayerInstanceRow>;
  layerSwitcherTree?: LayerSwitcherTreeNode[];
  groupNames: Map<string, string>;
}

function buildGroupCompositionMap(
  instances: LayerInstanceRow[],
  groups: { id: string; name: string }[]
): Map<string, GroupComposition> {
  const byGroupId = new Map<string, LayerInstanceRow[]>();

  for (const instance of instances) {
    if (!instance.groupId) continue;
    const list = byGroupId.get(instance.groupId) ?? [];
    list.push(instance);
    byGroupId.set(instance.groupId, list);
  }

  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
  const compositions = new Map<string, GroupComposition>();

  for (const [groupId, groupInstances] of byGroupId) {
    const sorted = [...groupInstances].sort((a, b) => a.zIndex - b.zIndex);
    const layerKeyToInstance = new Map<string, LayerInstanceRow>();

    for (const instance of sorted) {
      const key = getLayerKey(instance);
      if (key) {
        layerKeyToInstance.set(key, instance);
      }
    }

    let layerSwitcherTree: LayerSwitcherTreeNode[] | undefined;
    for (const instance of sorted) {
      const tree = extractLayerSwitcherTree(instance.options);
      if (tree?.length) {
        layerSwitcherTree = tree;
        break;
      }
    }

    compositions.set(groupId, {
      instances: sorted,
      layerKeyToInstance,
      layerSwitcherTree,
      groupNames,
    });
  }

  return compositions;
}

function buildFromTree(
  nodes: LayerSwitcherTreeNode[],
  composition: GroupComposition,
  parentGroupId: string,
  compositions: Map<string, GroupComposition>,
  placementsByParentGomId: Map<string | null, GroupsOnMapsRow[]>,
  buildPlacementNode: (
    placement: GroupsOnMapsRow,
    parentGroupId: string
  ) => ClientLayerSwitcherGroupNode,
  visitedGroupIds: Set<string>
): { layers: ClientLayerSwitcherLayerRef[]; groups: ClientLayerSwitcherGroupNode[] } {
  const layers: ClientLayerSwitcherLayerRef[] = [];
  const groups: ClientLayerSwitcherGroupNode[] = [];

  for (const node of nodes) {
    if (node.type === "layer") {
      const instance = composition.layerKeyToInstance.get(node.id);
      if (instance) {
        layers.push(toClientLayerRef(instance));
      } else {
        logger.warn(
          `Layer "${node.id}" referenced in layerSwitcherTree was not found on group instances.`
        );
      }
      continue;
    }

    groups.push(
      buildInternalGroupNode(
        node,
        parentGroupId,
        compositions,
        placementsByParentGomId,
        buildPlacementNode,
        visitedGroupIds
      )
    );
  }

  return { layers, groups };
}

function buildInternalGroupNode(
  node: Extract<LayerSwitcherTreeNode, { type: "group" }>,
  parentGroupId: string,
  compositions: Map<string, GroupComposition>,
  placementsByParentGomId: Map<string | null, GroupsOnMapsRow[]>,
  buildPlacementNode: (
    placement: GroupsOnMapsRow,
    parentGroupId: string
  ) => ClientLayerSwitcherGroupNode,
  visitedGroupIds: Set<string>
): ClientLayerSwitcherGroupNode {
  if (visitedGroupIds.has(node.id)) {
    return {
      id: node.id,
      type: "group",
      name: node.name,
      toggled: true,
      expanded: false,
      parent: parentGroupId,
      layers: [],
      groups: [],
      ...INFOGROUP_DEFAULTS,
    };
  }

  visitedGroupIds.add(node.id);

  const composition = compositions.get(node.id);
  const name =
    composition?.groupNames.get(node.id) ?? node.name ?? node.id;

  if (!composition) {
    return {
      id: node.id,
      type: "group",
      name,
      toggled: true,
      expanded: false,
      parent: parentGroupId,
      layers: [],
      groups: node.children?.length
        ? node.children
            .filter(
              (child): child is Extract<LayerSwitcherTreeNode, { type: "group" }> =>
                child.type === "group"
            )
            .map((child) =>
              buildInternalGroupNode(
                child,
                node.id,
                compositions,
                placementsByParentGomId,
                buildPlacementNode,
                visitedGroupIds
              )
            )
        : [],
      ...INFOGROUP_DEFAULTS,
    };
  }

  const { layers, groups } = composition.layerSwitcherTree?.length
    ? buildFromTree(
        composition.layerSwitcherTree,
        composition,
        node.id,
        compositions,
        placementsByParentGomId,
        buildPlacementNode,
        visitedGroupIds
      )
    : {
        layers: composition.instances.map(toClientLayerRef),
        groups: [] as ClientLayerSwitcherGroupNode[],
      };

  return {
    id: node.id,
    type: "group",
    name,
    toggled: true,
    expanded: false,
    parent: parentGroupId,
    layers,
    groups,
    ...INFOGROUP_DEFAULTS,
  };
}

function mergeGroupChildrenAtLevel(
  internal: ClientLayerSwitcherGroupNode[],
  mapPlaced: ClientLayerSwitcherGroupNode[]
): ClientLayerSwitcherGroupNode[] {
  const byId = new Map<string, ClientLayerSwitcherGroupNode>();

  for (const group of internal) {
    byId.set(group.id, group);
  }

  for (const group of mapPlaced) {
    const existing = byId.get(group.id);
    if (!existing) {
      byId.set(group.id, group);
      continue;
    }

    byId.set(group.id, {
      ...existing,
      ...group,
      layers: group.layers.length > 0 ? group.layers : existing.layers,
      groups: group.groups.length > 0 ? group.groups : existing.groups,
    });
  }

  return Array.from(byId.values());
}

function buildPlacementNode(
  placement: GroupsOnMapsRow,
  parentGroupId: string,
  compositions: Map<string, GroupComposition>,
  placementsByParentGomId: Map<string | null, GroupsOnMapsRow[]>,
  visitedPlacementIds: Set<string>
): ClientLayerSwitcherGroupNode {
  if (visitedPlacementIds.has(placement.id)) {
    logger.warn(
      `Skipping cyclic GroupsOnMaps placement "${placement.id}" for group "${placement.groupId}".`
    );
    return {
      id: placement.groupId,
      type: "group",
      name: placement.name,
      toggled: placement.toggled,
      expanded: placement.expanded,
      parent: parentGroupId,
      layers: [],
      groups: [],
      ...INFOGROUP_DEFAULTS,
    };
  }

  visitedPlacementIds.add(placement.id);
  const composition = compositions.get(placement.groupId);
  const childPlacements = (placementsByParentGomId.get(placement.id) ?? []).sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0),
  );
  const visitedGroupIds = new Set<string>([placement.groupId]);

  const { layers, groups: internalGroups } = composition?.layerSwitcherTree
    ?.length
    ? buildFromTree(
        composition.layerSwitcherTree,
        composition,
        placement.groupId,
        compositions,
        placementsByParentGomId,
        (childPlacement, parentId) =>
          buildPlacementNode(
            childPlacement,
            parentId,
            compositions,
            placementsByParentGomId,
            visitedPlacementIds
          ),
        visitedGroupIds
      )
    : {
        layers: composition?.instances.map(toClientLayerRef) ?? [],
        groups: [] as ClientLayerSwitcherGroupNode[],
      };

  const mapChildGroups = childPlacements.map((child) =>
    buildPlacementNode(
      child,
      placement.groupId,
      compositions,
      placementsByParentGomId,
      visitedPlacementIds
    )
  );

  return {
    id: placement.groupId,
    type: "group",
    name: placement.name,
    toggled: placement.toggled,
    expanded: placement.expanded,
    parent: parentGroupId,
    layers,
    groups: mergeGroupChildrenAtLevel(internalGroups, mapChildGroups),
    ...INFOGROUP_DEFAULTS,
  };
}

/**
 * Build Hajk client's nested `layerswitcher.options.groups` tree from DB state.
 *
 * @see apps/client/src/plugins/LayerSwitcher/LayerSwitcherProvider.jsx
 * @see apps/backend/App_Data/map_1.json
 */
export async function buildLayerSwitcherGroupsForMap(
  mapName: string
): Promise<ClientLayerSwitcherGroupNode[]> {
  const placements = await prisma.groupsOnMaps.findMany({
    where: { mapName },
    include: { group: true },
  });

  if (placements.length === 0) {
    return [];
  }

  const groupIds = [...new Set(placements.map((placement) => placement.groupId))];

  const instances = await prisma.layerInstance.findMany({
    where: {
      AND: [{ groupId: { in: groupIds } }, activeLayerInstanceWhere],
    },
    include: layerInstanceIncludeAll,
    orderBy: { zIndex: "asc" },
  });

  const groups = await prisma.group.findMany({
    where: { id: { in: groupIds } },
    select: { id: true, name: true },
  });

  const compositions = buildGroupCompositionMap(instances, groups);

  const placementsByParentGomId = new Map<string | null, GroupsOnMapsRow[]>();
  for (const placement of placements) {
    const parentKey = placement.parentGroupId ?? null;
    const list = placementsByParentGomId.get(parentKey) ?? [];
    list.push(placement);
    placementsByParentGomId.set(parentKey, list);
  }

  const roots = (placementsByParentGomId.get(null) ?? []).sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0),
  );

  return roots.map((placement) =>
    buildPlacementNode(
      placement,
      "-1",
      compositions,
      placementsByParentGomId,
      new Set<string>()
    )
  );
}

/**
 * Background layers for layerswitcher — ids are LayerInstance ids (same as layersConfig).
 */
export async function buildLayerSwitcherBaselayersForMap(
  mapName: string
): Promise<ClientLayerSwitcherLayerRef[]> {
  const instances = await prisma.layerInstance.findMany({
    where: {
      AND: [
        { map: { name: mapName } },
        { usage: UseType.BACKGROUND },
        activeLayerInstanceWhere,
      ],
    },
    orderBy: { zIndex: "asc" },
  });

  return instances.map(toClientLayerRef);
}

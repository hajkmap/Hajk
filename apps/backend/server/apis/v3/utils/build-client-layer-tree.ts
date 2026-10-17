import { UseType } from "@prisma/client";
import log4js from "log4js";

import prisma from "../../../common/prisma.ts";
import LayerTreeService, {
  type LayerTreeNode,
} from "../services/layer-tree.service.ts";
import {
  DEFAULT_GROUP_SETTINGS,
  DEFAULT_LAYER_SETTINGS,
  layerSettingsKey,
  type MapGroupSettings,
  type MapLayerSettings,
} from "../services/map-layer-tree-settings.ts";
import type { DisplayLayerPlacement } from "./build-legacy-layers-config.ts";

const logger = log4js.getLogger("util.build-client-layer-tree");

// The client reads the classic layerswitcher format (groups holding layer
// refs, layer definitions in layersConfig). This builds it from the map's
// layer tree (MapTreeItem → GroupItem, with the map's exceptions) and the
// map's settings for it, so the client needs no changes.

/** A layer in a group of the client's layerswitcher, or a background layer. */
export interface ClientLayerSwitcherLayerRef {
  id: string;
  index?: number;
  drawOrder: number;
  visibleAtStart: boolean;
  infobox: string;
}

/** A group of the client's layerswitcher (as in App_Data map configs). */
export interface ClientLayerSwitcherGroupNode {
  id: string;
  type: "group";
  name: string;
  index?: number;
  toggled: boolean;
  expanded: boolean;
  exclusive: boolean;
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

/** Parent id the client expects for groups at the top of the tree. */
const ROOT_PARENT = "-1";

/** Joins an id with its group's client id for a second placement on a map. */
const OCCURRENCE_SEPARATOR = "~";

type GroupNode = Extract<LayerTreeNode, { type: "group" }>;

export interface ClientLayerTree {
  groups: ClientLayerSwitcherGroupNode[];
  /** One per layer placement; ids match the layer refs in `groups`. */
  placements: DisplayLayerPlacement[];
}

const EMPTY_TREE: ClientLayerTree = {
  groups: [],
  placements: [],
};

/** The client's info group fields for a group. */
function infoGroupFields({ infoGroup }: Omit<MapGroupSettings, "groupId">) {
  return {
    infogroupvisible: infoGroup.visible,
    infogrouptitle: infoGroup.title,
    infogrouptext: infoGroup.text,
    infogroupurl: infoGroup.url,
    infogroupurltext: infoGroup.urlText,
    infogroupopendatalink: infoGroup.openDataLink,
    infogroupowner: infoGroup.owner,
  };
}

export async function buildClientLayerTreeForMap(
  mapName: string
): Promise<ClientLayerTree> {
  const map = await prisma.map.findFirst({
    where: { name: mapName, deletedAt: null },
    select: { name: true },
  });
  if (!map) {
    return EMPTY_TREE;
  }

  // The tree comes with the map's exceptions merged in, its settings for the
  // groups and layers in it, and its draw order.
  const { items, settings, drawOrder } =
    await LayerTreeService.getMapTree(mapName);
  const groupSettings = new Map<string, MapGroupSettings>(
    settings.groups.map((group) => [group.groupId, group])
  );
  const layerSettings = new Map<string, MapLayerSettings>(
    settings.layers.map((layer) => [
      layerSettingsKey(layer.groupId, layer.layerId),
      layer,
    ])
  );

  // The tree's layers are drawn above the background.
  const background = await prisma.layerInstance.aggregate({
    where: { map: { name: mapName }, usage: UseType.BACKGROUND },
    _max: { zIndex: true },
  });

  // Layer definitions for every layer in the tree (deleted ones are left out).
  const layerIds = new Set<string>();
  const collectLayerIds = (nodes: LayerTreeNode[]) => {
    for (const node of nodes) {
      if (node.hidden) continue;
      if (node.type === "layer") layerIds.add(node.id);
      else collectLayerIds(node.items);
    }
  };
  collectLayerIds(items);
  const displayLayers = new Map(
    (
      await prisma.displayLayer.findMany({
        where: {
          id: { in: [...layerIds] },
          deletedAt: null,
          service: { deletedAt: null },
        },
        include: {
          service: { include: { projection: true } },
          metadata: true,
          infoClickSettings: true,
        },
      })
    ).map((layer) => [layer.id, layer])
  );

  // A layer or group placed more than once on the map gets its own id per
  // placement, so the client shows each as a layer of its own (as with layer
  // instances). The first placement keeps the plain id, so links work.
  const usedIds = new Set<string>();
  const clientId = (id: string, parentClientId: string) => {
    let candidate = usedIds.has(id)
      ? `${id}${OCCURRENCE_SEPARATOR}${parentClientId}`
      : id;
    for (let n = 2; usedIds.has(candidate); n++) {
      candidate = `${id}${OCCURRENCE_SEPARATOR}${parentClientId}${OCCURRENCE_SEPARATOR}${n}`;
    }
    usedIds.add(candidate);
    return candidate;
  };

  // Layers in tree order; their draw order is set once all are known.
  const ordered: {
    ref: ClientLayerSwitcherLayerRef;
    placement: DisplayLayerPlacement;
    layerId: string;
  }[] = [];

  const toClientGroup = (
    node: GroupNode,
    parentClientId: string,
    index: number
  ): ClientLayerSwitcherGroupNode | null => {
    if (node.cycle) {
      logger.warn(
        `Map "${mapName}": group "${node.id}" contains itself — left out.`
      );
      return null;
    }
    const groupClientId = clientId(node.id, parentClientId);
    const layers: ClientLayerSwitcherLayerRef[] = [];
    const groups: ClientLayerSwitcherGroupNode[] = [];

    node.items.forEach((child, childIndex) => {
      // Hidden on this map by its exceptions.
      if (child.hidden) return;
      if (child.type === "group") {
        const group = toClientGroup(child, groupClientId, childIndex);
        if (group) groups.push(group);
        return;
      }
      const displayLayer = displayLayers.get(child.id);
      if (!displayLayer) return;
      const layer =
        layerSettings.get(layerSettingsKey(node.id, child.id)) ??
        DEFAULT_LAYER_SETTINGS;
      const id = clientId(child.id, groupClientId);
      const ref: ClientLayerSwitcherLayerRef = {
        id,
        index: childIndex,
        drawOrder: 0,
        visibleAtStart: layer.visibleAtStart,
        infobox: layer.infobox,
      };
      layers.push(ref);
      ordered.push({
        ref,
        placement: {
          id,
          zIndex: 0,
          visibleAtStart: ref.visibleAtStart,
          infoClickActive: true,
          displayLayer,
        },
        layerId: child.id,
      });
    });

    const group = groupSettings.get(node.id) ?? DEFAULT_GROUP_SETTINGS;
    return {
      id: groupClientId,
      type: "group",
      name: group.name ?? node.name,
      index,
      toggled: group.toggled,
      expanded: group.expanded,
      exclusive: group.exclusive,
      parent: parentClientId,
      layers,
      groups,
      ...infoGroupFields(group),
    };
  };

  const groups: ClientLayerSwitcherGroupNode[] = [];
  items.forEach((node, index) => {
    if (node.type === "layer") {
      // The client only shows layers inside groups; admin no longer allows these.
      logger.warn(
        `Map "${mapName}": layer "${node.id}" lies outside any group — left out.`
      );
      return;
    }
    const group = toClientGroup(node, ROOT_PARENT, index);
    if (group) groups.push(group);
  });

  // The map's own draw order (top first, set apart from the tree), above the
  // background. A layer not in it goes on top.
  const base = background._max.zIndex ?? 0;
  const position = new Map(drawOrder.map((id, index) => [id, index]));
  for (const entry of ordered) {
    const at = position.get(entry.layerId) ?? -1;
    entry.ref.drawOrder = base + drawOrder.length - at;
    entry.placement.zIndex = entry.ref.drawOrder;
  }

  return {
    groups,
    placements: ordered.map(({ placement }) => placement),
  };
}

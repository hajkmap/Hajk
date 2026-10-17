import type { Prisma } from "@prisma/client";

import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";
import type { LayerTreeNode } from "./layer-tree.service.ts";

// A map's own settings for the groups and layers in its tree (as the old
// Lagerordning set them per map). The map owns them: a group's
// settings are the same wherever the group shows on the map, a layer's are
// per group it shows in. Only settings that differ from the defaults are
// stored; the rest have the defaults.

export interface MapInfoGroup {
  visible: boolean;
  title: string;
  text: string;
  url: string;
  urlText: string;
  openDataLink: string;
  owner: string;
}

export interface MapGroupSettings {
  groupId: string;
  /** The group's name on this map; null shows the group's own name. */
  name: string | null;
  /** Shows a button that turns all the group's layers on or off. */
  toggled: boolean;
  /** Open when the map starts. */
  expanded: boolean;
  /** Only one of the group's layers can be on at a time. */
  exclusive: boolean;
  infoGroup: MapInfoGroup;
}

export interface MapLayerSettings {
  /** The group the layer shows in. */
  groupId: string;
  layerId: string;
  visibleAtStart: boolean;
  infobox: string;
}

export interface MapTreeSettings {
  groups: MapGroupSettings[];
  layers: MapLayerSettings[];
}

export const DEFAULT_INFO_GROUP: MapInfoGroup = {
  visible: false,
  title: "",
  text: "",
  url: "",
  urlText: "",
  openDataLink: "",
  owner: "",
};

export const DEFAULT_GROUP_SETTINGS: Omit<MapGroupSettings, "groupId"> = {
  name: null,
  toggled: false,
  expanded: false,
  exclusive: false,
  infoGroup: DEFAULT_INFO_GROUP,
};

export const DEFAULT_LAYER_SETTINGS: Omit<
  MapLayerSettings,
  "groupId" | "layerId"
> = {
  visibleAtStart: false,
  infobox: "",
};

/** Key of a layer's settings: the group it shows in and the layer. */
export const layerSettingsKey = (groupId: string, layerId: string) =>
  `${groupId}|${layerId}`;

function badRequest(message: string): HajkError {
  return new HajkError(
    HttpStatusCodes.BAD_REQUEST,
    message,
    HajkStatusCodes.INVALID_REQUEST_BODY
  );
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const text = (value: unknown) => (typeof value === "string" ? value : "");

/** Reads `settings` of a PUT on a map's tree; missing fields get defaults. */
export function parseSettings(value: unknown): MapTreeSettings {
  if (!isObject(value)) {
    throw badRequest("settings must be an object.");
  }
  const { groups = [], layers = [] } = value;
  if (!Array.isArray(groups) || !Array.isArray(layers)) {
    throw badRequest("settings.groups and settings.layers must be arrays.");
  }

  const seenGroups = new Set<string>();
  const parsedGroups = groups.map((entry, index): MapGroupSettings => {
    const at = `settings.groups[${index}]`;
    if (!isObject(entry) || typeof entry.groupId !== "string") {
      throw badRequest(`${at} needs a groupId.`);
    }
    if (seenGroups.has(entry.groupId)) {
      throw badRequest(`${at}: group "${entry.groupId}" appears twice.`);
    }
    seenGroups.add(entry.groupId);
    const info = isObject(entry.infoGroup) ? entry.infoGroup : {};
    const name = text(entry.name).trim();
    return {
      groupId: entry.groupId,
      name: name.length > 0 ? name : null,
      toggled: entry.toggled === true,
      expanded: entry.expanded === true,
      exclusive: entry.exclusive === true,
      infoGroup: {
        visible: info.visible === true,
        title: text(info.title),
        text: text(info.text),
        url: text(info.url),
        urlText: text(info.urlText),
        openDataLink: text(info.openDataLink),
        owner: text(info.owner),
      },
    };
  });

  const seenLayers = new Set<string>();
  const parsedLayers = layers.map((entry, index): MapLayerSettings => {
    const at = `settings.layers[${index}]`;
    if (
      !isObject(entry) ||
      typeof entry.groupId !== "string" ||
      typeof entry.layerId !== "string"
    ) {
      throw badRequest(`${at} needs a groupId and a layerId.`);
    }
    const key = layerSettingsKey(entry.groupId, entry.layerId);
    if (seenLayers.has(key)) {
      throw badRequest(
        `${at}: layer "${entry.layerId}" in group "${entry.groupId}" appears twice.`
      );
    }
    seenLayers.add(key);
    return {
      groupId: entry.groupId,
      layerId: entry.layerId,
      visibleAtStart: entry.visibleAtStart === true,
      infobox: text(entry.infobox),
    };
  });

  return { groups: parsedGroups, layers: parsedLayers };
}

/**
 * Checks the settings against the map's tree as it will be shown: a group's
 * settings must be about a group on the map, a layer's about a layer in that
 * group there (its own, placed in it or added by the map).
 */
export function validateSettings(
  settings: MapTreeSettings,
  shown: LayerTreeNode[],
  nameOf: (id: string) => string
) {
  const layersIn = new Map<string, Set<string>>();
  const walk = (nodes: LayerTreeNode[]) => {
    for (const node of nodes) {
      if (node.type !== "group") continue;
      const layers = layersIn.get(node.id) ?? new Set<string>();
      for (const item of node.items) {
        if (item.type === "layer") layers.add(item.id);
      }
      layersIn.set(node.id, layers);
      walk(node.items);
    }
  };
  walk(shown);

  for (const group of settings.groups) {
    if (!layersIn.has(group.groupId)) {
      throw badRequest(`Group "${group.groupId}" is not on this map.`);
    }
  }
  for (const layer of settings.layers) {
    const layers = layersIn.get(layer.groupId);
    if (!layers) {
      throw badRequest(`Group "${layer.groupId}" is not on this map.`);
    }
    if (!layers.has(layer.layerId)) {
      throw badRequest(
        `Layer "${layer.layerId}" is not in "${nameOf(layer.groupId)}" on this map.`
      );
    }
  }
}

function isDefaultInfoGroup(info: MapInfoGroup): boolean {
  return (Object.keys(DEFAULT_INFO_GROUP) as (keyof MapInfoGroup)[]).every(
    (key) => info[key] === DEFAULT_INFO_GROUP[key]
  );
}

function isDefaultGroup(settings: MapGroupSettings): boolean {
  return (
    settings.name === null &&
    settings.toggled === DEFAULT_GROUP_SETTINGS.toggled &&
    settings.expanded === DEFAULT_GROUP_SETTINGS.expanded &&
    settings.exclusive === DEFAULT_GROUP_SETTINGS.exclusive &&
    isDefaultInfoGroup(settings.infoGroup)
  );
}

function isDefaultLayer(settings: MapLayerSettings): boolean {
  return (
    settings.visibleAtStart === DEFAULT_LAYER_SETTINGS.visibleAtStart &&
    settings.infobox === DEFAULT_LAYER_SETTINGS.infobox
  );
}

type GroupSettingRow = Prisma.MapGroupSettingGetPayload<object>;
type LayerSettingRow = Prisma.MapLayerSettingGetPayload<object>;

function fromGroupRow(row: GroupSettingRow): MapGroupSettings {
  return {
    groupId: row.groupId,
    name: row.name,
    toggled: row.toggled,
    expanded: row.expanded,
    exclusive: row.exclusive,
    infoGroup: {
      visible: row.infoGroupVisible,
      title: row.infoGroupTitle,
      text: row.infoGroupText,
      url: row.infoGroupUrl,
      urlText: row.infoGroupUrlText,
      openDataLink: row.infoGroupOpenDataLink,
      owner: row.infoGroupOwner,
    },
  };
}

function fromLayerRow(row: LayerSettingRow): MapLayerSettings {
  return {
    groupId: row.groupId,
    layerId: row.displayLayerId,
    visibleAtStart: row.visibleAtStart,
    infobox: row.infobox,
  };
}

/** The map's stored settings; groups and layers without any have defaults. */
export async function readSettings(mapName: string): Promise<MapTreeSettings> {
  const [groups, layers] = await Promise.all([
    prisma.mapGroupSetting.findMany({
      where: { mapName },
      orderBy: { groupId: "asc" },
    }),
    prisma.mapLayerSetting.findMany({
      where: { mapName },
      orderBy: [{ groupId: "asc" }, { displayLayerId: "asc" }],
    }),
  ]);
  return { groups: groups.map(fromGroupRow), layers: layers.map(fromLayerRow) };
}

/**
 * Replaces the map's settings inside the tree's transaction, keeping only
 * those that differ from the defaults. A name equal to the group's own is not
 * kept, so the map follows the group when it is renamed.
 */
export async function writeSettings(
  tx: Prisma.TransactionClient,
  mapName: string,
  settings: MapTreeSettings
) {
  const ownNames = new Map(
    (
      await tx.group.findMany({
        where: { id: { in: settings.groups.map((group) => group.groupId) } },
        select: { id: true, name: true },
      })
    ).map((group) => [group.id, group.name])
  );
  const groups = settings.groups
    .map((group) => ({
      ...group,
      name: group.name === ownNames.get(group.groupId) ? null : group.name,
    }))
    .filter((group) => !isDefaultGroup(group));
  const layers = settings.layers.filter((layer) => !isDefaultLayer(layer));

  await tx.mapGroupSetting.deleteMany({ where: { mapName } });
  await tx.mapLayerSetting.deleteMany({ where: { mapName } });
  if (groups.length > 0) {
    await tx.mapGroupSetting.createMany({
      data: groups.map((group) => ({
        mapName,
        groupId: group.groupId,
        name: group.name,
        toggled: group.toggled,
        expanded: group.expanded,
        exclusive: group.exclusive,
        infoGroupVisible: group.infoGroup.visible,
        infoGroupTitle: group.infoGroup.title,
        infoGroupText: group.infoGroup.text,
        infoGroupUrl: group.infoGroup.url,
        infoGroupUrlText: group.infoGroup.urlText,
        infoGroupOpenDataLink: group.infoGroup.openDataLink,
        infoGroupOwner: group.infoGroup.owner,
      })),
    });
  }
  if (layers.length > 0) {
    await tx.mapLayerSetting.createMany({
      data: layers.map((layer) => ({
        mapName,
        groupId: layer.groupId,
        displayLayerId: layer.layerId,
        visibleAtStart: layer.visibleAtStart,
        infobox: layer.infobox,
      })),
    });
  }
}

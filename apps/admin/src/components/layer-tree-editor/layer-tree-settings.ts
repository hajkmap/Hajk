import type {
  MapGroupSettings,
  MapInfoGroup,
  MapLayerSettings,
  MapTreeSettings,
} from "../../api/layer-tree";
import {
  buildChildren,
  hiddenGroupsAbove,
  LAYER_TREE_ROOT_ID,
  type LayerTreeFlatNode,
} from "./layer-tree-model";

// The map's settings for the groups and layers in its tree (as the old
// Lagerordning had them). A group's settings are the same wherever it shows
// on the map; a layer's are per group it shows in. Only settings that differ
// from the defaults are kept and saved.

export type GroupSettingsValues = Omit<MapGroupSettings, "groupId">;
export type LayerSettingsValues = Omit<MapLayerSettings, "groupId" | "layerId">;

export interface LayerTreeSettings {
  /** By group id. */
  groups: Record<string, GroupSettingsValues>;
  /** By layerSettingsKey(group id, layer id). */
  layers: Record<string, LayerSettingsValues>;
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

/** As Lagerordning set them for a group put on a map. */
export const DEFAULT_GROUP_SETTINGS: GroupSettingsValues = {
  name: null,
  toggled: false,
  expanded: false,
  exclusive: false,
  infoGroup: DEFAULT_INFO_GROUP,
};

export const DEFAULT_LAYER_SETTINGS: LayerSettingsValues = {
  visibleAtStart: false,
  infobox: "",
};

export const EMPTY_SETTINGS: LayerTreeSettings = { groups: {}, layers: {} };

export const layerSettingsKey = (groupId: string, layerId: string) =>
  `${groupId}|${layerId}`;

const isDefaultGroup = (values: GroupSettingsValues) =>
  JSON.stringify(values) === JSON.stringify(DEFAULT_GROUP_SETTINGS);

const isDefaultLayer = (values: LayerSettingsValues) =>
  values.visibleAtStart === DEFAULT_LAYER_SETTINGS.visibleAtStart &&
  values.infobox === DEFAULT_LAYER_SETTINGS.infobox;

/** The values in a fixed key order, so equal settings compare equal. */
function normalizedGroup(values: GroupSettingsValues): GroupSettingsValues {
  const info = values.infoGroup;
  return {
    name: values.name,
    toggled: values.toggled,
    expanded: values.expanded,
    exclusive: values.exclusive,
    infoGroup: {
      visible: info.visible,
      title: info.title,
      text: info.text,
      url: info.url,
      urlText: info.urlText,
      openDataLink: info.openDataLink,
      owner: info.owner,
    },
  };
}

export function fromMapTreeSettings(
  settings: MapTreeSettings | undefined,
): LayerTreeSettings {
  const result: LayerTreeSettings = { groups: {}, layers: {} };
  for (const { groupId, ...values } of settings?.groups ?? []) {
    result.groups[groupId] = normalizedGroup(values);
  }
  for (const {
    groupId,
    layerId,
    visibleAtStart,
    infobox,
  } of settings?.layers ?? []) {
    result.layers[layerSettingsKey(groupId, layerId)] = {
      visibleAtStart,
      infobox,
    };
  }
  return result;
}

/** Text that is the same for the same settings, to tell what changed. */
export function settingsSignature(settings: LayerTreeSettings): string {
  const sorted = (record: Record<string, unknown>) =>
    Object.keys(record)
      .sort()
      .map((key) => [key, record[key]]);
  return JSON.stringify([sorted(settings.groups), sorted(settings.layers)]);
}

export const groupSettingsOf = (
  settings: LayerTreeSettings,
  groupId: string,
): GroupSettingsValues => settings.groups[groupId] ?? DEFAULT_GROUP_SETTINGS;

export const layerSettingsOf = (
  settings: LayerTreeSettings,
  groupId: string,
  layerId: string,
): LayerSettingsValues =>
  settings.layers[layerSettingsKey(groupId, layerId)] ?? DEFAULT_LAYER_SETTINGS;

export function withGroupSettings(
  settings: LayerTreeSettings,
  groupId: string,
  values: GroupSettingsValues,
): LayerTreeSettings {
  const groups = { ...settings.groups };
  const normalized = normalizedGroup(values);
  if (isDefaultGroup(normalized)) delete groups[groupId];
  else groups[groupId] = normalized;
  return { ...settings, groups };
}

export function withLayerSettings(
  settings: LayerTreeSettings,
  groupId: string,
  layerId: string,
  values: LayerSettingsValues,
): LayerTreeSettings {
  const layers = { ...settings.layers };
  const key = layerSettingsKey(groupId, layerId);
  if (isDefaultLayer(values)) delete layers[key];
  else layers[key] = { ...values };
  return { ...settings, layers };
}

/**
 * What to save: the settings of the groups and layers in the tree now, so
 * the map's settings for what was taken out of it go away.
 */
export function toMapTreeSettings(
  settings: LayerTreeSettings,
  nodes: LayerTreeFlatNode[],
): MapTreeSettings {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const groupIds = new Set<string>();
  const layerKeys = new Set<string>();
  for (const node of nodes) {
    if (node.data.kind === "group") {
      groupIds.add(node.data.sourceId);
      continue;
    }
    const parent = byId.get(node.parent);
    if (parent?.data.kind === "group") {
      layerKeys.add(layerSettingsKey(parent.data.sourceId, node.data.sourceId));
    }
  }
  return {
    groups: Object.entries(settings.groups)
      .filter(([groupId]) => groupIds.has(groupId))
      .map(([groupId, values]) => ({ groupId, ...values })),
    layers: Object.entries(settings.layers)
      .filter(([key]) => layerKeys.has(key))
      .map(([key, values]) => {
        const [groupId, layerId] = key.split("|");
        return { groupId, layerId, ...values };
      }),
  };
}

export type LayerTreeToggleState = "unchecked" | "checked" | "semichecked";

/** The group a layer node shows in, or undefined outside any group. */
export function groupIdOf(
  node: LayerTreeFlatNode,
  byId: Map<string, LayerTreeFlatNode>,
): string | undefined {
  const parent = byId.get(node.parent);
  return parent?.data.kind === "group" ? parent.data.sourceId : undefined;
}

interface TreeIndex {
  byId: Map<string, LayerTreeFlatNode>;
  children: Map<string, LayerTreeFlatNode[]>;
  hiddenWith: Map<string, string>;
}

// Node lists are replaced, never changed, so one index per list will do.
const indexes = new WeakMap<LayerTreeFlatNode[], TreeIndex>();

function indexOf(nodes: LayerTreeFlatNode[]): TreeIndex {
  let index = indexes.get(nodes);
  if (!index) {
    index = {
      byId: new Map(nodes.map((node) => [node.id, node])),
      children: buildChildren(nodes),
      hiddenWith: hiddenGroupsAbove(nodes),
    };
    indexes.set(nodes, index);
  }
  return index;
}

/**
 * The layers a group's box turns on or off: those under it at any depth that
 * show on the map (not hidden, not under a hidden group), with their groups.
 */
function layersUnder(
  nodes: LayerTreeFlatNode[],
  nodeId: string,
): { groupId: string; layerId: string }[] {
  const { byId, children, hiddenWith } = indexOf(nodes);
  const found: { groupId: string; layerId: string }[] = [];
  const walk = (parentId: string) => {
    for (const child of children.get(parentId) ?? []) {
      if (child.data.hidden || hiddenWith.has(child.id)) continue;
      if (child.data.kind === "group") {
        walk(child.id);
        continue;
      }
      const groupId = groupIdOf(child, byId);
      if (groupId) found.push({ groupId, layerId: child.data.sourceId });
    }
  };
  if (nodeId !== LAYER_TREE_ROOT_ID) walk(nodeId);
  return found;
}

/** A group's box: checked when all its layers are visible at start. */
export function groupToggleState(
  settings: LayerTreeSettings,
  nodes: LayerTreeFlatNode[],
  nodeId: string,
): LayerTreeToggleState {
  const layers = layersUnder(nodes, nodeId);
  const visible = layers.filter(
    ({ groupId, layerId }) =>
      layerSettingsOf(settings, groupId, layerId).visibleAtStart,
  ).length;
  if (visible === 0) return "unchecked";
  return visible === layers.length ? "checked" : "semichecked";
}

/** Turns all of a group's layers on at start, or off when all already are. */
export function toggleGroupVisible(
  settings: LayerTreeSettings,
  nodes: LayerTreeFlatNode[],
  nodeId: string,
): LayerTreeSettings {
  const visibleAtStart =
    groupToggleState(settings, nodes, nodeId) !== "checked";
  return layersUnder(nodes, nodeId).reduce(
    (next, { groupId, layerId }) =>
      withLayerSettings(next, groupId, layerId, {
        ...layerSettingsOf(next, groupId, layerId),
        visibleAtStart,
      }),
    settings,
  );
}

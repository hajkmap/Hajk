import type {
  MapGroupSettings,
  MapInfoGroup,
  MapLayerInfoClick,
  MapLayerSettings,
  MapLayerSublayerInfoClick,
  MapTreeSettings,
  StoredMapLayerInfoClick,
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
  options: {},
};

function isBlankInfoClickValue(value: unknown): boolean {
  if (value == null || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/** A non-empty template on this placement. An empty one uses the layer's own infoclick. */
export function hasInfoclickOverride(
  options: StoredMapLayerInfoClick | undefined,
): boolean {
  if (!options) return false;
  const rows = Array.isArray(options) ? options : (options.options ?? []);
  if (rows.some((row) => row.definition.trim().length > 0)) return true;
  if (Array.isArray(options)) return false;
  return typeof options.definition === "string" && options.definition.trim().length > 0;
}

export function infoClickIsEmpty(options: StoredMapLayerInfoClick | undefined): boolean {
  if (!options) return true;
  if (Array.isArray(options)) return options.length === 0;
  // A present `definition`, including "", is an override. Missing means no override.
  const record = options as Record<string, unknown>;
  return Object.entries(record).every(
    ([key, value]) => key !== "definition" && isBlankInfoClickValue(value),
  );
}

/** Sets the override template. "" is kept: an empty override shows nothing. */
export function withDefinition(
  options: MapLayerInfoClick,
  definition: string,
): MapLayerInfoClick {
  return { ...options, definition: definition.trim() };
}

export type SublayerOverride = MapLayerSublayerInfoClick;

function isSublayerRow(value: unknown): value is SublayerOverride {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.definition === "string";
}

/** The editor's object view. A stored WMS array is not wrapped in another `options` key when saved. */
export function asInfoClick(value: StoredMapLayerInfoClick | undefined): MapLayerInfoClick {
  if (Array.isArray(value)) return {};
  return value ?? {};
}

export function sublayerOverridesOf(
  options: StoredMapLayerInfoClick | undefined,
): SublayerOverride[] {
  const raw = Array.isArray(options) ? options : options?.options;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => (isSublayerRow(row) && row.id ? [row] : []));
}

/** What is saved. A WMS list is the array. A vector or search layer stays an object. */
export function storedInfoClick(options: MapLayerInfoClick, rows: SublayerOverride[] = []): StoredMapLayerInfoClick {
  const stored = rows
    .filter((row) => row.id)
    .map((row) => ({ id: row.id, definition: row.definition.trim() }));
  if (stored.length > 0) return stored;
  const next = { ...options };
  delete next.options;
  if (typeof next.definition === "string") next.definition = next.definition.trim();
  else delete next.definition;
  return next;
}

export const EMPTY_SETTINGS: LayerTreeSettings = { groups: {}, layers: {} };

export const layerSettingsKey = (groupId: string, layerId: string) =>
  `${groupId}|${layerId}`;

const isDefaultGroup = (values: GroupSettingsValues) =>
  JSON.stringify(values) === JSON.stringify(DEFAULT_GROUP_SETTINGS);

const isDefaultLayer = (values: LayerSettingsValues) =>
  values.visibleAtStart === DEFAULT_LAYER_SETTINGS.visibleAtStart &&
  infoClickIsEmpty(values.options);

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
  for (const { groupId, layerId, visibleAtStart, options } of settings?.layers ??
    []) {
    result.layers[layerSettingsKey(groupId, layerId)] = {
      visibleAtStart,
      options: options ?? {},
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

/** Signature of the settings as they would be saved with `nodes`. */
export const savedSettingsSignature = (
  settings: LayerTreeSettings,
  nodes: LayerTreeFlatNode[],
) => settingsSignature(fromMapTreeSettings(toMapTreeSettings(settings, nodes)));

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

// Layer trees: a group's content is an ordered list of layers and linked
// child groups; a group with child groups is a layer tree. A map's tree is an
// ordered top-level list of groups, apart from the layerswitcher tool, with
// the map's own exceptions to them, its background and its draw order.

export interface LayerTreeUsage {
  /** Groups that link this group into their content. */
  groups: number;
  /** Maps whose tree shows this group, hidden placements left out. */
  maps: number;
}

export type LayerTreeNode =
  | {
      type: "layer";
      id: string;
      name: string;
      /** In a map's tree: added to its group on this map only. */
      added?: true;
      /** Put in its group by the tree of this group (its id), not the group. */
      placedBy?: string;
      /** In a map's tree: one of the group's own items, hidden on this map. */
      hidden?: true;
    }
  | {
      type: "group";
      id: string;
      name: string;
      usedIn: LayerTreeUsage;
      items: LayerTreeNode[];
      /** Set when the group was already on the path and wasn't expanded. */
      cycle?: true;
      /** In a map's tree: put in its parent group on this map only. */
      added?: true;
      /** Put in its group by the tree of this group (its id), not the group. */
      placedBy?: string;
      hidden?: true;
    };

/** Maps with their own exceptions to a group (or a group inside it). */
export interface LayerTreeMapExceptions {
  mapName: string;
  added: number;
  hidden: number;
}

/**
 * Groups outside a group's tree that put layers or groups in it (or in a
 * group inside it) in their own trees.
 */
export interface LayerTreeGroupAdditions {
  groupId: string;
  name: string;
  added: number;
}

/** A group's tree always starts with the group itself. */
export type LayerTreeGroupNode = Extract<LayerTreeNode, { type: "group" }> & {
  mapExceptions?: LayerTreeMapExceptions[];
  groupAdditions?: LayerTreeGroupAdditions[];
  /** When the group's tree was last saved; null if never. */
  savedAt: string | null;
};

/**
 * What to save. Groups are only linked, sent without `items`. A group sent
 * with `new` and its `items` is created on save; its `id` is a temporary one.
 */
export type LayerTreeWriteNode =
  | { type: "layer"; id: string }
  | {
      type: "group";
      id: string;
      items?: LayerTreeWriteNode[];
      new?: true;
      name?: string;
    };

/**
 * What a group puts inside a group linked in its tree, as part of its own
 * tree, without changing that group.
 */
export interface GroupNestedPlacement {
  /** The group saved, or a new group's temporary id. */
  ownerId: string;
  /** The linked group it is put in. */
  groupId: string;
  type: "layer" | "group";
  id: string;
  /** The item it comes after; null puts it first. */
  after: { type: "layer" | "group"; id: string } | null;
  /** A group made in the editor, created on save with its name and items. */
  new?: true;
  name?: string;
  items?: LayerTreeWriteNode[];
}

export interface GroupTreeWrite {
  items: LayerTreeWriteNode[];
  nested: GroupNestedPlacement[];
}

export interface MapBackgroundLayer {
  layerId: string;
  name: string;
  visibleAtStart: boolean;
  infobox: string;
}

/** A map's own exception to a group it shows. */
export interface MapGroupException {
  groupId: string;
  kind: "add" | "hide";
  type: "layer" | "group";
  id: string;
  /** add: the item it comes after; null puts it first. */
  after?: { type: "layer" | "group"; id: string } | null;
}

/** A text box shown with a group in the client. */
export interface MapInfoGroup {
  visible: boolean;
  title: string;
  text: string;
  url: string;
  urlText: string;
  openDataLink: string;
  owner: string;
}

/** A map's settings for a group in its tree, the same wherever it shows. */
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

/** A map's settings for a layer in one of its groups. */
export interface MapLayerSettings {
  /** The group the layer shows in. */
  groupId: string;
  layerId: string;
  visibleAtStart: boolean;
  infobox: string;
}

/** Only settings that differ from the defaults are stored and loaded. */
export interface MapTreeSettings {
  groups: MapGroupSettings[];
  layers: MapLayerSettings[];
}

export interface MapLayerTree {
  mapName: string;
  /** With the map's exceptions merged in (see `added` and `hidden`). */
  items: LayerTreeNode[];
  /** The map's settings for the groups and layers in its tree. */
  settings: MapTreeSettings;
  background: MapBackgroundLayer[];
  /** Layer ids, top first. */
  drawOrder: string[];
  /** When the tree was last saved; null if never. */
  savedAt: string | null;
}

/** Settings, background and draw order are written only when sent. */
export interface MapLayerTreeWrite {
  /** Groups; new ones carry their content and are created on save. */
  items: LayerTreeWriteNode[];
  exceptions: MapGroupException[];
  settings?: MapTreeSettings;
  background?: Omit<MapBackgroundLayer, "name">[];
  drawOrder?: string[];
}

export interface LayerTreePlacement {
  /** Groups that hold the item. */
  groups: { id: string; name: string }[];
  /** Maps that have the item on their tree's top level. */
  maps: string[];
}

/** Where groups and layers are placed, keyed by id; unplaced ones are left out. */
export interface LayerTreePlacements {
  groups: Record<string, LayerTreePlacement>;
  layers: Record<string, LayerTreePlacement>;
}

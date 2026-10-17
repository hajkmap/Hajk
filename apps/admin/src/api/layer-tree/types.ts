// POC (layer trees): a group's content is an ordered list of layers and linked
// child groups; a group with child groups is a layer tree. A map's tree is an
// ordered top-level list of groups, apart from the layerswitcher tool, with
// the map's own exceptions to them, its background and its draw order.

export interface LayerTreeUsage {
  /** Groups that link this group into their content. */
  groups: number;
  /** Maps that have this group on their tree's top level. */
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

/** A group's tree always starts with the group itself. */
export type LayerTreeGroupNode = Extract<LayerTreeNode, { type: "group" }> & {
  mapExceptions?: LayerTreeMapExceptions[];
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

export interface MapLayerTree {
  mapName: string;
  /** With the map's exceptions merged in (see `added` and `hidden`). */
  items: LayerTreeNode[];
  background: MapBackgroundLayer[];
  /** Layer ids, top first. */
  drawOrder: string[];
}

/** Background and draw order are written only when sent. */
export interface MapLayerTreeWrite {
  items: LayerTreeWriteNode[];
  exceptions: MapGroupException[];
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

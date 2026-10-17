import { MapGroupExceptionKind } from "@prisma/client";
import log4js from "log4js";

import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";
import {
  applyAdded,
  applyExceptions,
  cycleMessage,
  effectiveDrawOrder,
  exceptionsByGroup,
  isItemType,
  isObject,
  itemKey,
  loadExceptions,
  parseMapTreeExtras,
  readBackground,
  validateMapTreeExtras,
  writeMapTreeExtras,
  type AddedRow,
  type ExceptionRow,
  type ItemType,
  type MapBackgroundLayer,
} from "./map-layer-tree-extras.ts";
import {
  readSettings,
  type MapTreeSettings,
} from "./map-layer-tree-settings.ts";

const logger = log4js.getLogger("service.v3.layer-tree");

// Layer trees. A group's content is an ordered list of layers and linked
// child groups (GroupItem); a group with child groups is a layer tree. Its
// tree also holds what it puts inside the groups linked in it, on its own
// (GroupNestedItem), so a group can nest linked groups in each other without
// changing them. A map's tree is an ordered top-level list of linked groups
// (MapTreeItem), kept apart from the layerswitcher tool; the map can put
// layers and groups in them, on this map only (MapGroupException). Linked
// groups are always expanded from their own content, so a change to a group
// shows up everywhere it's used.

/** Upper bound when expanding linked groups, in case stored data is broken. */
const MAX_DEPTH = 25;

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
      /** Set when expanding stopped because the group was already on the path. */
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

/** What a map shows in its tree. */
export interface MapContent {
  /** The groups shown, each once. */
  groups: Set<string>;
  /** Each layer shown, with the groups it shows in. */
  layers: Map<string, Set<string>>;
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
}

export type LayerTreeWriteNode =
  | { type: "layer"; id: string }
  | {
      type: "group";
      id: string;
      items?: LayerTreeWriteNode[];
      /** Created on save; `id` is then the client's temporary id. */
      new?: true;
      name?: string;
    };

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

/** What a group puts in a group linked in its tree, as the admin sends it. */
export interface GroupNestedInput {
  /** Whose tree it belongs to: the group saved, or a new group's temporary id. */
  ownerId: string;
  /** The linked group it is put in. */
  groupId: string;
  type: ItemType;
  id: string;
  /** The item it comes after; null puts it first. */
  after: { type: ItemType; id: string } | null;
  /** A group made in the editor, created on save with its name and items. */
  new?: true;
  name?: string;
  items?: LayerTreeWriteNode[];
}

interface ItemRef {
  displayLayerId: string | null;
  childGroupId: string | null;
}

/** By owner, then by the group the items are put in. */
type NestedByOwner = Map<string, Map<string, AddedRow[]>>;

interface TreeContext {
  groups: Map<string, { id: string; name: string }>;
  itemsByGroup: Map<string, ItemRef[]>;
  /** What each group puts in the groups linked in its tree. */
  nestedByOwner: NestedByOwner;
  layerNames: Map<string, string>;
  usage: Map<string, LayerTreeUsage>;
  /** In a map's tree: the map's exceptions, by group. */
  exceptions?: Map<string, ExceptionRow[]>;
  /** Chains of group ids that ended on a group already in them. */
  cycles: string[][];
}

/** What a save would store, so the tree can be expanded before it is written. */
interface TreeOverrides {
  /** New groups, by their temporary ids. */
  groups: Map<string, { id: string; name: string }>;
  itemsByGroup: Map<string, ItemRef[]>;
  nestedByOwner: NestedByOwner;
}

function badRequest(message: string): HajkError {
  return new HajkError(
    HttpStatusCodes.BAD_REQUEST,
    message,
    HajkStatusCodes.INVALID_REQUEST_BODY
  );
}

function unknownGroup(id: string): HajkError {
  return new HajkError(
    HttpStatusCodes.NOT_FOUND,
    `No group with id: ${id} could be found.`,
    HajkStatusCodes.UNKNOWN_GROUP_ID
  );
}

function parseWriteNodes(value: unknown, path: string): LayerTreeWriteNode[] {
  if (!Array.isArray(value)) {
    throw badRequest(`${path} must be an array.`);
  }
  return value.map((entry, index) => {
    const at = `${path}[${index}]`;
    if (!entry || typeof entry !== "object") {
      throw badRequest(`${at} must be an object.`);
    }
    const {
      type,
      id,
      items,
      new: isNew,
      name,
    } = entry as Record<string, unknown>;
    if (typeof id !== "string" || id.length === 0) {
      throw badRequest(`${at}.id must be a non-empty string.`);
    }
    if (type === "layer") {
      return { type, id };
    }
    if (type === "group") {
      const content =
        items === undefined ? undefined : parseWriteNodes(items, `${at}.items`);
      if (isNew === true) {
        if (typeof name !== "string" || name.trim().length === 0) {
          throw badRequest(`${at}.name is required for a new group.`);
        }
        return { type, id, new: true, name: name.trim(), items: content ?? [] };
      }
      return content === undefined
        ? { type, id }
        : { type, id, items: content };
    }
    throw badRequest(`${at}.type must be "layer" or "group".`);
  });
}

/** Reads what the group puts in the groups linked in its tree; none is fine. */
function parseNested(value: unknown): GroupNestedInput[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw badRequest("nested must be an array.");
  }
  const seen = new Set<string>();
  return value.flatMap((entry, index): GroupNestedInput[] => {
    const at = `nested[${index}]`;
    if (!isObject(entry)) throw badRequest(`${at} must be an object.`);
    const {
      ownerId,
      groupId,
      type,
      id,
      after,
      new: isNew,
      name,
      items,
    } = entry;
    if (typeof ownerId !== "string" || !ownerId) {
      throw badRequest(`${at}.ownerId must be a non-empty string.`);
    }
    if (typeof groupId !== "string" || !groupId) {
      throw badRequest(`${at}.groupId must be a non-empty string.`);
    }
    if (!isItemType(type) || typeof id !== "string" || !id) {
      throw badRequest(`${at} needs a type ("layer" or "group") and an id.`);
    }
    let parsedAfter: GroupNestedInput["after"] = null;
    if (isObject(after)) {
      if (!isItemType(after.type) || typeof after.id !== "string") {
        throw badRequest(`${at}.after needs a type and an id.`);
      }
      parsedAfter = { type: after.type, id: after.id };
    }
    // The same group can be linked twice in the tree; one row is enough.
    const key = `${ownerId}|${groupId}|${itemKey(type, id)}`;
    if (seen.has(key)) return [];
    seen.add(key);
    const placement: GroupNestedInput = {
      ownerId,
      groupId,
      type,
      id,
      after: parsedAfter,
    };
    if (isNew !== true) return [placement];
    // A group made in the editor right inside a linked group.
    if (type !== "group") {
      throw badRequest(`${at}: only a group can be new.`);
    }
    if (typeof name !== "string" || name.trim().length === 0) {
      throw badRequest(`${at}.name is required for a new group.`);
    }
    return [
      {
        ...placement,
        new: true,
        name: name.trim(),
        items: items === undefined ? [] : parseWriteNodes(items, `${at}.items`),
      },
    ];
  });
}

/** Stable text form of a node list, to compare two copies of the same group. */
function signature(nodes: LayerTreeWriteNode[]): string {
  return nodes
    .map((node) =>
      node.type === "group" && node.items
        ? `g:${node.id}[${signature(node.items)}]`
        : `${node.type === "layer" ? "l" : "g"}:${node.id}`
    )
    .join(",");
}

function assertNoDuplicates(owner: string, nodes: LayerTreeWriteNode[]) {
  const seen = new Set<string>();
  for (const node of nodes) {
    const key = `${node.type}:${node.id}`;
    if (seen.has(key)) {
      throw badRequest(
        `"${node.id}" appears more than once directly under "${owner}".`
      );
    }
    seen.add(key);
  }
}

class LayerTreeService {
  constructor() {
    logger.debug("Initiating Layer Tree Service");
  }

  private async requireMap(mapName: string) {
    const map = await prisma.map.findFirst({
      where: { name: mapName, deletedAt: null },
    });
    if (map === null) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `"${mapName}" is not a valid map`,
        HajkStatusCodes.UNKNOWN_MAP_NAME
      );
    }
    return map;
  }

  /**
   * Loads every group reachable from `rootGroupIds` (level by level), their
   * items and what they put in the groups linked in their trees, the names of
   * all layers involved and how widely each group is used. `overrides` stand
   * in for what a save is about to store.
   */
  private async loadContext(
    rootGroupIds: string[],
    rootLayerIds: string[],
    exceptions?: Map<string, ExceptionRow[]>,
    overrides?: TreeOverrides
  ): Promise<TreeContext> {
    const groups = new Map(overrides?.groups ?? []);
    const itemsByGroup = new Map<string, ItemRef[]>();
    const nestedByOwner: NestedByOwner = new Map();
    const layerIds = new Set(rootLayerIds);
    // The layers and groups a map puts in its groups.
    const addedGroupIds: string[] = [];
    for (const rows of exceptions?.values() ?? []) {
      for (const row of rows) {
        if (row.displayLayerId) layerIds.add(row.displayLayerId);
        if (row.kind === MapGroupExceptionKind.ADD && row.childGroupId) {
          addedGroupIds.push(row.childGroupId);
        }
      }
    }

    let frontier = [...new Set([...rootGroupIds, ...addedGroupIds])];
    for (let depth = 0; frontier.length > 0 && depth <= MAX_DEPTH; depth++) {
      const [groupRows, itemRows, nestedRows] = await Promise.all([
        // Deleted groups are left out of every tree, with their content.
        prisma.group.findMany({
          where: { id: { in: frontier }, deletedAt: null },
          select: { id: true, name: true },
        }),
        prisma.groupItem.findMany({
          where: {
            groupId: {
              in: frontier.filter((id) => !overrides?.itemsByGroup.has(id)),
            },
          },
          orderBy: { index: "asc" },
          select: { groupId: true, displayLayerId: true, childGroupId: true },
        }),
        prisma.groupNestedItem.findMany({
          where: {
            ownerGroupId: {
              in: frontier.filter((id) => !overrides?.nestedByOwner.has(id)),
            },
          },
          orderBy: { index: "asc" },
          select: {
            ownerGroupId: true,
            groupId: true,
            displayLayerId: true,
            childGroupId: true,
            afterKey: true,
          },
        }),
      ]);

      for (const group of groupRows) groups.set(group.id, group);
      for (const id of frontier) {
        itemsByGroup.set(id, [...(overrides?.itemsByGroup.get(id) ?? [])]);
        nestedByOwner.set(
          id,
          new Map(
            [...(overrides?.nestedByOwner.get(id) ?? [])].map(
              ([target, rows]) => [target, [...rows]]
            )
          )
        );
      }
      for (const row of itemRows) itemsByGroup.get(row.groupId)?.push(row);
      for (const { ownerGroupId, groupId, ...row } of nestedRows) {
        const byTarget = nestedByOwner.get(ownerGroupId);
        byTarget?.set(groupId, [...(byTarget.get(groupId) ?? []), row]);
      }

      const next = new Set<string>();
      const follow = (ref: AddedRow | ItemRef) => {
        if (ref.displayLayerId) layerIds.add(ref.displayLayerId);
        if (ref.childGroupId && !itemsByGroup.has(ref.childGroupId)) {
          next.add(ref.childGroupId);
        }
      };
      for (const id of frontier) {
        for (const ref of itemsByGroup.get(id) ?? []) follow(ref);
        for (const rows of nestedByOwner.get(id)?.values() ?? []) {
          for (const ref of rows) follow(ref);
        }
      }
      frontier = [...next];
    }

    const groupIds = [...groups.keys()];
    const [layers, parentLinks, mapLinks] = await Promise.all([
      prisma.displayLayer.findMany({
        where: { id: { in: [...layerIds] }, deletedAt: null },
        select: { id: true, name: true },
      }),
      prisma.groupItem.findMany({
        where: { childGroupId: { in: groupIds }, group: { deletedAt: null } },
        select: { groupId: true, childGroupId: true },
      }),
      prisma.mapTreeItem.findMany({
        where: { groupId: { in: groupIds }, map: { deletedAt: null } },
        select: { mapName: true, groupId: true },
      }),
    ]);

    const parents = new Map<string, Set<string>>();
    for (const link of parentLinks) {
      if (!link.childGroupId) continue;
      const set = parents.get(link.childGroupId) ?? new Set<string>();
      set.add(link.groupId);
      parents.set(link.childGroupId, set);
    }
    const maps = new Map<string, Set<string>>();
    for (const link of mapLinks) {
      if (!link.groupId) continue;
      const set = maps.get(link.groupId) ?? new Set<string>();
      set.add(link.mapName);
      maps.set(link.groupId, set);
    }

    const usage = new Map<string, LayerTreeUsage>();
    for (const id of groupIds) {
      usage.set(id, {
        groups: parents.get(id)?.size ?? 0,
        maps: maps.get(id)?.size ?? 0,
      });
    }

    return {
      groups,
      itemsByGroup,
      nestedByOwner,
      layerNames: new Map(layers.map((layer) => [layer.id, layer.name])),
      usage,
      exceptions,
      cycles: [],
    };
  }

  /** Turns item refs into nodes, expanding linked groups from their content. */
  private toNodes(
    refs: ItemRef[],
    context: TreeContext,
    path: string[]
  ): LayerTreeNode[] {
    const nodes: LayerTreeNode[] = [];
    for (const ref of refs) {
      if (ref.displayLayerId) {
        // Deleted layers are left out.
        const name = context.layerNames.get(ref.displayLayerId);
        if (name !== undefined) {
          nodes.push({ type: "layer", id: ref.displayLayerId, name });
        }
        continue;
      }
      if (!ref.childGroupId) continue;
      const node = this.toGroupNode(ref.childGroupId, context, path);
      if (node) nodes.push(node);
    }
    return nodes;
  }

  /**
   * A linked group as shown under `path`: its own content, then what the
   * groups above it put in it (the nearest first), then what the map does.
   */
  private toGroupNode(
    groupId: string,
    context: TreeContext,
    path: string[]
  ): LayerTreeNode | undefined {
    const group = context.groups.get(groupId);
    if (!group) return undefined;
    const usedIn = context.usage.get(group.id) ?? { groups: 0, maps: 0 };

    if (path.includes(group.id) || path.length >= MAX_DEPTH) {
      context.cycles.push([...path, group.id]);
      return {
        type: "group",
        id: group.id,
        name: group.name,
        usedIn,
        items: [],
        cycle: true,
      };
    }

    const inner = [...path, group.id];
    const buildGroup = (childGroupId: string) =>
      this.toGroupNode(childGroupId, context, inner);
    let items = this.toNodes(
      context.itemsByGroup.get(group.id) ?? [],
      context,
      inner
    );
    for (const owner of [...path].reverse()) {
      const rows = context.nestedByOwner.get(owner)?.get(group.id);
      if (rows?.length) {
        items = applyAdded(items, rows, context.layerNames, buildGroup, {
          placedBy: owner,
        });
      }
    }
    items = applyExceptions(
      items,
      context.exceptions?.get(group.id),
      context.layerNames,
      buildGroup
    );
    return { type: "group", id: group.id, name: group.name, usedIn, items };
  }

  private async assertExist(groupIds: Set<string>, layerIds: Set<string>) {
    const [groups, layers] = await Promise.all([
      prisma.group.findMany({
        where: { id: { in: [...groupIds] }, deletedAt: null },
        select: { id: true },
      }),
      prisma.displayLayer.findMany({
        where: { id: { in: [...layerIds] }, deletedAt: null },
        select: { id: true },
      }),
    ]);

    const foundGroups = new Set(groups.map((group) => group.id));
    const missingGroup = [...groupIds].find((id) => !foundGroups.has(id));
    if (missingGroup) {
      throw unknownGroup(missingGroup);
    }

    const foundLayers = new Set(layers.map((layer) => layer.id));
    const missingLayer = [...layerIds].find((id) => !foundLayers.has(id));
    if (missingLayer) {
      throw new HajkError(
        HttpStatusCodes.BAD_REQUEST,
        `Unknown or deleted layer id: ${missingLayer}`,
        HajkStatusCodes.UNKNOWN_LAYER_ID
      );
    }
  }

  async getGroupTree(
    groupId: string
  ): Promise<LayerTreeNode & { mapExceptions: LayerTreeMapExceptions[] }> {
    const context = await this.loadContext([groupId], []);
    if (!context.groups.has(groupId)) {
      throw unknownGroup(groupId);
    }
    const [root] = this.toNodes(
      [{ displayLayerId: null, childGroupId: groupId }],
      context,
      []
    );

    // So whoever edits the group sees which maps deviate from it.
    const exceptions = await prisma.mapGroupException.findMany({
      where: {
        groupId: { in: [...context.groups.keys()] },
        map: { deletedAt: null },
      },
      select: { mapName: true, kind: true },
    });
    const byMap = new Map<string, LayerTreeMapExceptions>();
    for (const { mapName, kind } of exceptions) {
      const entry = byMap.get(mapName) ?? { mapName, added: 0, hidden: 0 };
      if (kind === "ADD") entry.added += 1;
      else entry.hidden += 1;
      byMap.set(mapName, entry);
    }
    return {
      ...root,
      mapExceptions: [...byMap.values()].sort((a, b) =>
        a.mapName.localeCompare(b.mapName, "sv")
      ),
    };
  }

  /**
   * For every placed group and layer, the groups and maps it is placed in.
   * Lets the admin tell apart items that share a name.
   */
  async getPlacements(): Promise<LayerTreePlacements> {
    // Deleted layers, groups and maps are left out, as in the trees.
    const layerNotDeleted = {
      OR: [{ displayLayerId: null }, { displayLayer: { deletedAt: null } }],
    };
    const [groupItems, mapItems] = await Promise.all([
      prisma.groupItem.findMany({
        where: {
          group: { deletedAt: null },
          AND: [
            layerNotDeleted,
            {
              OR: [{ childGroupId: null }, { childGroup: { deletedAt: null } }],
            },
          ],
        },
        select: {
          displayLayerId: true,
          childGroupId: true,
          group: { select: { id: true, name: true } },
        },
      }),
      prisma.mapTreeItem.findMany({
        where: {
          map: { deletedAt: null },
          AND: [
            layerNotDeleted,
            { OR: [{ groupId: null }, { group: { deletedAt: null } }] },
          ],
        },
        select: { mapName: true, displayLayerId: true, groupId: true },
      }),
    ]);

    const placements: LayerTreePlacements = { groups: {}, layers: {} };
    const entry = (kind: keyof LayerTreePlacements, id: string) =>
      (placements[kind][id] ??= { groups: [], maps: [] });

    for (const item of groupItems) {
      if (item.childGroupId) {
        entry("groups", item.childGroupId).groups.push(item.group);
      }
      if (item.displayLayerId) {
        entry("layers", item.displayLayerId).groups.push(item.group);
      }
    }
    for (const item of mapItems) {
      if (item.groupId) entry("groups", item.groupId).maps.push(item.mapName);
      if (item.displayLayerId) {
        entry("layers", item.displayLayerId).maps.push(item.mapName);
      }
    }

    for (const placement of [
      ...Object.values(placements.groups),
      ...Object.values(placements.layers),
    ]) {
      placement.groups.sort((a, b) => a.name.localeCompare(b.name, "sv"));
      placement.maps.sort((a, b) => a.localeCompare(b, "sv"));
    }
    return placements;
  }

  /**
   * The map's tree with its exceptions merged in, its settings for the groups
   * and layers in it, its background layers and its draw order.
   */
  async getMapTree(mapName: string): Promise<MapLayerTree> {
    const map = await this.requireMap(mapName);
    const items = await this.getMapItems(map.name);
    const [settings, background, drawOrder] = await Promise.all([
      readSettings(map.name),
      readBackground(map.name),
      effectiveDrawOrder(map.name, items),
    ]);
    return { mapName: map.name, items, settings, background, drawOrder };
  }

  /**
   * What every map shows in its tree, with its exceptions applied and what it
   * hides left out: for the lists of where groups and layers are used.
   */
  async getMapContents(): Promise<Map<string, MapContent>> {
    const maps = await prisma.map.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { name: true },
    });
    const contents = new Map<string, MapContent>();
    for (const { name } of maps) {
      const content: MapContent = { groups: new Set(), layers: new Map() };
      const walk = (nodes: LayerTreeNode[], parentId: string) => {
        for (const node of nodes) {
          if (node.hidden) continue;
          if (node.type === "layer") {
            const groups = content.layers.get(node.id) ?? new Set<string>();
            content.layers.set(node.id, groups.add(parentId));
          } else if (!node.cycle) {
            content.groups.add(node.id);
            walk(node.items, node.id);
          }
        }
      };
      walk(await this.getMapItems(name), "");
      contents.set(name, content);
    }
    return contents;
  }

  /** The map's tree with its exceptions merged in. */
  private async getMapItems(mapName: string): Promise<LayerTreeNode[]> {
    const [rows, exceptions] = await Promise.all([
      prisma.mapTreeItem.findMany({
        where: { mapName },
        orderBy: { index: "asc" },
        select: { displayLayerId: true, groupId: true },
      }),
      loadExceptions(mapName),
    ]);
    const refs: ItemRef[] = rows.map((row) => ({
      displayLayerId: row.displayLayerId,
      childGroupId: row.groupId,
    }));
    const context = await this.loadContext(
      refs.flatMap((ref) => (ref.childGroupId ? [ref.childGroupId] : [])),
      refs.flatMap((ref) => (ref.displayLayerId ? [ref.displayLayerId] : [])),
      exceptions
    );
    return this.toNodes(refs, context, []);
  }

  /**
   * Replaces the group's tree: its content, and what it puts in the groups
   * linked in it (`nested`). Linked groups are sent without `items`: their
   * content is edited on the group itself. Only groups sent with `new` carry
   * their content; they are created in the same transaction, so nothing is
   * created if the save fails.
   */
  async updateGroupTree(groupId: string, body: unknown, userId?: string) {
    const root = await prisma.group.findFirst({
      where: { id: groupId, deletedAt: null },
      select: { id: true },
    });
    if (!root) {
      throw unknownGroup(groupId);
    }

    const raw = (body as { items?: unknown; nested?: unknown } | null) ?? {};
    const items = parseWriteNodes(raw.items, "items");
    const nested = parseNested(raw.nested);

    const rewrites = new Map<string, LayerTreeWriteNode[]>();
    // Temporary id → name of the groups to create.
    const newGroups = new Map<string, string>();
    const collect = (owner: string, nodes: LayerTreeWriteNode[]) => {
      const earlier = rewrites.get(owner);
      if (earlier) {
        if (signature(earlier) !== signature(nodes)) {
          throw badRequest(
            `Group "${owner}" appears more than once with different content.`
          );
        }
        return;
      }
      assertNoDuplicates(owner, nodes);
      rewrites.set(owner, nodes);
      for (const node of nodes) {
        if (node.type !== "group") continue;
        if (node.items && !node.new) {
          throw badRequest(
            `Group "${node.id}" is linked here; edit its content on the group itself.`
          );
        }
        if (node.new && node.name) {
          const earlierName = newGroups.get(node.id);
          if (earlierName !== undefined && earlierName !== node.name) {
            throw badRequest(
              `New group "${node.id}" is sent with two different names.`
            );
          }
          newGroups.set(node.id, node.name);
        }
        if (node.items) collect(node.id, node.items);
      }
    };
    collect(groupId, items);
    // Groups made in the editor right inside a linked group come with their
    // placement, and are created like the others.
    for (const entry of nested) {
      if (!entry.new) continue;
      if (newGroups.has(entry.id) || rewrites.has(entry.id)) {
        throw badRequest(`New group "${entry.id}" is sent more than once.`);
      }
      newGroups.set(entry.id, entry.name ?? entry.id);
      collect(entry.id, entry.items ?? []);
    }

    const groupIds = new Set<string>();
    const layerIds = new Set<string>();
    for (const [owner, nodes] of rewrites) {
      if (!newGroups.has(owner)) groupIds.add(owner);
      for (const node of nodes) {
        if (node.type === "layer") layerIds.add(node.id);
        else if (!newGroups.has(node.id)) groupIds.add(node.id);
      }
    }
    for (const entry of nested) {
      if (entry.ownerId !== groupId && !newGroups.has(entry.ownerId)) {
        throw badRequest(
          `nested: "${entry.ownerId}" is neither the group nor a new group in it.`
        );
      }
      if (newGroups.has(entry.groupId)) {
        throw badRequest(
          `nested: a new group's content goes in its items, not in nested.`
        );
      }
      groupIds.add(entry.groupId);
      if (entry.type === "layer") layerIds.add(entry.id);
      else if (!newGroups.has(entry.id)) groupIds.add(entry.id);
    }
    await this.assertExist(groupIds, layerIds);

    // The tree as it will be: nothing may end up inside itself, and what is
    // put in a linked group must land in a group in the owner's tree that
    // doesn't already show it.
    const overrides: TreeOverrides = {
      groups: new Map(
        [...newGroups].map(([id, name]) => [id, { id, name }] as const)
      ),
      itemsByGroup: new Map(
        [...rewrites].map(([owner, nodes]) => [
          owner,
          nodes.map((node) =>
            node.type === "layer"
              ? { displayLayerId: node.id, childGroupId: null }
              : { displayLayerId: null, childGroupId: node.id }
          ),
        ])
      ),
      nestedByOwner: new Map(
        [groupId, ...newGroups.keys()].map((owner) => [owner, new Map()])
      ),
    };
    for (const entry of nested) {
      const byTarget = overrides.nestedByOwner.get(entry.ownerId);
      byTarget?.set(entry.groupId, [
        ...(byTarget.get(entry.groupId) ?? []),
        {
          displayLayerId: entry.type === "layer" ? entry.id : null,
          childGroupId: entry.type === "group" ? entry.id : null,
          afterKey: entry.after
            ? itemKey(entry.after.type, entry.after.id)
            : null,
        },
      ]);
    }
    const context = await this.loadContext([groupId], [], undefined, overrides);
    const nameOf = (id: string) => context.groups.get(id)?.name ?? id;
    const [shownRoot] = this.toNodes(
      [{ displayLayerId: null, childGroupId: groupId }],
      context,
      []
    );
    if (context.cycles.length > 0) {
      throw badRequest(cycleMessage(context.cycles[0], nameOf));
    }
    // By owner and group: what the group shows in the owner's tree, apart
    // from what that owner put in it.
    const shownIn = new Map<string, Set<string>>();
    const walk = (nodes: LayerTreeNode[], path: string[]) => {
      for (const node of nodes) {
        if (node.type !== "group") continue;
        for (const owner of path) {
          const key = `${owner}|${node.id}`;
          const keys = shownIn.get(key) ?? new Set<string>();
          for (const item of node.items) {
            if (item.placedBy !== owner) keys.add(itemKey(item.type, item.id));
          }
          shownIn.set(key, keys);
        }
        walk(node.items, [...path, node.id]);
      }
    };
    walk(shownRoot ? [shownRoot] : [], []);
    for (const entry of nested) {
      const keys = shownIn.get(`${entry.ownerId}|${entry.groupId}`);
      if (!keys) {
        throw badRequest(
          `Group "${nameOf(entry.groupId)}" is not in the tree of "${nameOf(entry.ownerId)}".`
        );
      }
      if (keys.has(itemKey(entry.type, entry.id))) {
        throw badRequest(
          `"${nameOf(entry.groupId)}" already has ${entry.type} "${entry.type === "group" ? nameOf(entry.id) : entry.id}".`
        );
      }
    }

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      // New groups first, so the items below can point at their real ids.
      const realIds = new Map<string, string>();
      for (const [temporaryId, name] of newGroups) {
        const created = await tx.group.create({
          data: {
            name,
            createdBy: userId,
            createdDate: now,
            lastSavedBy: userId,
            lastSavedDate: now,
          },
          select: { id: true },
        });
        realIds.set(temporaryId, created.id);
      }
      const realId = (id: string) => realIds.get(id) ?? id;

      for (const [owner, nodes] of rewrites) {
        const ownerId = realId(owner);
        const isNew = newGroups.has(owner);
        if (!isNew) {
          await tx.groupItem.deleteMany({ where: { groupId: ownerId } });
        }
        if (nodes.length > 0) {
          await tx.groupItem.createMany({
            data: nodes.map((node, index) =>
              node.type === "layer"
                ? { groupId: ownerId, index, displayLayerId: node.id }
                : { groupId: ownerId, index, childGroupId: realId(node.id) }
            ),
          });
        }
        if (!isNew) {
          await tx.group.update({
            where: { id: ownerId },
            data: { lastSavedBy: userId, lastSavedDate: now },
          });
        }
      }

      // What the group and its new groups put in the linked groups.
      await tx.groupNestedItem.deleteMany({ where: { ownerGroupId: groupId } });
      if (nested.length > 0) {
        await tx.groupNestedItem.createMany({
          data: nested.map((entry, index) => ({
            ownerGroupId: realId(entry.ownerId),
            groupId: entry.groupId,
            index,
            displayLayerId: entry.type === "layer" ? entry.id : null,
            childGroupId: entry.type === "group" ? realId(entry.id) : null,
            afterKey: entry.after
              ? itemKey(entry.after.type, realId(entry.after.id))
              : null,
          })),
        });
      }
    });

    return await this.getGroupTree(groupId);
  }

  /**
   * Replaces the top level of the map's tree. The content of linked groups is
   * never written from here; it is edited on the group itself.
   */
  async updateMapTree(mapName: string, body: unknown, userId?: string) {
    const map = await this.requireMap(mapName);
    const items = parseWriteNodes(
      (body as { items?: unknown } | null)?.items,
      "items"
    );

    if (
      items.some((node) => node.type === "group" && (node.items || node.new))
    ) {
      throw badRequest(
        "A map's tree only places existing groups; create and edit groups on a group."
      );
    }
    // The client only shows layers inside groups.
    if (items.some((node) => node.type === "layer")) {
      throw badRequest(
        "A map's tree only holds groups; put layers in a group."
      );
    }
    assertNoDuplicates(map.name, items);

    const groupIds = new Set<string>();
    const layerIds = new Set<string>();
    for (const node of items) {
      (node.type === "layer" ? layerIds : groupIds).add(node.id);
    }
    await this.assertExist(groupIds, layerIds);

    // Exceptions, settings, background and draw order are written only when
    // sent.
    const extras = parseMapTreeExtras(body);
    let shown: LayerTreeNode[] = [];
    let context: TreeContext | undefined;
    if (extras.exceptions?.length || extras.settings) {
      if (extras.exceptions?.length) {
        await this.assertExist(
          new Set(
            extras.exceptions
              .filter((exception) => exception.type === "group")
              .map((exception) => exception.id)
          ),
          new Set()
        );
      }
      // The map's tree as it will be shown, with the groups it puts in others
      // (the stored exceptions, unless new ones are sent).
      context = await this.loadContext(
        [...groupIds],
        [],
        extras.exceptions
          ? exceptionsByGroup(extras.exceptions)
          : await loadExceptions(map.name)
      );
      shown = this.toNodes(
        [...groupIds].map((id) => ({ displayLayerId: null, childGroupId: id })),
        context,
        []
      );
    }
    await validateMapTreeExtras(
      extras,
      shown,
      context?.cycles ?? [],
      (id) => context?.groups.get(id)?.name ?? id
    );

    await prisma.$transaction(async (tx) => {
      await tx.mapTreeItem.deleteMany({ where: { mapName: map.name } });
      if (items.length > 0) {
        await tx.mapTreeItem.createMany({
          data: items.map((node, index) =>
            node.type === "layer"
              ? { mapName: map.name, index, displayLayerId: node.id }
              : { mapName: map.name, index, groupId: node.id }
          ),
        });
      }
      await writeMapTreeExtras(tx, map, extras);
      await tx.map.update({
        where: { id: map.id },
        data: { lastSavedBy: userId, lastSavedDate: new Date() },
      });
    });

    return await this.getMapTree(map.name);
  }
}

export default new LayerTreeService();

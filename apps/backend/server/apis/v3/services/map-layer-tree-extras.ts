import { MapGroupExceptionKind, UseType, type Prisma } from "@prisma/client";

import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";
import type { LayerTreeNode } from "./layer-tree.service.ts";
import {
  parseSettings,
  validateSettings,
  writeSettings,
  type MapTreeSettings,
} from "./map-layer-tree-settings.ts";

// POC (layer trees): what a map has besides its tree of groups. Exceptions to
// the groups it shows (a layer or group put in a group on this map only, or
// one of a group's own layers or groups hidden), its settings for the groups
// and layers in it, its background layers and its draw order. The additions
// work the same for what a group puts in the groups linked in its tree (see
// applyAdded).

export type ItemType = "layer" | "group";

/** A layer or group put in a group, after `afterKey` (null puts it first). */
export interface AddedRow {
  displayLayerId: string | null;
  childGroupId: string | null;
  afterKey: string | null;
}

/** Whose addition a node is: the map's, or a group's (by its id). */
export type AddedStamp = { added: true } | { placedBy: string };

export interface MapGroupExceptionInput {
  /** The group the exception is about. */
  groupId: string;
  kind: "add" | "hide";
  type: ItemType;
  id: string;
  /** add: the item the layer comes after; null or missing puts it first. */
  after?: { type: ItemType; id: string } | null;
}

export interface MapBackgroundLayer {
  layerId: string;
  name: string;
  visibleAtStart: boolean;
  infobox: string;
}

export interface MapBackgroundInput {
  layerId: string;
  visibleAtStart: boolean;
  infobox: string;
}

export interface MapTreeExtrasInput {
  exceptions?: MapGroupExceptionInput[];
  settings?: MapTreeSettings;
  background?: MapBackgroundInput[];
  /** Layer ids, top first. */
  drawOrder?: string[];
}

export interface ExceptionRow extends AddedRow {
  kind: MapGroupExceptionKind;
}

export const itemKey = (type: ItemType, id: string) => `${type}:${id}`;

/**
 * Why a tree can't be saved, given a chain of group ids that ended on a
 * group already in it (or one that just got too deep).
 */
export function cycleMessage(
  chain: string[],
  nameOf: (id: string) => string
): string {
  const last = chain[chain.length - 1];
  const loop = chain.slice(chain.indexOf(last));
  return loop.length > 1
    ? `A group can't contain itself: ${loop.map(nameOf).join(" → ")}.`
    : "The tree is nested too deep.";
}

function badRequest(message: string): HajkError {
  return new HajkError(
    HttpStatusCodes.BAD_REQUEST,
    message,
    HajkStatusCodes.INVALID_REQUEST_BODY
  );
}

export const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const isItemType = (value: unknown): value is ItemType =>
  value === "layer" || value === "group";

/** Reads the optional extras of a PUT on a map's tree. */
export function parseMapTreeExtras(body: unknown): MapTreeExtrasInput {
  const raw = isObject(body) ? body : {};
  const extras: MapTreeExtrasInput = {};

  if (raw.exceptions !== undefined) {
    if (!Array.isArray(raw.exceptions)) {
      throw badRequest("exceptions must be an array.");
    }
    extras.exceptions = raw.exceptions.map((entry, index) => {
      const at = `exceptions[${index}]`;
      if (!isObject(entry)) throw badRequest(`${at} must be an object.`);
      const { groupId, kind, type, id, after } = entry;
      if (typeof groupId !== "string" || !groupId) {
        throw badRequest(`${at}.groupId must be a non-empty string.`);
      }
      if (kind !== "add" && kind !== "hide") {
        throw badRequest(`${at}.kind must be "add" or "hide".`);
      }
      if (!isItemType(type) || typeof id !== "string" || !id) {
        throw badRequest(`${at} needs a type ("layer" or "group") and an id.`);
      }
      let parsedAfter: MapGroupExceptionInput["after"] = null;
      if (isObject(after)) {
        if (!isItemType(after.type) || typeof after.id !== "string") {
          throw badRequest(`${at}.after needs a type and an id.`);
        }
        parsedAfter = { type: after.type, id: after.id };
      }
      return { groupId, kind, type, id, after: parsedAfter };
    });
  }

  if (raw.settings !== undefined) {
    extras.settings = parseSettings(raw.settings);
  }

  if (raw.background !== undefined) {
    if (!Array.isArray(raw.background)) {
      throw badRequest("background must be an array.");
    }
    extras.background = raw.background.map((entry, index) => {
      if (!isObject(entry) || typeof entry.layerId !== "string") {
        throw badRequest(`background[${index}] needs a layerId.`);
      }
      return {
        layerId: entry.layerId,
        visibleAtStart: entry.visibleAtStart === true,
        infobox: typeof entry.infobox === "string" ? entry.infobox : "",
      };
    });
    const ids = extras.background.map((entry) => entry.layerId);
    if (new Set(ids).size !== ids.length) {
      throw badRequest("A background layer appears more than once.");
    }
  }

  if (raw.drawOrder !== undefined) {
    if (
      !Array.isArray(raw.drawOrder) ||
      raw.drawOrder.some((id) => typeof id !== "string")
    ) {
      throw badRequest("drawOrder must be an array of layer ids.");
    }
    extras.drawOrder = [...new Set(raw.drawOrder as string[])];
  }

  return extras;
}

/** An exception as stored. */
export function toExceptionRow(
  exception: MapGroupExceptionInput
): ExceptionRow {
  return {
    kind:
      exception.kind === "add"
        ? MapGroupExceptionKind.ADD
        : MapGroupExceptionKind.HIDE,
    displayLayerId: exception.type === "layer" ? exception.id : null,
    childGroupId: exception.type === "group" ? exception.id : null,
    afterKey: exception.after
      ? itemKey(exception.after.type, exception.after.id)
      : null,
  };
}

/** Exceptions by the group they are about, in order. */
export function exceptionsByGroup(
  exceptions: MapGroupExceptionInput[]
): Map<string, ExceptionRow[]> {
  const byGroup = new Map<string, ExceptionRow[]>();
  for (const exception of exceptions) {
    byGroup.set(exception.groupId, [
      ...(byGroup.get(exception.groupId) ?? []),
      toExceptionRow(exception),
    ]);
  }
  return byGroup;
}

/**
 * Puts the rows' layers and groups into the items, each stamped with
 * `stamp`, after the item its `afterKey` names (null puts it first; an item
 * that is gone puts it last). `buildGroup` expands a group with its content.
 * Deleted layers, unknown groups, and items the group already has, are left
 * out.
 */
export function applyAdded(
  items: LayerTreeNode[],
  rows: AddedRow[],
  layerNames: Map<string, string>,
  buildGroup: (groupId: string) => LayerTreeNode | undefined,
  stamp: AddedStamp
): LayerTreeNode[] {
  const result = [...items];
  for (const row of rows) {
    const layerName = row.displayLayerId
      ? layerNames.get(row.displayLayerId)
      : undefined;
    const node: LayerTreeNode | undefined =
      row.displayLayerId && layerName !== undefined
        ? { type: "layer", id: row.displayLayerId, name: layerName }
        : row.childGroupId
          ? buildGroup(row.childGroupId)
          : undefined;
    if (
      !node ||
      result.some((item) => item.type === node.type && item.id === node.id)
    ) {
      continue;
    }
    const afterIndex =
      row.afterKey === null
        ? -1
        : result.findIndex(
            (item) => itemKey(item.type, item.id) === row.afterKey
          );
    const at =
      row.afterKey === null
        ? 0
        : afterIndex === -1
          ? result.length
          : afterIndex + 1;
    result.splice(at, 0, { ...node, ...stamp });
  }
  return result;
}

/**
 * A group's items as shown on one map: the ones the map hides marked
 * `hidden`, and the layers and groups the map puts in it marked `added`.
 */
export function applyExceptions(
  items: LayerTreeNode[],
  rows: ExceptionRow[] | undefined,
  layerNames: Map<string, string>,
  buildGroup: (groupId: string) => LayerTreeNode | undefined
): LayerTreeNode[] {
  if (!rows?.length) return items;

  const hidden = new Set(
    rows
      .filter((row) => row.kind === MapGroupExceptionKind.HIDE)
      .map((row) =>
        row.displayLayerId
          ? itemKey("layer", row.displayLayerId)
          : itemKey("group", row.childGroupId ?? "")
      )
  );
  const shown: LayerTreeNode[] = items.map((item) =>
    hidden.has(itemKey(item.type, item.id)) ? { ...item, hidden: true } : item
  );
  return applyAdded(
    shown,
    rows.filter((row) => row.kind === MapGroupExceptionKind.ADD),
    layerNames,
    buildGroup,
    { added: true }
  );
}

/** The map's exceptions, by the group they are about, in order. */
export async function loadExceptions(
  mapName: string
): Promise<Map<string, ExceptionRow[]>> {
  const rows = await prisma.mapGroupException.findMany({
    where: { mapName },
    orderBy: { index: "asc" },
    select: {
      groupId: true,
      kind: true,
      displayLayerId: true,
      childGroupId: true,
      afterKey: true,
    },
  });
  const byGroup = new Map<string, ExceptionRow[]>();
  for (const { groupId, ...row } of rows) {
    byGroup.set(groupId, [...(byGroup.get(groupId) ?? []), row]);
  }
  return byGroup;
}

/** Layers shown on the map (hidden ones left out), each once, in tree order. */
export function shownLayerIds(items: LayerTreeNode[]): string[] {
  const ids = new Set<string>();
  const walk = (nodes: LayerTreeNode[]) => {
    for (const node of nodes) {
      if (node.hidden) continue;
      if (node.type === "layer") ids.add(node.id);
      else walk(node.items);
    }
  };
  walk(items);
  return [...ids];
}

const backgroundWhere = (mapName: string): Prisma.LayerInstanceWhereInput => ({
  map: { name: mapName },
  usage: UseType.BACKGROUND,
  groupId: null,
  displayLayerId: { not: null },
  displayLayer: { deletedAt: null },
});

function infoboxOf(options: Prisma.JsonValue): string {
  return isObject(options) && typeof options.infobox === "string"
    ? options.infobox
    : "";
}

/** The map's background layers, in order (the same rows Lagerordning edits). */
export async function readBackground(
  mapName: string
): Promise<MapBackgroundLayer[]> {
  const rows = await prisma.layerInstance.findMany({
    where: backgroundWhere(mapName),
    orderBy: { zIndex: "asc" },
    select: {
      visibleAtStart: true,
      options: true,
      displayLayer: { select: { id: true, name: true } },
    },
  });
  return rows.flatMap((row) =>
    row.displayLayer
      ? [
          {
            layerId: row.displayLayer.id,
            name: row.displayLayer.name,
            visibleAtStart: row.visibleAtStart,
            infobox: infoboxOf(row.options),
          },
        ]
      : []
  );
}

/**
 * The draw order, top first. A saved order is used where there is one;
 * otherwise the old one (layer instances' zIndex, set in Lagerordning).
 * Layers with neither go on top, in tree order.
 */
export async function effectiveDrawOrder(
  mapName: string,
  items: LayerTreeNode[]
): Promise<string[]> {
  const shown = shownLayerIds(items);
  const shownSet = new Set(shown);
  const saved = await prisma.mapDrawOrderItem.findMany({
    where: { mapName },
    orderBy: { index: "asc" },
    select: { displayLayerId: true },
  });

  let ordered: string[];
  if (saved.length > 0) {
    ordered = saved
      .map((row) => row.displayLayerId)
      .filter((id) => shownSet.has(id));
  } else {
    const instances = await prisma.layerInstance.findMany({
      where: {
        map: { name: mapName },
        displayLayerId: { in: shown },
        OR: [{ usage: null }, { usage: UseType.FOREGROUND }],
      },
      select: { displayLayerId: true, zIndex: true },
    });
    const zIndex = new Map<string, number>();
    for (const row of instances) {
      if (!row.displayLayerId) continue;
      zIndex.set(
        row.displayLayerId,
        Math.max(zIndex.get(row.displayLayerId) ?? -Infinity, row.zIndex)
      );
    }
    ordered = shown
      .filter((id) => zIndex.has(id))
      .sort((a, b) => (zIndex.get(b) ?? 0) - (zIndex.get(a) ?? 0));
  }

  const placed = new Set(ordered);
  return [...shown.filter((id) => !placed.has(id)), ...ordered];
}

/**
 * Checks the extras against the map's tree as it will be shown (`shown`,
 * built with the exceptions in): nothing may end up inside itself, an
 * exception must be about a group on the map and about what that group shows
 * there, settings must be about groups and layers on the map, and every
 * layer must exist.
 */
export async function validateMapTreeExtras(
  extras: MapTreeExtrasInput,
  shown: LayerTreeNode[],
  cycles: string[][],
  nameOf: (id: string) => string
) {
  const layerIds = new Set<string>([
    ...(extras.background ?? []).map((entry) => entry.layerId),
    ...(extras.drawOrder ?? []),
  ]);

  if (cycles.length > 0) {
    throw badRequest(cycleMessage(cycles[0], nameOf));
  }

  // What each group shows on the map, apart from what the map itself put in.
  const shownIn = new Map<string, Set<string>>();
  const walk = (nodes: LayerTreeNode[]) => {
    for (const node of nodes) {
      if (node.type !== "group") continue;
      const keys = shownIn.get(node.id) ?? new Set<string>();
      for (const item of node.items) {
        if (!item.added) keys.add(itemKey(item.type, item.id));
      }
      shownIn.set(node.id, keys);
      walk(node.items);
    }
  };
  walk(shown);

  for (const exception of extras.exceptions ?? []) {
    const keys = shownIn.get(exception.groupId);
    if (!keys) {
      throw badRequest(`Group "${exception.groupId}" is not on this map.`);
    }
    const group = nameOf(exception.groupId);
    const has = keys.has(itemKey(exception.type, exception.id));
    if (exception.kind === "hide" && !has) {
      throw badRequest(
        `Only what the group shows can be hidden; "${exception.id}" is not in "${group}".`
      );
    }
    if (exception.kind === "add") {
      if (has) {
        throw badRequest(
          `"${group}" already has ${exception.type} "${exception.id}".`
        );
      }
      if (exception.type === "layer") layerIds.add(exception.id);
    }
  }

  if (extras.settings) {
    validateSettings(extras.settings, shown, nameOf);
  }

  if (layerIds.size === 0) return;
  const found = new Set(
    (
      await prisma.displayLayer.findMany({
        where: { id: { in: [...layerIds] }, deletedAt: null },
        select: { id: true },
      })
    ).map((layer) => layer.id)
  );
  const missing = [...layerIds].find((id) => !found.has(id));
  if (missing) {
    throw new HajkError(
      HttpStatusCodes.BAD_REQUEST,
      `Unknown or deleted layer id: ${missing}`,
      HajkStatusCodes.UNKNOWN_LAYER_ID
    );
  }
}

/** Writes the extras that were sent, inside the tree's transaction. */
export async function writeMapTreeExtras(
  tx: Prisma.TransactionClient,
  map: { id: number; name: string },
  extras: MapTreeExtrasInput
) {
  if (extras.exceptions) {
    await tx.mapGroupException.deleteMany({ where: { mapName: map.name } });
    // The same group can be on the map twice; one row per exception is enough.
    const seen = new Set<string>();
    const rows = extras.exceptions.filter((exception) => {
      const key = `${exception.kind}|${exception.groupId}|${itemKey(exception.type, exception.id)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (rows.length > 0) {
      await tx.mapGroupException.createMany({
        data: rows.map((exception, index) => ({
          mapName: map.name,
          groupId: exception.groupId,
          index,
          ...toExceptionRow(exception),
        })),
      });
    }
  }

  if (extras.settings) {
    await writeSettings(tx, map.name, extras.settings);
  }

  if (extras.background) {
    // Rows are updated in place where the layer stays, so their ids (the
    // background layers' ids in the client) don't change on every save.
    const existing = await tx.layerInstance.findMany({
      where: { mapId: map.id, usage: UseType.BACKGROUND, groupId: null },
      select: { id: true, displayLayerId: true, options: true },
    });
    const kept = new Set<string>();
    for (const [index, entry] of extras.background.entries()) {
      const row = existing.find(
        (candidate) =>
          candidate.displayLayerId === entry.layerId && !kept.has(candidate.id)
      );
      const options = {
        ...(isObject(row?.options) ? row.options : {}),
        infobox: entry.infobox,
      };
      if (row) {
        kept.add(row.id);
        await tx.layerInstance.update({
          where: { id: row.id },
          data: {
            zIndex: index,
            visibleAtStart: entry.visibleAtStart,
            options,
          },
        });
      } else {
        await tx.layerInstance.create({
          data: {
            mapId: map.id,
            displayLayerId: entry.layerId,
            usage: UseType.BACKGROUND,
            visibleAtStart: entry.visibleAtStart,
            infoClickActive: true,
            zIndex: index,
            options,
          },
        });
      }
    }
    const removed = existing.filter((row) => !kept.has(row.id));
    if (removed.length > 0) {
      await tx.layerInstance.deleteMany({
        where: { id: { in: removed.map((row) => row.id) } },
      });
    }
  }

  if (extras.drawOrder) {
    await tx.mapDrawOrderItem.deleteMany({ where: { mapName: map.name } });
    if (extras.drawOrder.length > 0) {
      await tx.mapDrawOrderItem.createMany({
        data: extras.drawOrder.map((displayLayerId, index) => ({
          mapName: map.name,
          displayLayerId,
          index,
        })),
      });
    }
  }
}

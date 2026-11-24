import type { Prisma } from "@prisma/client";

import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";
import { isVisibleToUser } from "./group-visibility.ts";

function timeOf(value: Prisma.JsonValue | undefined): number | null {
  if (typeof value !== "string" || value === "") return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

function optionsRecord(options: Prisma.JsonValue): Prisma.JsonObject {
  return options !== null &&
    typeof options === "object" &&
    !Array.isArray(options)
    ? options
    : {};
}

/**
 * Whether a map, a layer, a service or a group is available at `now` by its
 * options: `visible` ("false" withholds it) and the optional period from
 * `visibleFrom` to `visibleUntil` (ISO date-times; unavailable from
 * `visibleUntil` on). Admin sees everything regardless.
 */
function isAvailableAt(options: Prisma.JsonValue, now: Date): boolean {
  const values = optionsRecord(options);
  if (values.visible === "false") return false;
  const from = timeOf(values.visibleFrom);
  const until = timeOf(values.visibleUntil);
  const at = now.getTime();
  return (from === null || from <= at) && (until === null || at < until);
}

/** A map, a group or a layer: what decides whether the client's user gets it. */
interface Restricted {
  options: Prisma.JsonValue;
  visibleForGroups: string[];
}

/**
 * Whether the client's user gets a map, a layer or a group now: it is
 * available at `now` and, while the backend looks users up in AD, `adUser`
 * is in one of its `visibleForGroups` (none: everyone). `what` names it in
 * the log.
 */
export async function isAvailable(
  item: Restricted,
  adUser: string | undefined,
  what: string,
  now: Date = new Date()
): Promise<boolean> {
  return (
    isAvailableAt(item.options, now) &&
    (await isVisibleToUser(item.visibleForGroups, adUser, what))
  );
}

/** Those of `items` the client's user gets now; `what` names one in the log. */
export async function onlyAvailable<T extends Restricted>(
  items: T[],
  adUser: string | undefined,
  what: (item: T) => string,
  now: Date = new Date()
): Promise<T[]> {
  const available: T[] = [];
  for (const item of items) {
    if (await isAvailable(item, adUser, what(item), now)) {
      available.push(item);
    }
  }
  return available;
}

interface LayerWithService extends Restricted {
  id: string;
  service: { options: Prisma.JsonValue };
}

/**
 * Whether the client's user gets a layer now: they get the layer, and its
 * service is available at `now`.
 */
export async function isLayerAvailable(
  layer: LayerWithService,
  adUser: string | undefined,
  now: Date = new Date()
): Promise<boolean> {
  return (
    isAvailableAt(layer.service.options, now) &&
    (await isAvailable(layer, adUser, `layer ${layer.id}`, now))
  );
}

/** The layers the client's user gets now. */
export async function onlyAvailableLayers<T extends LayerWithService>(
  layers: T[],
  adUser: string | undefined,
  now: Date = new Date()
): Promise<T[]> {
  const available: T[] = [];
  for (const layer of layers) {
    if (await isLayerAvailable(layer, adUser, now)) available.push(layer);
  }
  return available;
}

/** The map, when it exists and the client's user gets it now. */
export async function requireAvailableMap(
  mapName: string,
  adUser: string | undefined
) {
  const map = await prisma.map.findFirst({
    where: { name: mapName, deletedAt: null },
    select: { name: true, options: true, visibleForGroups: true },
  });
  if (map === null) {
    throw new HajkError(
      HttpStatusCodes.NOT_FOUND,
      `"${mapName}" is not a valid map`,
      HajkStatusCodes.UNKNOWN_MAP_NAME
    );
  }
  if (!(await isAvailable(map, adUser, `map ${mapName}`))) {
    throw new HajkError(
      HttpStatusCodes.NOT_FOUND,
      `"${mapName}" is not available to the user now`,
      HajkStatusCodes.MAP_NOT_VISIBLE
    );
  }
  return map;
}

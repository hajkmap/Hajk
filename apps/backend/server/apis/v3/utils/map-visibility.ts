import type { Prisma } from "@prisma/client";

import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";

function timeOf(value: Prisma.JsonValue | undefined): number | null {
  if (typeof value !== "string" || value === "") return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

/**
 * Whether a map is shown to its users at `now`, from the map's options:
 * `visible` ("false" hides it) and the optional period from `visibleFrom` to
 * `visibleUntil` (ISO date-times, the map is hidden from `visibleUntil` on).
 */
export function isMapVisible(
  options: Prisma.JsonValue,
  now: Date = new Date()
): boolean {
  const values =
    options !== null && typeof options === "object" && !Array.isArray(options)
      ? options
      : {};
  if (values.visible === "false") return false;
  const from = timeOf(values.visibleFrom);
  const until = timeOf(values.visibleUntil);
  const at = now.getTime();
  return (from === null || from <= at) && (until === null || at < until);
}

/** The map, when it exists and is shown to its users now. */
export async function requireVisibleMap(mapName: string) {
  const map = await prisma.map.findFirst({
    where: { name: mapName, deletedAt: null },
    select: { name: true, options: true },
  });
  if (map === null) {
    throw new HajkError(
      HttpStatusCodes.NOT_FOUND,
      `"${mapName}" is not a valid map`,
      HajkStatusCodes.UNKNOWN_MAP_NAME
    );
  }
  if (!isMapVisible(map.options)) {
    throw new HajkError(
      HttpStatusCodes.NOT_FOUND,
      `"${mapName}" is not shown to its users now`,
      HajkStatusCodes.MAP_NOT_VISIBLE
    );
  }
  return map;
}

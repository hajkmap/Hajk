import type { Prisma } from "@prisma/client";

import prisma from "../../../common/prisma.ts";
import type { LayerKind } from "./layer-payload.ts";

export async function resolveLayerKindById(
  id: string
): Promise<LayerKind | null> {
  const display = await prisma.displayLayer.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (display) return "display";

  const search = await prisma.searchLayer.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (search) return "search";

  const editing = await prisma.editingLayer.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (editing) return "editing";

  return null;
}

/** Whether a layer id exists but is soft-deleted (cannot be placed on a map). */
export async function isSoftDeletedLayerId(id: string): Promise<boolean> {
  const deletedWhere = { id, deletedAt: { not: null } } as const;
  const [display, search, editing] = await Promise.all([
    prisma.displayLayer.findFirst({ where: deletedWhere, select: { id: true } }),
    prisma.searchLayer.findFirst({ where: deletedWhere, select: { id: true } }),
    prisma.editingLayer.findFirst({ where: deletedWhere, select: { id: true } }),
  ]);
  return Boolean(display ?? search ?? editing);
}

/**
 * Resolves an active layer kind for map placement, or why the id was rejected.
 * Soft-deleted layers are excluded (same filter as GET /maps/:name/layers).
 */
export async function resolveLayerPlacementById(
  id: string,
): Promise<
  { ok: true; kind: LayerKind } | { ok: false; reason: "deleted" | "unknown" }
> {
  const kind = await resolveLayerKindById(id);
  if (kind) {
    return { ok: true, kind };
  }
  if (await isSoftDeletedLayerId(id)) {
    return { ok: false, reason: "deleted" };
  }
  return { ok: false, reason: "unknown" };
}

/** Prisma connect input for exactly one layer FK on LayerInstance. */
export async function layerInstanceLayerConnect(input: {
  displayLayerId?: string;
  searchLayerId?: string;
  editingLayerId?: string;
  layerId?: string;
}): Promise<
  Pick<
    Prisma.LayerInstanceCreateInput,
    "displayLayer" | "searchLayer" | "editingLayer"
  >
> {
  if (input.displayLayerId) {
    return { displayLayer: { connect: { id: input.displayLayerId } } };
  }
  if (input.searchLayerId) {
    return { searchLayer: { connect: { id: input.searchLayerId } } };
  }
  if (input.editingLayerId) {
    return { editingLayer: { connect: { id: input.editingLayerId } } };
  }
  if (input.layerId) {
    const kind = await resolveLayerKindById(input.layerId);
    if (kind === "display") {
      return { displayLayer: { connect: { id: input.layerId } } };
    }
    if (kind === "search") {
      return { searchLayer: { connect: { id: input.layerId } } };
    }
    if (kind === "editing") {
      return { editingLayer: { connect: { id: input.layerId } } };
    }
    throw new Error(`Unknown layer id for LayerInstance: ${input.layerId}`);
  }
  throw new Error(
    "LayerInstance requires displayLayerId, searchLayerId, editingLayerId, or layerId"
  );
}

/** Active (non-deleted) layer filter for LayerInstance queries. */
export const activeLayerInstanceWhere: Prisma.LayerInstanceWhereInput = {
  OR: [
    { displayLayer: { deletedAt: null } },
    { searchLayer: { deletedAt: null } },
    { editingLayer: { deletedAt: null } },
  ],
};

/**
 * LayerInstance filter shared by getLayersForMap and map list layer counts —
 * active instances linked directly to the map or via a group placed on it.
 */
export function activeLayerInstancesForMapWhere(
  mapName: string
): Prisma.LayerInstanceWhereInput {
  return {
    AND: [
      activeLayerInstanceWhere,
      {
        OR: [
          { map: { name: mapName } },
          { group: { maps: { some: { mapName } } } },
        ],
      },
    ],
  };
}

/** Batch variant of {@link activeLayerInstancesForMapWhere}. */
export function activeLayerInstancesForMapsWhere(
  mapNames: string[]
): Prisma.LayerInstanceWhereInput {
  return {
    AND: [
      activeLayerInstanceWhere,
      {
        OR: [
          { map: { name: { in: mapNames } } },
          {
            group: {
              maps: { some: { mapName: { in: mapNames } } },
            },
          },
        ],
      },
    ],
  };
}

export const layerInstanceIncludeAll = {
  displayLayer: true,
  searchLayer: true,
  editingLayer: true,
} as const;

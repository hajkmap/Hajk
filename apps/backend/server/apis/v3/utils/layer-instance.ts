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

export const layerInstanceIncludeAll = {
  displayLayer: true,
  searchLayer: true,
  editingLayer: true,
} as const;

import { Prisma, ServiceType } from "@prisma/client";
import log4js from "log4js";

import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import {
  pickLayerCreateData,
  pickLayerUpdateData,
  type LayerKind,
} from "../utils/layer-payload.ts";

const logger = log4js.getLogger("service.v3.layer");

export type { LayerKind };

export interface UnifiedLayer {
  layerKind: LayerKind;
  id: string;
  serviceId: string;
  name: string;
  internalName?: string | null;
  description?: string | null;
  selectedLayers: string[];
  locked: boolean;
  createdBy?: string | null;
  createdDate?: Date | null;
  lastSavedBy?: string | null;
  lastSavedDate?: Date | null;
  deletedAt?: Date | null;
  options: Prisma.JsonValue;
  metadata?: Prisma.MetadataGetPayload<object> | null;
  searchSettings?: {
    id: string;
    active: boolean;
    url?: string | null;
    searchFields: string[];
    primaryDisplayFields: string[];
    secondaryDisplayFields: string[];
    shortDisplayFields: string[];
    geometryField?: string | null;
    outputFormat: string;
  };
  infoClickSettings?: Prisma.InfoClickSettingsGetPayload<object> | null;
  service?: Prisma.ServiceGetPayload<object>;
  [key: string]: unknown;
}

function toSearchSettingsShape(layer: {
  id: string;
  active: boolean;
  url?: string | null;
  searchFields: string[];
  primaryDisplayFields: string[];
  secondaryDisplayFields: string[];
  shortDisplayFields: string[];
  geometryField?: string | null;
  outputFormat: string;
}) {
  return {
    id: layer.id,
    active: layer.active,
    url: layer.url,
    searchFields: layer.searchFields,
    primaryDisplayFields: layer.primaryDisplayFields,
    secondaryDisplayFields: layer.secondaryDisplayFields,
    shortDisplayFields: layer.shortDisplayFields,
    geometryField: layer.geometryField,
    outputFormat: layer.outputFormat,
  };
}

function mapDisplayLayer(
  layer: Prisma.DisplayLayerGetPayload<{
    include: {
      metadata: true;
      infoClickSettings: true;
    };
  }>
): UnifiedLayer {
  return {
    layerKind: "display",
    ...layer,
    searchSettings: undefined,
  };
}

function mapSearchLayer(
  layer: Prisma.SearchLayerGetPayload<{
    include: { metadata: true };
  }>
): UnifiedLayer {
  return {
    layerKind: "search",
    ...layer,
    searchSettings: toSearchSettingsShape(layer),
    infoClickSettings: null,
    infoClickSettingsId: undefined,
    metadataId: layer.metadataId,
  };
}

function mapEditingLayer(
  layer: Prisma.EditingLayerGetPayload<object>
): UnifiedLayer {
  return {
    layerKind: "editing",
    ...layer,
    metadata: null,
    metadataId: null,
    searchSettings: undefined,
    infoClickSettings: null,
  };
}

async function resolveLayerKind(id: string): Promise<LayerKind | null> {
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

class LayerService {
  constructor() {
    logger.debug("Initiating Layer Service");
  }

  async getLayers(): Promise<UnifiedLayer[]> {
    const [displayLayers, searchLayers, editingLayers] = await Promise.all([
      prisma.displayLayer.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
        include: { metadata: true, infoClickSettings: true },
      }),
      prisma.searchLayer.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
        include: { metadata: true },
      }),
      prisma.editingLayer.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      }),
    ]);

    return [
      ...displayLayers.map(mapDisplayLayer),
      ...searchLayers.map(mapSearchLayer),
      ...editingLayers.map(mapEditingLayer),
    ];
  }

  async getLayerById(id: string): Promise<UnifiedLayer | null> {
    const kind = await resolveLayerKind(id);
    if (!kind) {
      const softDeleted =
        (await prisma.displayLayer.findUnique({ where: { id } })) ??
        (await prisma.searchLayer.findUnique({ where: { id } })) ??
        (await prisma.editingLayer.findUnique({ where: { id } }));
      if (softDeleted) return null;
      return null;
    }

    if (kind === "display") {
      const layer = await prisma.displayLayer.findUnique({
        where: { id },
        include: {
          metadata: true,
          infoClickSettings: true,
        },
      });
      return layer?.deletedAt ? null : layer ? mapDisplayLayer(layer) : null;
    }

    if (kind === "search") {
      const layer = await prisma.searchLayer.findUnique({
        where: { id },
        include: { metadata: true },
      });
      return layer?.deletedAt ? null : layer ? mapSearchLayer(layer) : null;
    }

    const layer = await prisma.editingLayer.findUnique({ where: { id } });
    return layer?.deletedAt ? null : layer ? mapEditingLayer(layer) : null;
  }

  async getLayerTypes() {
    return Object.values(ServiceType);
  }

  async getLayersByType(type: ServiceType): Promise<UnifiedLayer[]> {
    const [displayLayers, searchLayers, editingLayers] = await Promise.all([
      prisma.displayLayer.findMany({
        where: { deletedAt: null, service: { type, deletedAt: null } },
        include: { metadata: true, infoClickSettings: true },
      }),
      prisma.searchLayer.findMany({
        where: { deletedAt: null, service: { type, deletedAt: null } },
        include: { metadata: true },
      }),
      prisma.editingLayer.findMany({
        where: { deletedAt: null, service: { type, deletedAt: null } },
      }),
    ]);

    return [
      ...displayLayers.map(mapDisplayLayer),
      ...searchLayers.map(mapSearchLayer),
      ...editingLayers.map(mapEditingLayer),
    ];
  }

  async getServiceByLayerId(id: string) {
    const kind = await resolveLayerKind(id);
    if (!kind) return null;

    if (kind === "display") {
      const row = await prisma.displayLayer.findUnique({
        where: { id },
        include: { service: true },
      });
      if (row?.deletedAt || row?.service?.deletedAt) return null;
      return row?.service ?? null;
    }

    if (kind === "search") {
      const row = await prisma.searchLayer.findUnique({
        where: { id },
        include: { service: true },
      });
      if (row?.deletedAt || row?.service?.deletedAt) return null;
      return row?.service ?? null;
    }

    const row = await prisma.editingLayer.findUnique({
      where: { id },
      include: { service: true },
    });
    if (row?.deletedAt || row?.service?.deletedAt) return null;
    return row?.service ?? null;
  }

  async createLayer(
    data: Record<string, unknown> & {
      serviceId: string;
      layerKind?: LayerKind;
    },
    userId?: string
  ) {
    const layerKind = (data.layerKind as LayerKind | undefined) ?? "display";
    const { serviceId } = data;
    const picked = pickLayerCreateData(layerKind, data);
    const metadata = picked.metadata;
    const infoClickSettings = picked.infoClickSettings;
    delete picked.metadata;
    delete picked.infoClickSettings;

    if (layerKind === "search") {
      const created = await prisma.searchLayer.create({
        data: {
          ...(picked as Prisma.SearchLayerCreateInput),
          createdBy: userId,
          createdDate: new Date(),
          service: { connect: { id: serviceId } },
          metadata: metadata
            ? {
                create:
                  metadata as Prisma.MetadataCreateWithoutSearchLayerInput,
              }
            : undefined,
        },
        include: { metadata: true },
      });
      return mapSearchLayer(created);
    }

    if (layerKind === "editing") {
      const created = await prisma.editingLayer.create({
        data: {
          ...(picked as Prisma.EditingLayerCreateInput),
          createdBy: userId,
          createdDate: new Date(),
          service: { connect: { id: serviceId } },
        },
      });
      return mapEditingLayer(created);
    }

    const created = await prisma.displayLayer.create({
      data: {
        ...(picked as Prisma.DisplayLayerCreateInput),
        createdBy: userId,
        createdDate: new Date(),
        service: { connect: { id: serviceId } },
        metadata: metadata
          ? {
              create: metadata as Prisma.MetadataCreateWithoutDisplayLayerInput,
            }
          : undefined,
        infoClickSettings: {
          create:
            infoClickSettings as Prisma.InfoClickSettingsCreateWithoutDisplayLayerInput,
        },
      },
      include: { metadata: true, infoClickSettings: true },
    });
    return mapDisplayLayer(created);
  }

  async updateLayer(
    id: string,
    data: Record<string, unknown> & { serviceId?: string },
    userId?: string
  ) {
    const kind =
      (data.layerKind as LayerKind | undefined) ?? (await resolveLayerKind(id));
    if (!kind) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No layer with id: ${id} could be found.`,
        HajkStatusCodes.UNKNOWN_LAYER_ID
      );
    }

    const { serviceId } = data;
    const { scalars, options, metadata, infoClickSettings } =
      pickLayerUpdateData(kind, data);

    if (kind === "search") {
      const updated = await prisma.searchLayer.update({
        where: { id },
        data: {
          ...(scalars as Prisma.SearchLayerUpdateInput),
          lastSavedBy: userId,
          lastSavedDate: new Date(),
          ...(options !== undefined ? { options } : {}),
          ...(serviceId ? { service: { connect: { id: serviceId } } } : {}),
          metadata: metadata
            ? {
                upsert: {
                  update:
                    metadata as Prisma.MetadataUpdateWithoutSearchLayerInput,
                  create:
                    metadata as Prisma.MetadataCreateWithoutSearchLayerInput,
                },
              }
            : undefined,
        },
        include: { metadata: true, service: true },
      });
      return mapSearchLayer(updated);
    }

    if (kind === "editing") {
      const existing = await prisma.editingLayer.findUnique({
        where: { id },
        select: { options: true },
      });
      const existingOptions = (existing?.options as object) || {};
      const updatedOptions = {
        ...existingOptions,
        ...(options as object),
      };
      const updated = await prisma.editingLayer.update({
        where: { id },
        data: {
          ...(scalars as Prisma.EditingLayerUpdateInput),
          lastSavedBy: userId,
          lastSavedDate: new Date(),
          options: updatedOptions,
          ...(serviceId ? { service: { connect: { id: serviceId } } } : {}),
        },
        include: { service: true },
      });
      return mapEditingLayer(updated);
    }

    const existingLayer = await prisma.displayLayer.findUnique({
      where: { id },
      select: { options: true },
    });
    const existingOptions = (existingLayer?.options as object) || {};
    const updatedOptions = {
      ...existingOptions,
      ...(options as object),
    };
    const updated = await prisma.displayLayer.update({
      where: { id },
      data: {
        ...(scalars as Prisma.DisplayLayerUpdateInput),
        lastSavedBy: userId,
        lastSavedDate: new Date(),
        options: updatedOptions,
        ...(serviceId ? { service: { connect: { id: serviceId } } } : {}),
        metadata: metadata
          ? {
              upsert: {
                update:
                  metadata as Prisma.MetadataUpdateWithoutDisplayLayerInput,
                create:
                  metadata as Prisma.MetadataCreateWithoutDisplayLayerInput,
              },
            }
          : undefined,
        infoClickSettings: infoClickSettings
          ? {
              upsert: {
                update:
                  infoClickSettings as Prisma.InfoClickSettingsUpdateWithoutDisplayLayerInput,
                create:
                  infoClickSettings as Prisma.InfoClickSettingsCreateWithoutDisplayLayerInput,
              },
            }
          : undefined,
      },
      include: {
        service: true,
        metadata: true,
        infoClickSettings: true,
      },
    });
    return mapDisplayLayer(updated);
  }

  async deleteLayer(id: string) {
    await prisma.$transaction(async (transaction) => {
      await this.deleteLayerInTransaction(transaction, id);
    });
  }

  async deleteLayerInTransaction(
    transaction: Prisma.TransactionClient,
    id: string
  ) {
    const kind = await resolveLayerKind(id);
    if (!kind) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No layer with id: ${id} could be found.`,
        HajkStatusCodes.UNKNOWN_LAYER_ID
      );
    }

    const deletedAt = new Date();

    if (kind === "display") {
      const layer = await transaction.displayLayer.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, metadataId: true, infoClickSettingsId: true },
      });
      if (!layer) {
        throw new HajkError(
          HttpStatusCodes.NOT_FOUND,
          `No layer with id: ${id} could be found.`,
          HajkStatusCodes.UNKNOWN_LAYER_ID
        );
      }

      await transaction.layerInstance.deleteMany({
        where: { displayLayerId: id },
      });
      await transaction.roleOnDisplayLayer.deleteMany({
        where: { displayLayerId: id },
      });
      await transaction.displayLayer.updateMany({
        where: { id, deletedAt: null },
        data: {
          deletedAt,
          lastSavedDate: deletedAt,
          metadataId: null,
          infoClickSettingsId: null,
        },
      });
      if (layer.metadataId) {
        await transaction.metadata.deleteMany({
          where: { id: layer.metadataId },
        });
      }
      if (layer.infoClickSettingsId) {
        await transaction.infoClickSettings.deleteMany({
          where: { id: layer.infoClickSettingsId },
        });
      }
      return;
    }

    if (kind === "search") {
      const layer = await transaction.searchLayer.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, metadataId: true },
      });
      if (!layer) {
        throw new HajkError(
          HttpStatusCodes.NOT_FOUND,
          `No layer with id: ${id} could be found.`,
          HajkStatusCodes.UNKNOWN_LAYER_ID
        );
      }
      await transaction.layerInstance.deleteMany({
        where: { searchLayerId: id },
      });
      await transaction.roleOnSearchLayer.deleteMany({
        where: { searchLayerId: id },
      });
      await transaction.searchLayer.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt, lastSavedDate: deletedAt, metadataId: null },
      });
      if (layer.metadataId) {
        await transaction.metadata.deleteMany({
          where: { id: layer.metadataId },
        });
      }
      return;
    }

    const layer = await transaction.editingLayer.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!layer) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No layer with id: ${id} could be found.`,
        HajkStatusCodes.UNKNOWN_LAYER_ID
      );
    }
    await transaction.layerInstance.deleteMany({
      where: { editingLayerId: id },
    });
    await transaction.roleOnEditingLayer.deleteMany({
      where: { editingLayerId: id },
    });
    await transaction.editingLayer.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt, lastSavedDate: deletedAt },
    });
  }

  async getUsageByLayerId(id: string) {
    const kind = await resolveLayerKind(id);
    const usageSelect = {
      id: true,
      displayLayerId: true,
      searchLayerId: true,
      editingLayerId: true,
      usage: true,
      map: { select: { id: true, name: true } },
      group: {
        select: {
          id: true,
          name: true,
          maps: { select: { mapName: true } },
        },
      },
    } as const;

    if (kind === "search") {
      return await prisma.layerInstance.findMany({
        where: { searchLayerId: id, searchLayer: { deletedAt: null } },
        select: usageSelect,
      });
    }

    if (kind === "editing") {
      return await prisma.layerInstance.findMany({
        where: { editingLayerId: id, editingLayer: { deletedAt: null } },
        select: usageSelect,
      });
    }

    return await prisma.layerInstance.findMany({
      where: { displayLayerId: id, displayLayer: { deletedAt: null } },
      select: usageSelect,
    });
  }

  async getRoleOnLayerByLayerId(layerId: string) {
    const kind = await resolveLayerKind(layerId);
    if (kind === "search") {
      return prisma.roleOnSearchLayer.findFirst({
        where: { searchLayerId: layerId },
        include: { role: true },
      });
    }
    if (kind === "editing") {
      return prisma.roleOnEditingLayer.findFirst({
        where: { editingLayerId: layerId },
        include: { role: true },
      });
    }
    return prisma.roleOnDisplayLayer.findFirst({
      where: { displayLayerId: layerId },
      include: { role: true },
    });
  }

  async createAndUpdateRoleOnLayer(data: {
    layerId: string;
    roleId: string;
    layerKind?: LayerKind;
  }) {
    const kind =
      data.layerKind ?? (await resolveLayerKind(data.layerId)) ?? "display";

    if (kind === "search") {
      const existingEntry = await prisma.roleOnSearchLayer.findFirst({
        where: { searchLayerId: data.layerId },
      });
      if (existingEntry) {
        return prisma.roleOnSearchLayer.update({
          where: { searchLayerId: data.layerId },
          data: { roleId: data.roleId },
        });
      }
      return prisma.roleOnSearchLayer.create({
        data: {
          searchLayerId: data.layerId,
          roleId: data.roleId,
        },
      });
    }

    if (kind === "editing") {
      const existingEntry = await prisma.roleOnEditingLayer.findFirst({
        where: { editingLayerId: data.layerId },
      });
      if (existingEntry) {
        return prisma.roleOnEditingLayer.update({
          where: { editingLayerId: data.layerId },
          data: { roleId: data.roleId },
        });
      }
      return prisma.roleOnEditingLayer.create({
        data: {
          editingLayerId: data.layerId,
          roleId: data.roleId,
        },
      });
    }

    const existingEntry = await prisma.roleOnDisplayLayer.findFirst({
      where: { displayLayerId: data.layerId },
    });
    if (existingEntry) {
      return prisma.roleOnDisplayLayer.update({
        where: { displayLayerId: data.layerId },
        data: { roleId: data.roleId },
      });
    }
    return prisma.roleOnDisplayLayer.create({
      data: {
        displayLayerId: data.layerId,
        roleId: data.roleId,
      },
    });
  }
}

export default new LayerService();

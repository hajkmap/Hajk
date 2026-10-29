import { Prisma, ServiceType, UseType } from "@prisma/client";
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
import {
  capabilityModeForServiceType,
  fetchRemoteCapabilityLayerNames,
} from "../utils/remote-service-capabilities.ts";
import { activeLayerInstanceWhere } from "../utils/layer-instance.ts";
import LayerTreeService from "./layer-tree.service.ts";

const logger = log4js.getLogger("service.v3.layer");

export type { LayerKind };

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

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

async function resolveDeletedLayerKind(
  id: string
): Promise<LayerKind | null> {
  const display = await prisma.displayLayer.findFirst({
    where: { id, deletedAt: { not: null } },
    select: { id: true },
  });
  if (display) return "display";

  const search = await prisma.searchLayer.findFirst({
    where: { id, deletedAt: { not: null } },
    select: { id: true },
  });
  if (search) return "search";

  const editing = await prisma.editingLayer.findFirst({
    where: { id, deletedAt: { not: null } },
    select: { id: true },
  });
  if (editing) return "editing";

  return null;
}

type DeletedLayerListItem = {
  id: string;
  name: string;
  layerKind: LayerKind;
  serviceId: string;
  serviceName: string;
  serviceDeleted: boolean;
  deletedAt: Date | null;
  lastSavedDate: Date | null;
};

class LayerService {
  constructor() {
    logger.debug("Initiating Layer Service");
  }

  /** An editing layer edits one layer of its service. */
  private ensureOneEditedLayer(kind: LayerKind, selectedLayers: string[]) {
    if (kind === "editing" && selectedLayers.length > 1) {
      throw new HajkError(
        HttpStatusCodes.BAD_REQUEST,
        `An editing layer takes one layer of its service, not ${selectedLayers.length}: ${selectedLayers.join(", ")}`,
        HajkStatusCodes.INVALID_SELECTED_LAYERS
      );
    }
  }

  private async ensureSelectedLayersMatchCapabilities(
    service: { url: string; type: ServiceType },
    selectedLayers: string[]
  ): Promise<void> {
    if (selectedLayers.length === 0) return;

    const mode = capabilityModeForServiceType(service.type);
    if (!mode) return;

    const result = await fetchRemoteCapabilityLayerNames(service.url, mode);
    if (!result.ok) {
      logger.warn(
        `Capabilities validation skipped for ${service.url}: ${result.message}`
      );
      return;
    }

    const allowed = new Set(result.layers);
    const missing = selectedLayers.filter((name) => !allowed.has(name));
    if (missing.length > 0) {
      throw new HajkError(
        HttpStatusCodes.BAD_REQUEST,
        `Unknown layer(s) for this service (not listed in GetCapabilities): ${missing.join(", ")}`,
        HajkStatusCodes.INVALID_SELECTED_LAYERS
      );
    }
  }

  /**
   * Look for an existing non-deleted Hajk layer of the given `layerKind`
   * that targets the same `serviceId` and the exact same set of
   * `selectedLayers` (order-independent set equality).
   *
   * Returns the first match (`id`, `name`) or `null` when no conflict.
   * Empty `selectedLayers` is treated as "cannot compare" → returns `null`.
   */
  private async findDuplicatePublication(
    serviceId: string,
    layerKind: LayerKind,
    selectedLayers: string[]
  ): Promise<{ id: string; name: string } | null> {
    if (selectedLayers.length === 0) return null;

    const target = [...selectedLayers].sort();
    const where = {
      serviceId,
      deletedAt: null,
      // Narrow with hasEvery (uses pg array index); we still need to
      // verify length to enforce set equality.
      selectedLayers: { hasEvery: target },
    } as const;
    const select = { id: true, name: true, selectedLayers: true } as const;

    const candidates =
      layerKind === "search"
        ? await prisma.searchLayer.findMany({ where, select })
        : layerKind === "editing"
          ? await prisma.editingLayer.findMany({ where, select })
          : await prisma.displayLayer.findMany({ where, select });

    const match = candidates.find(
      (row) => row.selectedLayers.length === target.length
    );
    return match ? { id: match.id, name: match.name } : null;
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

    const service = await prisma.service.findFirst({
      where: { id: serviceId, deletedAt: null },
    });
    if (!service) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No service with id: ${serviceId} could be found.`,
        HajkStatusCodes.UNKNOWN_SERVICE_ID
      );
    }

    const selectedLayersList = coerceStringArray(picked.selectedLayers);
    this.ensureOneEditedLayer(layerKind, selectedLayersList);
    await this.ensureSelectedLayersMatchCapabilities(
      service,
      selectedLayersList
    );

    if (data.force !== true) {
      const duplicate = await this.findDuplicatePublication(
        serviceId,
        layerKind,
        selectedLayersList
      );
      if (duplicate) {
        throw new HajkError(
          HttpStatusCodes.CONFLICT,
          `A Hajk layer of kind "${layerKind}" already publishes the same source layer(s) for this service: id=${duplicate.id}, name="${duplicate.name}". Retry with force=true to create another publication.`,
          HajkStatusCodes.LAYER_ALREADY_PUBLISHED
        );
      }
    }

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

    if (data.selectedLayers !== undefined) {
      this.ensureOneEditedLayer(kind, coerceStringArray(data.selectedLayers));
      let existingServiceId: string | null = null;
      if (kind === "display") {
        const existing = await prisma.displayLayer.findUnique({
          where: { id },
          select: { serviceId: true },
        });
        existingServiceId = existing?.serviceId ?? null;
      } else if (kind === "search") {
        const existing = await prisma.searchLayer.findUnique({
          where: { id },
          select: { serviceId: true },
        });
        existingServiceId = existing?.serviceId ?? null;
      } else {
        const existing = await prisma.editingLayer.findUnique({
          where: { id },
          select: { serviceId: true },
        });
        existingServiceId = existing?.serviceId ?? null;
      }

      const effectiveServiceId = serviceId ?? existingServiceId;
      if (!effectiveServiceId) {
        throw new HajkError(
          HttpStatusCodes.BAD_REQUEST,
          "Missing serviceId for layer update.",
          HajkStatusCodes.INVALID_REQUEST_BODY
        );
      }

      const svcRow = await prisma.service.findFirst({
        where: { id: effectiveServiceId, deletedAt: null },
      });
      if (!svcRow) {
        throw new HajkError(
          HttpStatusCodes.NOT_FOUND,
          `No service with id: ${effectiveServiceId} could be found.`,
          HajkStatusCodes.UNKNOWN_SERVICE_ID
        );
      }
      await this.ensureSelectedLayersMatchCapabilities(
        svcRow,
        coerceStringArray(data.selectedLayers)
      );
    }

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
      select: { options: true, serviceId: true },
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

  async getDeletedLayers(): Promise<DeletedLayerListItem[]> {
    const serviceSelect = {
      id: true,
      name: true,
      deletedAt: true,
    } as const;

    const [displayLayers, searchLayers, editingLayers] = await Promise.all([
      prisma.displayLayer.findMany({
        where: { deletedAt: { not: null } },
        select: {
          id: true,
          name: true,
          serviceId: true,
          deletedAt: true,
          lastSavedDate: true,
          service: { select: serviceSelect },
        },
      }),
      prisma.searchLayer.findMany({
        where: { deletedAt: { not: null } },
        select: {
          id: true,
          name: true,
          serviceId: true,
          deletedAt: true,
          lastSavedDate: true,
          service: { select: serviceSelect },
        },
      }),
      prisma.editingLayer.findMany({
        where: { deletedAt: { not: null } },
        select: {
          id: true,
          name: true,
          serviceId: true,
          deletedAt: true,
          lastSavedDate: true,
          service: { select: serviceSelect },
        },
      }),
    ]);

    const toItem = (
      layer: {
        id: string;
        name: string;
        serviceId: string;
        deletedAt: Date | null;
        lastSavedDate: Date | null;
        service: { id: string; name: string; deletedAt: Date | null };
      },
      layerKind: LayerKind
    ): DeletedLayerListItem => ({
      id: layer.id,
      name: layer.name,
      layerKind,
      serviceId: layer.serviceId,
      serviceName: layer.service.name,
      serviceDeleted: layer.service.deletedAt != null,
      deletedAt: layer.deletedAt,
      lastSavedDate: layer.lastSavedDate,
    });

    return [
      ...displayLayers.map((layer) => toItem(layer, "display")),
      ...searchLayers.map((layer) => toItem(layer, "search")),
      ...editingLayers.map((layer) => toItem(layer, "editing")),
    ].sort((a, b) => {
      const aTime = a.deletedAt?.getTime() ?? 0;
      const bTime = b.deletedAt?.getTime() ?? 0;
      return bTime - aTime;
    });
  }

  async restoreLayer(id: string, userId?: string) {
    const kind = await resolveDeletedLayerKind(id);
    if (!kind) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No deleted layer with id: ${id} could be found.`,
        HajkStatusCodes.UNKNOWN_LAYER_ID
      );
    }

    const serviceInclude = {
      service: { select: { id: true, name: true, deletedAt: true } },
    } as const;

    const layer =
      kind === "display"
        ? await prisma.displayLayer.findFirst({
            where: { id, deletedAt: { not: null } },
            include: serviceInclude,
          })
        : kind === "search"
          ? await prisma.searchLayer.findFirst({
              where: { id, deletedAt: { not: null } },
              include: serviceInclude,
            })
          : await prisma.editingLayer.findFirst({
              where: { id, deletedAt: { not: null } },
              include: serviceInclude,
            });

    if (!layer) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No deleted layer with id: ${id} could be found.`,
        HajkStatusCodes.UNKNOWN_LAYER_ID
      );
    }

    if (layer.service.deletedAt != null) {
      throw new HajkError(
        HttpStatusCodes.CONFLICT,
        `Cannot restore layer "${layer.name}" while its service "${layer.service.name}" is deleted. Restore the service first.`,
        HajkStatusCodes.UNKNOWN_SERVICE_ID
      );
    }

    const restoredAt = new Date();
    const restoreData = {
      deletedAt: null,
      lastSavedBy: userId,
      lastSavedDate: restoredAt,
    };

    if (kind === "display") {
      return prisma.displayLayer.update({
        where: { id },
        data: restoreData,
      });
    }
    if (kind === "search") {
      return prisma.searchLayer.update({
        where: { id },
        data: restoreData,
      });
    }
    return prisma.editingLayer.update({
      where: { id },
      data: restoreData,
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

  /**
   * For each layer, the maps that use it: in their tree, as a background
   * layer, or as a search or editing layer.
   */
  async getUsageSummary(): Promise<
    Record<string, { mapCount: number; mapNames: string[] }>
  > {
    const [contents, instances] = await Promise.all([
      LayerTreeService.getMapContents(),
      prisma.layerInstance.findMany({
        where: {
          AND: [activeLayerInstanceWhere, { map: { deletedAt: null } }],
        },
        select: {
          displayLayerId: true,
          searchLayerId: true,
          editingLayerId: true,
          map: { select: { name: true } },
        },
      }),
    ]);

    const mapNamesByLayerId = new Map<string, Set<string>>();
    const add = (layerId: string, mapName: string) =>
      mapNamesByLayerId.set(
        layerId,
        (mapNamesByLayerId.get(layerId) ?? new Set<string>()).add(mapName)
      );
    for (const [mapName, content] of contents) {
      for (const layerId of content.layers.keys()) add(layerId, mapName);
    }
    for (const instance of instances) {
      const layerId =
        instance.displayLayerId ??
        instance.searchLayerId ??
        instance.editingLayerId;
      if (layerId && instance.map?.name) add(layerId, instance.map.name);
    }

    const summary: Record<string, { mapCount: number; mapNames: string[] }> =
      {};
    for (const [layerId, mapNames] of mapNamesByLayerId) {
      const sortedNames = [...mapNames].sort((a, b) => a.localeCompare(b));
      summary[layerId] = {
        mapCount: sortedNames.length,
        mapNames: sortedNames,
      };
    }

    return summary;
  }

  /**
   * Where a layer is used: for each group that holds it, the maps whose tree
   * shows it there; and each map it is placed on directly (in its tree's top
   * level, as a background layer, or as a search or editing layer).
   */
  async getUsageByLayerId(id: string) {
    const kind = await resolveLayerKind(id);
    const instanceWhere: Prisma.LayerInstanceWhereInput =
      kind === "search"
        ? { searchLayerId: id, searchLayer: { deletedAt: null } }
        : kind === "editing"
          ? { editingLayerId: id, editingLayer: { deletedAt: null } }
          : { displayLayerId: id, displayLayer: { deletedAt: null } };
    const instances = await prisma.layerInstance.findMany({
      where: { ...instanceWhere, map: { deletedAt: null } },
      select: {
        id: true,
        usage: true,
        map: { select: { id: true, name: true } },
      },
    });
    const usage = instances.map((instance) => ({
      id: instance.id,
      usage: instance.usage ?? UseType.FOREGROUND,
      map: instance.map,
      group: null as {
        id: string;
        name: string;
        maps: { mapName: string }[];
      } | null,
    }));
    if (kind === "search" || kind === "editing") {
      return usage;
    }

    const [contents, owners] = await Promise.all([
      LayerTreeService.getMapContents(),
      prisma.groupItem.findMany({
        where: { displayLayerId: id, group: { deletedAt: null } },
        select: { groupId: true },
      }),
    ]);
    const mapsByGroup = new Map<string, string[]>(
      owners.map((owner) => [owner.groupId, []])
    );
    const topLevelMaps: string[] = [];
    for (const [mapName, content] of contents) {
      for (const groupId of content.layers.get(id) ?? []) {
        if (groupId === "") topLevelMaps.push(mapName);
        else mapsByGroup.set(groupId, [...(mapsByGroup.get(groupId) ?? []), mapName]);
      }
    }
    const [groups, maps] = await Promise.all([
      prisma.group.findMany({
        where: { id: { in: [...mapsByGroup.keys()] }, deletedAt: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.map.findMany({
        where: { name: { in: topLevelMaps }, deletedAt: null },
        select: { id: true, name: true },
      }),
    ]);
    return [
      ...groups.map((group) => ({
        id: `group:${group.id}`,
        usage: UseType.FOREGROUND,
        map: null,
        group: {
          ...group,
          maps: (mapsByGroup.get(group.id) ?? []).map((mapName) => ({
            mapName,
          })),
        },
      })),
      ...maps.map((map) => ({
        id: `map:${map.name}`,
        usage: UseType.FOREGROUND,
        map,
        group: null,
      })),
      ...usage,
    ];
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

import { Prisma } from "@prisma/client";

import { ServiceType } from "@prisma/client";
import log4js from "log4js";

import prisma from "../../../common/prisma.ts";

const logger = log4js.getLogger("service.v3.layer");

class LayerService {
  constructor() {
    logger.debug("Initiating Layer Service");
  }

  async getLayers() {
    return await prisma.layer.findMany();
  }

  async getLayerById(id: string) {
    const layer = await prisma.layer.findUnique({
      where: { id },
      include: {
        metadata: true,
        infoClickSettings: true,
        searchSettings: true,
      },
    });

    return layer;
  }

  async getLayerTypes() {
    return Object.values(ServiceType);
  }

  async getLayersByType(type: ServiceType) {
    return await prisma.layer.findMany({
      where: { service: { type } },
    });
  }

  async getServiceByLayerId(id: string) {
    const service = await prisma.layer.findUnique({
      where: { id },
      include: { service: true },
    });

    return service?.service;
  }

  async createLayer(
    data: Prisma.LayerCreateInput & { serviceId: string },
    userId?: string
  ) {
    const { serviceId, ...layerData } = data;

    const newLayer = await prisma.layer.create({
      data: {
        ...layerData,
        createdBy: userId,
        createdDate: new Date(),
        service: { connect: { id: serviceId } },
        metadata: { create: { ...layerData.metadata } },
        infoClickSettings: { create: { ...layerData.infoClickSettings } },
        searchSettings: { create: { ...layerData.searchSettings } },
      },
    });

    return newLayer;
  }

  async updateLayer(
    id: string,
    data: Prisma.LayerUpdateInput & { serviceId: string },
    userId?: string
  ) {
    const { serviceId, options, ...layerData } = data;

    const existingLayer = await prisma.layer.findUnique({
      where: { id },
      select: { options: true },
    });

    const existingOptions = (existingLayer?.options as object) || {};
    const updatedOptions = {
      ...(existingOptions as object),
      ...(options as object),
    };
    const updatedLayer = await prisma.layer.update({
      where: { id },
      data: {
        ...layerData,
        lastSavedBy: userId,
        lastSavedDate: new Date(),
        options: updatedOptions,
        service: { connect: { id: serviceId } },
        metadata: {
          upsert: {
            update: { ...layerData.metadata },
            create: { ...layerData.metadata },
          },
        },
        searchSettings: {
          upsert: {
            update: { ...layerData.searchSettings },
            create: { ...layerData.searchSettings },
          },
        },
        infoClickSettings: {
          upsert: {
            update: { ...layerData.infoClickSettings },
            create: { ...layerData.infoClickSettings },
          },
        },
      },

      include: {
        service: true,
        metadata: true,
        searchSettings: true,
        infoClickSettings: true,
      },
    });
    return updatedLayer;
  }

  async deleteLayer(id: string) {
    await prisma.$transaction(async (transaction) => {
      const layer = await transaction.layer.findUnique({
        where: { id },
        select: {
          metadata: true,
          searchSettings: true,
          infoClickSettings: true,
        },
      });

      if (layer?.metadata) {
        await transaction.metadata.delete({
          where: { id: layer.metadata.id },
        });
      }

      if (layer?.searchSettings) {
        await transaction.searchSettings.delete({
          where: { id: layer.searchSettings.id },
        });
      }

      if (layer?.infoClickSettings) {
        await transaction.infoClickSettings.delete({
          where: { id: layer.infoClickSettings.id },
        });
      }

      await transaction.layer.delete({ where: { id } });
    });
  }

  async getRoleOnLayerByLayerId(layerId: string) {
    return prisma.roleOnLayer.findFirst({
      where: { layerId },
      include: {
        role: true,
      },
    });
  }

  async createAndUpdateRoleOnLayer(
    data: Prisma.RoleOnLayerCreateInput & { layerId: string; roleId: string }
  ) {
    const existingEntry = await prisma.roleOnLayer.findFirst({
      where: { layerId: data.layerId },
    });

    if (existingEntry) {
      return await prisma.roleOnLayer.update({
        where: {
          layerId: data.layerId,
        },
        data: {
          roleId: data.roleId,
        },
      });
    }

    return await prisma.roleOnLayer.create({
      data: {
        layerId: data.layerId,
        roleId: data.roleId,
      },
    });
  }
}

export default new LayerService();

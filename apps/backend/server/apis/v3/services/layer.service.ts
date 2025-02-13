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
    return await prisma.layer.findMany({
      include: {
        metadata: true,
        infoClickSettings: true,
        searchSettings: true,
      },
    });
  }

  async getLayerById(id: string) {
    const layer = await prisma.layer.findUnique({
      where: { id },
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

  async createLayer(data: Prisma.LayerCreateInput & { serviceId: string }) {
    const { serviceId, ...layerData } = data;

    const newLayer = await prisma.layer.create({
      data: {
        ...layerData,
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
    data: Prisma.LayerUpdateInput & { serviceId: string }
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
    await prisma.layer.delete({ where: { id } });
  }
}

export default new LayerService();

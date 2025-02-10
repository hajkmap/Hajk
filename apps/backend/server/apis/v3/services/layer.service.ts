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

  async updateLayer(id: string, data: Prisma.LayerUpdateInput) {
    const updatedLayer = await prisma.layer.update({
      where: { id },
      data: {
        ...data,
        metadata: {
          upsert: {
            update: { ...data.metadata },
            create: { ...data.metadata },
          },
        },
        searchSettings: {
          upsert: {
            update: { ...data.searchSettings },
            create: { ...data.searchSettings },
          },
        },
        infoClickSettings: {
          upsert: {
            update: { ...data.infoClickSettings },
            create: { ...data.infoClickSettings },
          },
        },
      },
      include: {
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

import { Prisma } from "@prisma/client";

import { ServiceType } from "@prisma/client";
import log4js from "log4js";

import prisma from "../../../common/prisma.ts";
import { generateNames } from "./services.service.ts";

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

  async createLayer(data: Prisma.LayerCreateInput) {
    if (!data.name) {
      data.name = generateNames();
    }
    const newLayer = await prisma.layer.create({ data });
    return newLayer;
  }

  async updateLayer(id: string, data: Prisma.LayerUpdateInput) {
    const updatedLayer = await prisma.layer.update({
      where: { id },
      data,
    });
    return updatedLayer;
  }

  async deleteLayer(id: string) {
    await prisma.layer.delete({ where: { id } });
  }
}

export default new LayerService();

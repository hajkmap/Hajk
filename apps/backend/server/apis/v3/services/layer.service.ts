import { PrismaClient, ServiceType } from "@prisma/client";

import log4js from "log4js";

const logger = log4js.getLogger("service.v3.layer");
const prisma = new PrismaClient();

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
}

export default new LayerService();

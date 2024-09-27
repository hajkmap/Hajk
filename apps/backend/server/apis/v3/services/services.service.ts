import { PrismaClient } from "@prisma/client";

import log4js from "log4js";

const logger = log4js.getLogger("service.v3.layer");
const prisma = new PrismaClient();

class ServicesService {
  constructor() {
    logger.debug("Initiating Services Service");
  }

  async getServices() {
    return await prisma.service.findMany();
  }

  async getServiceById(id: string) {
    const service = await prisma.service.findUnique({
      where: { id },
    });

    return service;
  }

  async getLayersByServiceId(id: string) {
    const layers = await prisma.layer.findMany({
      where: { serviceId: id },
    });

    return layers;
  }
}

export default new ServicesService();

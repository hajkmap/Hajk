import { PrismaClient } from "@prisma/client";

import log4js from "log4js";

const logger = log4js.getLogger("service.v3.tool");
const prisma = new PrismaClient();

class LayerService {
  constructor() {
    logger.debug("Initiating Layer Service");
  }

  async getLayers() {
    try {
      return await prisma.layer.findMany();
    } catch (error) {
      return { error };
    }
  }

  async getLayerById(id) {
    try {
      return await prisma.layer.findUnique({
        where: { id },
      });
    } catch (error) {
      return { error };
    }
  }

  async getLayersByType(type) {
    try {
      const result = await prisma.layer.findMany({
        where: { type: type.toUpperCase() },
      });
      return result;
    } catch (error) {
      return { error };
    }
  }
}

export default new LayerService();
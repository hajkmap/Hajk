import { PrismaClient } from "@prisma/client";
import { LayerType } from "@prisma/client";

import log4js from "log4js";

const logger = log4js.getLogger("service.v3.layer");
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
      const layer = await prisma.layer.findUnique({
        where: { id },
      });
      if (!layer) {
        throw new Error(`No layer with id: ${id} could be found.`);
      }
      return layer;
    } catch (error) {
      return { error };
    }
  }

  async getLayerTypes() {
    try {
      return Object.values(LayerType);
    } catch (error) {
      return { error };
    }
  }

  async getLayersByType(type) {
    try {
      if (!Object.values(LayerType).includes(type.toUpperCase())) {
        throw new Error(
          `Unsupported layer type provided. Supported types are: ${Object.values(
            LayerType
          )}`
        );
      }
      return await prisma.layer.findMany({
        where: { type: type.toUpperCase() },
      });
    } catch (error) {
      return { error };
    }
  }
}

export default new LayerService();

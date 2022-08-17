import { PrismaClient } from "@prisma/client";
import log4js from "log4js";

const logger = log4js.getLogger("service.prisma");
const prisma = new PrismaClient();

class PrismaService {
  constructor() {
    logger.debug("Initiating Prisma Service");
  }

  async getTools() {
    try {
      return await prisma.tool.findMany();
    } catch (error) {
      return { error };
    }
  }

  async getMaps() {
    try {
      return await prisma.map.findMany();
    } catch (error) {
      return { error };
    }
  }

  async getMapByName(mapName) {
    try {
      const map = await prisma.map.findFirst({ where: { name: mapName } });
      const tools = await this.#getToolsForMap(mapName);
      const projections = await this.#getProjectionsForMap(mapName);
      return { version: "0.0.1", projections, map, tools };
    } catch (error) {
      return { error };
    }
  }

  async getToolsForMap(mapName) {
    try {
      return await this.#getToolsForMap(mapName);
    } catch (error) {
      return { error };
    }
  }

  async getMapsWithTool(toolName) {
    try {
      return await prisma.map.findMany({
        where: {
          tools: {
            some: {
              tool: {
                type: toolName,
              },
            },
          },
        },
      });
    } catch (error) {
      return { error };
    }
  }

  // This method is abstracted away as we use it in (at least) two places
  async #getToolsForMap(mapName) {
    return await prisma.tool.findMany({
      where: {
        maps: {
          some: {
            map: {
              name: mapName,
            },
          },
        },
      },
    });
  }

  async #getProjectionsForMap(mapName) {
    return await prisma.projection.findMany({
      where: {
        maps: {
          some: {
            map: {
              name: mapName,
            },
          },
        },
      },
    });
  }
}

export default new PrismaService();

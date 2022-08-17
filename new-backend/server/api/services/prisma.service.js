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
      const maps = await prisma.map.findMany({ select: { name: true } });
      // Transform the [{name: "map1"}, {name: "map2"}] to ["map1", "map2"]
      return maps.map((m) => m.name);
    } catch (error) {
      return { error };
    }
  }

  async getMapByName(mapName) {
    try {
      const map = await prisma.map.findFirst({
        where: { name: mapName },
        include: { projections: true, tools: true, layers: true },
      });

      return {
        version: "0.0.1",
        projections: map.projections,
        tools: map.tools,
        layers: map.layers,
        map: map.options,
      };
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
      const maps = await prisma.map.findMany({
        select: { name: true },
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
      return maps.map((m) => m.name);
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
}

export default new PrismaService();

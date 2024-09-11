import { PrismaClient } from "@prisma/client";

import log4js from "log4js";

const logger = log4js.getLogger("service.prisma");
const prisma = new PrismaClient();

class PrismaService {
  constructor() {
    logger.debug("Initiating Prisma Service");
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

  async getMapByName(mapName: string) {
    try {
      const map = await prisma.map.findUnique({
        where: { name: mapName },
        include: {
          projections: true,
          tools: { include: { tool: true } },
          layers: { include: { layer: true } },
          groups: { include: { group: { include: { layers: true } } } },
        },
      });

      return {
        version: "0.0.1",
        ...map,
      };
    } catch (error) {
      return { error };
    }
  }

  async getGroupsForMap(mapName: string) {
    try {
      return await prisma.group.findMany({
        where: { maps: { some: { name: mapName } } },
      });
    } catch (error) {
      return { error };
    }
  }

  async getLayersForMap(mapName: string) {
    try {
      return await prisma.layer.findMany({
        where: {
          OR: [
            { maps: { some: { mapName } } },
            { groups: { some: { group: { maps: { some: { mapName } } } } } },
          ],
        },
      });
    } catch (error) {
      return { error };
    }
  }

  async getProjectionsForMap(mapName: string) {
    try {
      return await prisma.projection.findMany({
        where: { maps: { some: { name: mapName } } },
      });
    } catch (error) {
      return { error };
    }
  }

  async getToolsForMap(mapName: string) {
    try {
      return await this.#getToolsForMap(mapName);
    } catch (error) {
      return { error };
    }
  }

  async getTools() {
    try {
      return await prisma.tool.findMany();
    } catch (error) {
      return { error };
    }
  }

  async getMapsWithTool(toolName: string) {
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
  async #getToolsForMap(mapName: string) {
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

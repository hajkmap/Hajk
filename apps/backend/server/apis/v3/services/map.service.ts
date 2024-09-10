import { PrismaClient } from "@prisma/client";

import log4js from "log4js";

const logger = log4js.getLogger("service.v3.map");
const prisma = new PrismaClient();

class MapService {
  constructor() {
    logger.debug("Initiating Map Service");
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

      if (map === null) {
        throw new Error(`Map ${mapName} not found`);
      }

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
    } catch (error) {
      return { error };
    }
  }
}

export default new MapService();

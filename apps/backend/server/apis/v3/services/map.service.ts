import { PrismaClient } from "@prisma/client";

import log4js from "log4js";
import { RouteError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/HttpStatusCodes.ts";

const logger = log4js.getLogger("service.v3.map");
const prisma = new PrismaClient();

class MapService {
  constructor() {
    logger.debug("Initiating Map Service");
  }

  async getMaps() {
    const maps = await prisma.map.findMany({ select: { name: true } });
    // Transform the [{name: "map1"}, {name: "map2"}] to ["map1", "map2"]
    return { maps: maps.map((m) => m.name) };
  }

  async getMapByName(mapName: string) {
    const map = await prisma.map.findUnique({
      where: { name: mapName },
      include: {
        projections: true,
        tools: { include: { tool: true } },
        layers: { include: { layer: true } },
        groups: { include: { group: { include: { layers: true } } } },
      },
    });

    // If map is null, it's because the supplied map name doesn't exist.
    // Let's throw an error.
    if (map === null) {
      throw new RouteError(
        HttpStatusCodes.BAD_REQUEST,
        `"${mapName}" is not a valid map`
      );
    }

    // If we got this far, let's return the map's configuration
    return map;
  }

  async getGroupsForMap(mapName: string) {
    const groups = await prisma.group.findMany({
      where: { maps: { some: { name: mapName } } },
    });

    return { groups };
  }

  async getLayersForMap(mapName: string) {
    const layers = await prisma.layer.findMany({
      where: {
        OR: [
          { maps: { some: { mapName } } },
          { groups: { some: { group: { maps: { some: { mapName } } } } } },
        ],
      },
    });

    return { layers };
  }

  async getProjectionsForMap(mapName: string) {
    const projections = await prisma.projection.findMany({
      where: { maps: { some: { name: mapName } } },
    });

    return { projections };
  }

  async getToolsForMap(mapName: string) {
    const tools = await prisma.tool.findMany({
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

    return { tools };
  }
}

export default new MapService();

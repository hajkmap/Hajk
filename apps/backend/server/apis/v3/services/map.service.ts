import { Prisma, PrismaClient } from "@prisma/client";

import log4js from "log4js";

const logger = log4js.getLogger("service.v3.map");
const prisma = new PrismaClient();

class MapService {
  constructor() {
    logger.debug("Initiating Map Service");
  }

  async getMapNames() {
    const maps = await prisma.map.findMany({ select: { name: true } });

    // Transform the [{name: "map1"}, {name: "map2"}] to ["map1", "map2"]
    return maps.map((m) => m.name).sort();
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

    return map;
  }

  /**
   * Get all groups for a map, including nested groups. Note that the
   * tree structure is flattened into a single list of groups.
   * @param mapName - The name of the map.
   * @returns - A flat list of groups connected to the map.
   */
  async getGroupsForMap(mapName: string) {
    const allGroups = await prisma.groupsOnMaps.findMany({
      where: {
        mapName: mapName,
      },
    });

    return allGroups;
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

    return layers;
  }

  async getProjectionsForMap(mapName: string) {
    const projections = await prisma.projection.findMany({
      where: { maps: { some: { name: mapName } } },
    });

    return projections;
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

    return tools;
  }

  async createMap(data: Prisma.MapCreateInput) {
    const newMap = await prisma.map.create({ data });
    return newMap;
  }

  async updateMap(mapName: string, data: Prisma.MapUpdateInput) {
    const updatedMap = await prisma.map.update({
      where: { name: mapName },
      data,
    });
    return updatedMap;
  }

  async deleteMap(mapName: string) {
    // TODO: This does not delete corresponding layers, groups, etc.
    // We should consider implementing a onDelete cascade in the schema, but
    // must account for the fact that layers/groups etc. may be shared between
    // maps.
    await prisma.map.delete({ where: { name: mapName } });
  }
}

export default new MapService();

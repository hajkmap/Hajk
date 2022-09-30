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

  // TODO: Move me to seed.js
  async populateLayersAndGroups(mapName) {
    // Please note that this extraction _ignores_ the relationships
    // between groups and layers/groups. At this stage we're not
    // interested of the tree structure, but rather determining if a
    // layer or group is used in a given map.
    const t = await prisma.map.findUnique({
      where: {
        name: mapName,
      },
      select: {
        tools: {
          where: {
            tool: {
              type: "layerswitcher",
            },
          },
        },
      },
    });
    const { baselayers, groups } = t.tools[0].options;

    const layersToInsert = [];
    const groupsToInsert = [];

    // Prepare background layers for insert
    baselayers.forEach((bl) => {
      const { id: layerId, ...rest } = bl;
      layersToInsert.push({
        layerId,
        mapName,
        usage: "BACKGROUND",
        ...rest,
      });
    });

    // Next, go on with groups, recursively
    const extractLayersFromGroup = (group) => {
      group.layers.forEach((l) => {
        const { id: layerId, ...rest } = l;

        layersToInsert.push({
          layerId,
          mapName,
          useage: "FOREGROUND",
          ...rest,
        });
      });
      return;
    };

    const extractGroup = (group) => {
      // First let's handle the group's layers
      extractLayersFromGroup(group);

      // Next, let's handle the group itself
      const { id: groupId, name, toggled, expanded } = group;
      const insertObject = {
        groupId,
        mapName,
        useage: "FOREGROUND",
        name,
        toggled,
        expanded,
      };

      groupsToInsert.push(insertObject);

      // Finally, recursively call on any other groups that might be in this group
      group.groups?.forEach((g) => extractGroup(g));
    };

    groups.forEach((g) => extractGroup(g));

    return {
      layersCount: layersToInsert.length,
      groupsCount: groupsToInsert.length,
      layersToInsert,
      groupsToInsert,
      baselayers,
      groups,
    };
  }
}

export default new PrismaService();

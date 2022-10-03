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
      const layerIds = [];
      group.layers.forEach((l) => {
        const { id: layerId, ...rest } = l;

        // Prepare object to insert into LayersOnMaps
        layersToInsert.push({
          layerId,
          mapName,
          usage: "FOREGROUND",
          ...rest,
        });

        layerIds.push(layerId);
      });

      // Return a list of ids that relate to a given group
      return layerIds;
    };

    const extractGroup = (group, parentId = null) => {
      // First let's handle the group's layers
      const layerIds = extractLayersFromGroup(group);

      // Next, let's handle the group itself
      const { id: groupId, name, toggled, expanded } = group;
      const insertObject = {
        groupId,
        parentId,
        mapName,
        layers: layerIds,
        usage: "FOREGROUND",
        name,
        toggled,
        expanded,
      };

      groupsToInsert.push(insertObject);

      // Finally, recursively call on any other groups that might be in this group
      group.groups?.forEach((g) => extractGroup(g, groupId));
    };

    groups.forEach((g) => extractGroup(g));

    // Below is a demo (not for seed.js) that shows how easily
    // we can transform the relationship between groups into a
    // tree structure, ready for use in e.g. LayerSwitcher.
    const transformListToTree = (items, groupId = null) =>
      items
        .filter((item) => item["parentId"] === groupId)
        .map((item) => ({
          ...item,
          children: transformListToTree(items, item.groupId),
        }));

    return {
      layersCount: layersToInsert.length,
      groupsCount: groupsToInsert.length,
      tree: transformListToTree(groupsToInsert),
      layersToInsert,
      groupsToInsert,
      // baselayers,
      // groups,
    };
  }
}

export default new PrismaService();

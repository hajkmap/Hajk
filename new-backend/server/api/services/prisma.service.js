import { PrismaClient } from "@prisma/client";
import cuid from "cuid";

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

    // Imaging this is our "groups.json"…
    const groupsToInsert = [];

    // And here are the different relations between our entities
    const layersOnMaps = [];
    const layersOnGroups = [];
    const groupsOnMap = [];

    // Prepare background layers for insert
    baselayers.forEach((bl) => {
      const { id: layerId, ...rest } = bl;
      layersOnMaps.push({
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

        // Prepare object to insert into layersOnGroups
        layersOnGroups.push({
          layerId,
          groupId: group.id,
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

      // This is a plain, flat group object - similar to layers.json
      groupsToInsert.push({
        id: groupId,
        name: name,
        layers: layerIds,
      });

      // Create a unique ID for this specific relation
      const newCuid = cuid();

      // This object will be used to describe this group's relations
      const groupsOnMapObject = {
        id: newCuid, // This specific group-map relations ID
        groupId, // Refers to ID in Group model
        parentGroupId: parentId,
        mapName,
        usage: "FOREGROUND",
        name,
        toggled,
        expanded,
      };

      groupsOnMap.push(groupsOnMapObject);

      // Finally, recursively call on any other groups that might be in this group
      group.groups?.forEach((g) => extractGroup(g, newCuid));
    };

    groups.forEach((g) => extractGroup(g));

    // Below is a demo (not for seed.js) that shows how easily
    // we can transform the relationship between groups into a
    // tree structure, ready for use in e.g. LayerSwitcher.
    const transformListToTree = (items, id = null) =>
      items
        .filter((item) => item["parentGroupId"] === id)
        .map((item) => ({
          ...item,
          children: transformListToTree(items, item.id),
        }));

    return {
      tree: transformListToTree(groupsOnMap),
      groupsToInsert,
      groupsOnMap,
      layersOnMaps,
      layersOnGroups,
    };
  }
}

export default new PrismaService();

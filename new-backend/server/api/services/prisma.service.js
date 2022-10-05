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

    // Imagine this is our "groups.json"…
    const groupsToInsert = [];

    // These arrays will hold the different relations between our entities
    const layersOnMaps = [];
    const layersOnGroups = [];
    const groupsOnMap = [];

    // Prepare background layers for insert by looping through everything
    // in "baselayers" in current map's LayerSwitcher's options. The goal
    // is to prepare an object that will be almost ready to use in Prisma's
    // createMany() method.
    baselayers.forEach((bl) => {
      const { id: layerId, ...rest } = bl;
      layersOnMaps.push({
        layerId,
        mapName,
        usage: "BACKGROUND",
        ...rest,
        visibleForGroups: !Array.isArray(bl.visibleForGroups)
          ? []
          : bl.visibleForGroups,
        infobox: typeof bl.infobox !== "string" ? "" : bl.infobox,
      });
    });

    // Helper: invoked recursively and extract any
    // layers and groups within the given group.
    const extractGroup = (group, parentId = null) => {
      // First let's handle the group's layers
      extractLayersFromGroup(group);

      // Next, let's handle the group itself
      const { id: groupId, name, toggled, expanded } = group;

      // This is a plain, flat group object - similar to layers.json
      groupsToInsert.push({
        id: groupId,
        name: name,
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

    // Helper: called by extractGroup. Grabs all layers
    // in the given group.
    const extractLayersFromGroup = (group) => {
      const layerIds = [];
      group.layers.forEach((l) => {
        const { id: layerId, ...rest } = l;

        // Prepare object to insert into layersOnGroups
        layersOnGroups.push({
          layerId,
          groupId: group.id,
          ...rest,
          visibleForGroups: !Array.isArray(group.visibleForGroups)
            ? []
            : group.visibleForGroups,
          infobox: typeof group.infobox !== "string" ? "" : group.infobox,
        });

        layerIds.push(layerId);
      });

      // Return a list of ids that relate to a given group
      return layerIds;
    };

    // Next, go on with groups, recursively
    groups.forEach((g) => extractGroup(g));

    // Now we have all arrays ready. One more thing left is to
    // check for consistency: our map config may refer to layerIds
    // that did not exist in layers.json (hence they won't exist in
    // the Layer model now either). If we'd try to connect such a layer
    // to a map or group, we'd get a foreign key error. So let's wash the
    // layers so only valid entries remain.
    let layersInDB = await prisma.layer.findMany({
      select: { id: true },
    });

    layersInDB = layersInDB.map((l) => l.id);

    // Helper: used as a filter predicate to remove layers
    // that did not exist in database.
    const removeUnknownLayers = (l) => {
      return layersInDB.indexOf(l.layerId) !== -1;
    };

    const validLayersOnMaps = layersOnMaps.filter(removeUnknownLayers);
    const validLayersOnGroups = layersOnGroups.filter(removeUnknownLayers);

    // PLEASE NOTE THAT YOU CAN ONLY RUN THIS ONCE AS WE WRITE STUFF
    // INTO DB HERE. ENSURE TO COMMENT OUT WHATEVER HAS ALREADY BEEN
    // WRITTEN IN ORDER TO CONTINUE DEVELOPMENT OF THE REMAINING PARTS!!!

    // /**
    // Populates the Group model (the imaginative "groups.json")
    await prisma.group.createMany({
      data: groupsToInsert,
      skipDuplicates: true, // We assume - for now! - that same ID means same group, so there's no need to watch out for conflicts
    });

    // Connect each of the inserted groups to map (and another group, where applicable)
    await prisma.groupsOnMaps.createMany({ data: groupsOnMap });

    // Connect valid layers to maps (i.e. those layers that are not part of any group but part of a map)
    await prisma.layersOnMaps.createMany({ data: validLayersOnMaps });

    // Connect valid layers to groups
    await prisma.layersOnGroups.createMany({ data: validLayersOnGroups });

    // **/

    // Showtime! Let's get the newly created groups that belong to our map
    const mapConfigFromDB = await prisma.map.findMany({
      where: { name: mapName },
      include: {
        layers: true,
        // Not the most beautiful, but recursive nested reads are not supported in Prisma ATM.
        // Anyway, six levels of groups is about the practical limit in the UI anyway, I guess.
        groups: {
          include: {
            groups: {
              include: {
                groups: {
                  include: {
                    groups: {
                      include: { groups: { include: { groups: true } } },
                    },
                  },
                },
              },
            },
          },
        },
        projections: true,
        tools: true,
      },
    });

    return {
      mapConfigFromDB,
    };
  }
}

export default new PrismaService();

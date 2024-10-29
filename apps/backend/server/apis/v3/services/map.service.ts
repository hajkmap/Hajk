import { Prisma } from "@prisma/client";
import log4js from "log4js";

import prisma from "../../../common/prisma.ts";
import {
  MapSchema,
  MapCreateInputSchema,
  MapUpdateInputSchema,
} from "../../../generated/zod/index.ts";

const logger = log4js.getLogger("service.v3.map");

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
    // JW-DISCUSSION:
    // This one is easy, as MapCreateInputSchema contains the correct definitions.
    // If it succeeds, `create()` will be called with its return value (which is
    // the same as the `data` argument).
    // If it fails, error is thrown and taken care of in server.ts's error handler.
    const newMap = await prisma.map.create({
      data: MapCreateInputSchema.parse(data),
    });
    return newMap;
  }

  async updateMap(mapName: string, data: Prisma.MapUpdateInput) {
    // JW-DISCUSSION:
    // For PATCH we must use a type that declares all fields as optional.
    // `MapUpdateInputSchema` seems like a good candidate. It's in fact
    // the one we originally used in the router middleware approach.
    // However, this has one substantial flow. Take a look at the type
    // definition: all fields are marked as a union of either the real
    // type or an object (of some kind). The problem with this is easily
    // demonstrated if we attempt to send an object to a non-object property
    // (such as `locked`, which should only accept booleans). An empty
    // object in the request is accepted by Zod and `update()` is called, which
    // in turn renders an error when Prisma "discovers" that `locked` isn't a boolean.
    MapUpdateInputSchema.parse({ name: mapName, ...data });
    const updatedMap = await prisma.map.update({
      where: { name: mapName },
      data,
    });
    return updatedMap;
  }

  async alternativeUpdateMap(mapName: string, data: Prisma.MapUpdateInput) {
    // JW-DISCUSSION:
    // An alternative approach. It uses `MapSchema` from Zod, which has all
    // marked all fields as required. But by calling `partial()` we make
    // them optional. Sounds like a good idea, given the fact that PATCH method
    // is used. I find it somehow verbose though...
    //
    // Let Zod parse the schema as generated from the Prisma schema.
    // We prepend the `name`, as it is a part of the schema, but comes
    // as a separate parameter (not part of `data`) when this method
    // is called.
    // If the parsing succeeds, `update()` will be called. If it fails
    // an error will be thrown and taken care of in server.ts's error handler,
    // where we filter out the ZodError.
    MapSchema.partial().parse({ name: mapName, ...data });
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

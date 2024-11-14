import { Prisma, type User } from "@prisma/client";
import log4js from "log4js";

import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";
import { getUserRoles } from "../../../common/auth/get-user-roles.ts";
import { isAuthActive } from "../../../common/auth/is-auth-active.ts";

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

  async getMapByName(mapName: string, user: User | undefined) {
    logger.debug(`[getMapByName] Retrieving map "${mapName}"`);

    const roles = await getUserRoles(user);

    // Some logging that only should take place if auth is activated.
    if (isAuthActive) {
      if (user) {
        // Log user info
        if (logger.isTraceEnabled()) {
          // If logger level is larger than `debug`, let's log verbosely, entire user object:
          logger.trace("Current user:", user);
        } else {
          // Let's just log user's ID and email:
          logger.debug(`Current user: ${user.id}.`);
        }

        // Log user's roles
        logger.debug("User's roles:", roles);
      } else {
        logger.debug("Current user: anonymous");
      }
    }

    // First, let's determine if a map with the supplied name exists.
    const mapExist = await prisma.map.findFirst({
      where: {
        name: mapName,
      },
    });

    // If `mapExists` is null, it's because the supplied map name doesn't exist.
    // Let's throw an error. We don't use Prisma's findFirstOrThrow because
    // we want to send a custom Hajk Error here, rather than just rethrow
    // the DB error from Prisma.
    if (mapExist === null) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `"${mapName}" is not a valid map`,
        HajkStatusCodes.UNKNOWN_MAP_NAME
      );
    }

    // Now that we know that the map exists, let's try to get its config,
    // respecting role restrictions (if auth is active, which is determined
    // by the existence of the `user` object).
    const mapConfig = await prisma.map.findFirst({
      where: {
        name: mapName,
        // If auth is active, let's filter the request to only include
        // the maps that a) either are completely unrestricted (no roles in
        // `restrictedToRoles`) or, b) where at least one of the roles in
        // `restrictedToRoles` is included in the user's roles.
        ...(isAuthActive
          ? {
              OR: [
                { restrictedToRoles: { none: {} } },
                { restrictedToRoles: { some: { roleId: { in: roles } } } },
              ],
            }
          : {}),
      },
      // TODO: Tools, Layers and Groups must also be filtered by `roles`.
      include: {
        projections: true,
        tools: { include: { tool: true } },
        layers: {
          include: { layer: true },
        },
        groups: { include: { group: { include: { layers: true } } } },
      },
    });

    // If `mapConfig` is null, it means that the map exists, but the user
    // doesn't have access to it. Let's find out which roles are required
    // and log a nice error message, before throwing a 401 error.
    if (mapConfig === null) {
      // Find out which roles are required to view the given map.
      const allowedRoles = await prisma.role.findMany({
        where: {
          RoleOnMap: {
            some: {
              map: {
                name: mapName,
              },
            },
          },
        },
      });

      // TODO: This logs out role IDs, which is not very readable. Consider
      // fetching the roles by name or code instead.
      logger.debug(
        `User unauthorized. To access "${mapName}" user must belong to at least one of the following roles:`,
        allowedRoles.map((r) => r.id)
      );

      throw new HajkError(
        HttpStatusCodes.UNAUTHORIZED,
        `User "${user?.email}" does not have access to map "${mapName}"`,
        HajkStatusCodes.USER_NOT_AUTHORIZED
      );
    }

    logger.debug(`Access to "${mapName}" granted for user "${user?.id}".`);
    return mapConfig;
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

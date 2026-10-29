import { Prisma, UseType, type User } from "@prisma/client";
import log4js from "log4js";

import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";
import { getUserRoles } from "../../../common/auth/get-user-roles.ts";
import { isAuthActive } from "../../../common/auth/is-auth-active.ts";
import { assertExactlyOneLayerParent } from "../utils/assert-exactly-one-layer-parent.ts";
import {
  activeLayerInstanceWhere,
  activeLayerInstancesForMapWhere,
  activeLayerInstancesForMapsWhere,
  layerInstanceIncludeAll,
  resolveLayerPlacementById,
} from "../utils/layer-instance.ts";
import { toolsOnMapsOptionsForTarget } from "../utils/tool-placement.ts";
import LayerTreeService, { type MapContent } from "./layer-tree.service.ts";

const logger = log4js.getLogger("service.v3.map");

const DEFAULT_PROJECTION_CODE = "EPSG:3006";

/** Excludes soft-deleted tools from map tool counts and listings. */
const ACTIVE_TOOLS_ON_MAP_WHERE: Prisma.ToolsOnMapsWhereInput = {
  tool: { deletedAt: null },
};

interface MapWriteInput {
  name?: string;
  locked?: boolean;
  options?: Prisma.InputJsonValue;
  projection?: { code?: string };
  projections?: { code?: string }[];
}

/** A search or editing layer the map uses, in the order sent. */
interface MapLayerInput {
  layerId: string;
  zIndex?: number;
}

async function resolveProjectionConnect(code?: string) {
  const projectionCode = code?.trim() || DEFAULT_PROJECTION_CODE;
  const existingProjection = await prisma.projection.findUnique({
    where: { code: projectionCode },
  });

  if (!existingProjection) {
    throw new HajkError(
      HttpStatusCodes.BAD_REQUEST,
      `Projection with code ${projectionCode} not found`,
      HajkStatusCodes.INVALID_REQUEST_BODY
    );
  }

  return {
    projectionCode,
    connect: { id: existingProjection.id },
  };
}

/**
 * Resolves the many-to-many `projections` relation. Each entry is connected by
 * its (unique) `code`; an unknown code yields a 400 (mirrors the single
 * `projection` behavior). Returns `undefined` when nothing is to connect.
 */
async function resolveProjectionsConnect(
  projections?: { code?: string }[]
): Promise<{ id: number }[] | undefined> {
  if (!projections || projections.length === 0) {
    return undefined;
  }

  const connect: { id: number }[] = [];
  const seen = new Set<number>();
  for (const projection of projections) {
    const code = projection.code?.trim();
    if (!code) continue;

    const existing = await prisma.projection.findUnique({ where: { code } });
    if (!existing) {
      throw new HajkError(
        HttpStatusCodes.BAD_REQUEST,
        `Projection with code ${code} not found`,
        HajkStatusCodes.INVALID_REQUEST_BODY
      );
    }
    if (!seen.has(existing.id)) {
      seen.add(existing.id);
      connect.push({ id: existing.id });
    }
  }

  return connect.length > 0 ? connect : undefined;
}

function mergeOptionsWithProjection(
  options: Prisma.InputJsonValue,
  projectionCode: string
): Prisma.InputJsonValue {
  const base =
    options && typeof options === "object" && !Array.isArray(options)
      ? (options as Record<string, unknown>)
      : {};

  return {
    ...base,
    projection: projectionCode,
  };
}

/** Prisma read JsonValue (includes null) → write InputJsonValue. */
function toInputJsonValue(
  value: Prisma.JsonValue
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

class MapService {
  constructor() {
    logger.debug("Initiating Map Service");
  }

  async getMaps() {
    const maps = await prisma.map.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        projection: true,
        _count: {
          select: {
            tools: {
              where: ACTIVE_TOOLS_ON_MAP_WHERE,
            },
            projections: true,
          },
        },
      },
    });

    const contents = await LayerTreeService.getMapContents();
    const layerCounts = await this.countLayersByMapNames(
      maps.map((entry) => entry.name),
      contents
    );

    return maps.map(({ _count, ...map }) => ({
      ...map,
      layerCount: layerCounts.get(map.name) ?? 0,
      groupCount: contents.get(map.name)?.groups.size ?? 0,
      toolCount: _count.tools,
      projectionCount: _count.projections,
    }));
  }

  /**
   * Counts the layers each map uses: those its tree shows (`contents`), its
   * background layers, and the search and editing layers it uses — each once.
   */
  private async countLayersByMapNames(
    mapNames: string[],
    contents: Map<string, MapContent>
  ) {
    if (mapNames.length === 0) {
      return new Map<string, number>();
    }

    const instances = await prisma.layerInstance.findMany({
      where: activeLayerInstancesForMapsWhere(mapNames),
      select: {
        displayLayerId: true,
        searchLayerId: true,
        editingLayerId: true,
        map: { select: { name: true } },
      },
    });

    const layerIdsByMap = new Map(
      mapNames.map(
        (name) =>
          [name, new Set<string>(contents.get(name)?.layers.keys())] as const
      )
    );
    for (const instance of instances) {
      const layerId =
        instance.displayLayerId ??
        instance.searchLayerId ??
        instance.editingLayerId;
      if (!layerId || !instance.map?.name) continue;
      layerIdsByMap.get(instance.map.name)?.add(layerId);
    }

    return new Map(
      [...layerIdsByMap.entries()].map(([name, ids]) => [name, ids.size])
    );
  }

  async getMapNames() {
    const maps = await prisma.map.findMany({
      where: { deletedAt: null },
      select: { name: true },
    });

    // Transform the [{name: "map1"}, {name: "map2"}] to ["map1", "map2"]
    return maps.map((m) => m.name).sort();
  }

  async getMapByName(mapName: string, user: User | undefined) {
    logger.debug(`[getMapByName] Retrieving map "${mapName}"`);

    const roles = await getUserRoles(user);
    const roleCodes = roles.map((r) => r.code);
    const roleIds = roles.map((r) => r.id);

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
        logger.debug("User's roles:", roleCodes);
      } else {
        logger.debug("Current user: anonymous");
      }
    }

    // First, let's determine if a map with the supplied name exists.
    const mapExist = await prisma.map.findFirst({
      where: {
        name: mapName,
        deletedAt: null,
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
        deletedAt: null,
        // If auth is active, let's filter the request to only include
        // the maps that a) either are completely unrestricted (no roles in
        // `restrictedToRoles`) or, b) where at least one of the roles in
        // `restrictedToRoles` is included in the user's roles.
        ...(isAuthActive
          ? {
              OR: [
                { restrictedToRoles: { none: {} } },
                {
                  restrictedToRoles: {
                    some: { roleId: { in: roleIds } },
                  },
                },
              ],
            }
          : {}),
      },
      // TODO: Tools, Layers and Groups must also be filtered by `roles`.
      include: {
        projection: true,
        projections: true,
        // Soft-deleted tools must not reach the client map config.
        tools: { where: ACTIVE_TOOLS_ON_MAP_WHERE, include: { tool: true } },
        layers: {
          include: layerInstanceIncludeAll,
        },
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
   * The layers placed directly on the map: its background layers and the
   * search and editing layers it uses.
   */
  async getLayersForMap(mapName: string) {
    const instances = await prisma.layerInstance.findMany({
      where: activeLayerInstancesForMapWhere(mapName),
      include: layerInstanceIncludeAll,
      orderBy: { zIndex: "asc" },
    });

    return instances
      .map((instance) => {
        const source = {
          mapId: instance.mapId,
          groupId: instance.groupId,
          zIndex: instance.zIndex,
          visibleAtStart: instance.visibleAtStart,
          infoClickActive: instance.infoClickActive,
          usage: instance.usage ?? UseType.FOREGROUND,
        };
        if (instance.displayLayer) {
          return {
            ...instance.displayLayer,
            ...source,
            layerKind: "display" as const,
          };
        }
        if (instance.searchLayer) {
          return {
            ...instance.searchLayer,
            ...source,
            layerKind: "search" as const,
          };
        }
        if (instance.editingLayer) {
          return {
            ...instance.editingLayer,
            ...source,
            layerKind: "editing" as const,
          };
        }
        return null;
      })
      .filter((layer): layer is NonNullable<typeof layer> => layer !== null);
  }

  async getProjectionsForMap(mapName: string) {
    const projections = await prisma.projection.findMany({
      where: { maps: { some: { name: mapName } } },
    });

    return projections;
  }

  async getToolsForMap(mapName: string) {
    return await prisma.toolsOnMaps.findMany({
      where: {
        mapName,
        map: { deletedAt: null },
        ...ACTIVE_TOOLS_ON_MAP_WHERE,
      },
      include: { tool: true },
      orderBy: { index: "asc" },
    });
  }

  async updateMapTools(
    mapName: string,
    tools: {
      toolId: number;
      index: number;
      target: string | null;
      active?: boolean;
      options?: Record<string, unknown>;
    }[]
  ) {
    await prisma.$transaction([
      // Only replace placements for active tools — soft-deleted tools keep
      // theirs so a restored tool reappears on its maps.
      prisma.toolsOnMaps.deleteMany({
        where: { mapName, ...ACTIVE_TOOLS_ON_MAP_WHERE },
      }),
      ...(tools.length > 0
        ? [
            prisma.toolsOnMaps.createMany({
              data: tools.map((t) => ({
                mapName,
                toolId: t.toolId,
                active: t.active ?? true,
                index: t.index,
                target: t.target,
                options: toolsOnMapsOptionsForTarget(t.target, t.options),
              })),
            }),
          ]
        : []),
    ]);
  }

  private async requireMapByName(mapName: string) {
    const map = await prisma.map.findFirst({
      where: { name: mapName, deletedAt: null },
    });
    if (map === null) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `"${mapName}" is not a valid map`,
        HajkStatusCodes.UNKNOWN_MAP_NAME
      );
    }
    return map;
  }

  /**
   * Replaces the search and editing layers the map uses, in the order sent.
   * Layers it keeps keep their instance (and id). Its display layers are its
   * tree and its background, saved with the tree (PUT /maps/:mapName/layer-tree).
   */
  async updateMapLayers(mapName: string, layers: MapLayerInput[]) {
    const map = await this.requireMapByName(mapName);
    const wanted: {
      layerId: string;
      kind: "search" | "editing";
      zIndex: number;
    }[] = [];
    for (const [index, layer] of layers.entries()) {
      const resolved = await resolveLayerPlacementById(layer.layerId);
      if (!resolved.ok) {
        throw new HajkError(
          HttpStatusCodes.BAD_REQUEST,
          resolved.reason === "deleted"
            ? `Layer "${layer.layerId}" is deleted and cannot be placed on a map`
            : `Unknown layer id: ${layer.layerId}`,
          resolved.reason === "deleted"
            ? HajkStatusCodes.INVALID_REQUEST_BODY
            : HajkStatusCodes.UNKNOWN_LAYER_ID
        );
      }
      if (resolved.kind === "display") {
        throw new HajkError(
          HttpStatusCodes.BAD_REQUEST,
          `Layer "${layer.layerId}" is a display layer: a map's display layers are in its layer tree and background`,
          HajkStatusCodes.INVALID_REQUEST_BODY
        );
      }
      wanted.push({
        layerId: layer.layerId,
        kind: resolved.kind,
        zIndex: layer.zIndex ?? index,
      });
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.layerInstance.findMany({
        where: { mapId: map.id, displayLayerId: null },
        select: { id: true, searchLayerId: true, editingLayerId: true },
      });
      const instanceOf = new Map<string, string>();
      for (const instance of existing) {
        const layerId = instance.searchLayerId ?? instance.editingLayerId;
        if (layerId && !instanceOf.has(layerId)) {
          instanceOf.set(layerId, instance.id);
        }
      }
      const kept = new Set<string>();
      const created: Prisma.LayerInstanceCreateManyInput[] = [];
      for (const layer of wanted) {
        const id = instanceOf.get(layer.layerId);
        if (id && !kept.has(id)) {
          kept.add(id);
          await tx.layerInstance.update({
            where: { id },
            data: { zIndex: layer.zIndex },
          });
          continue;
        }
        const row = {
          mapId: map.id,
          searchLayerId: layer.kind === "search" ? layer.layerId : undefined,
          editingLayerId: layer.kind === "editing" ? layer.layerId : undefined,
          infoClickActive: false,
          zIndex: layer.zIndex,
        };
        assertExactlyOneLayerParent(row);
        created.push(row);
      }
      await tx.layerInstance.deleteMany({
        where: {
          id: {
            in: existing
              .map((instance) => instance.id)
              .filter((id) => !kept.has(id)),
          },
        },
      });
      if (created.length > 0) {
        await tx.layerInstance.createMany({ data: created });
      }
    });
  }

  async createMap(data: MapWriteInput, userId?: string) {
    const name =
      typeof data.name === "string"
        ? data.name.trim()
        : String(data.name ?? "");
    if (!name) {
      throw new HajkError(
        HttpStatusCodes.BAD_REQUEST,
        "Map name is required",
        HajkStatusCodes.INVALID_REQUEST_BODY
      );
    }

    const locked = typeof data.locked === "boolean" ? data.locked : false;
    const rawOptions =
      data.options &&
      typeof data.options === "object" &&
      !Array.isArray(data.options)
        ? data.options
        : {};
    const optionsFromInput = rawOptions as Record<string, unknown>;
    const projectionCodeFromOptions =
      typeof optionsFromInput.projection === "string"
        ? optionsFromInput.projection
        : undefined;
    const { projectionCode, connect } = await resolveProjectionConnect(
      data.projection?.code ?? projectionCodeFromOptions
    );
    const projectionsConnect = await resolveProjectionsConnect(
      data.projections
    );

    try {
      const newMap = await prisma.map.create({
        data: {
          name,
          locked,
          options: mergeOptionsWithProjection(rawOptions, projectionCode),
          projection: { connect },
          ...(projectionsConnect
            ? { projections: { connect: projectionsConnect } }
            : {}),
          createdBy: userId,
          createdDate: new Date(),
        },
        include: { projection: true, projections: true },
      });
      return newMap;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new HajkError(
          HttpStatusCodes.CONFLICT,
          `Could not create map: a map named "${name}" already exists`,
          HajkStatusCodes.MAP_ALREADY_EXISTS
        );
      }
      throw error;
    }
  }

  async updateMap(mapName: string, data: MapWriteInput, userId?: string) {
    const { projection, projections, options, ...mapScalars } = data;
    const updateData: Prisma.MapUpdateInput = {
      ...mapScalars,
      lastSavedBy: userId,
      lastSavedDate: new Date(),
    };

    if (options !== undefined) {
      updateData.options = options;
    }

    // Replace the many-to-many `projections` set when the caller sends the key.
    if (projections !== undefined) {
      const projectionsConnect = await resolveProjectionsConnect(projections);
      updateData.projections = { set: projectionsConnect ?? [] };
    }

    if (projection?.code) {
      const { projectionCode, connect } = await resolveProjectionConnect(
        projection.code
      );
      updateData.projection = { connect };
      const existing = await prisma.map.findFirst({
        where: { name: mapName, deletedAt: null },
        select: { options: true },
      });
      const existingOptions =
        existing?.options &&
        typeof existing.options === "object" &&
        !Array.isArray(existing.options)
          ? existing.options
          : {};
      const nextOptions =
        options !== undefined
          ? options
          : (existingOptions as Prisma.InputJsonValue);
      updateData.options = mergeOptionsWithProjection(
        nextOptions,
        projectionCode
      );
    }

    await this.requireMapByName(mapName);

    const updatedMap = await prisma.map.update({
      where: { name: mapName },
      data: updateData,
      include: { projection: true, projections: true },
    });
    return updatedMap;
  }

  async deleteMap(mapName: string) {
    const map = await prisma.map.findFirst({
      where: { name: mapName, deletedAt: null },
    });
    if (map === null) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `"${mapName}" is not a valid map`,
        HajkStatusCodes.UNKNOWN_MAP_NAME
      );
    }

    if (map.locked) {
      throw new HajkError(
        HttpStatusCodes.FORBIDDEN,
        `Map "${mapName}" is locked and cannot be deleted`,
        HajkStatusCodes.INVALID_REQUEST_BODY
      );
    }

    // Soft delete — the map's rows are kept so it can be restored as it was.
    const deletedAt = new Date();

    await prisma.$transaction([
      prisma.theme.updateMany({
        where: { mapName, deletedAt: null },
        data: { deletedAt, lastSavedDate: deletedAt },
      }),
      prisma.map.updateMany({
        where: { id: map.id, deletedAt: null },
        data: { deletedAt, lastSavedDate: deletedAt },
      }),
    ]);
  }

  async getDeletedMaps() {
    const maps = await prisma.map.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
    });

    return Promise.all(
      maps.map(async (map) => {
        const themeCount = await prisma.theme.count({
          where: {
            mapName: map.name,
            deletedAt: map.deletedAt,
          },
        });

        return {
          ...map,
          themeCount,
        };
      })
    );
  }

  async restoreMap(mapName: string, userId?: string) {
    const map = await prisma.map.findFirst({
      where: { name: mapName, deletedAt: { not: null } },
    });

    if (!map || !map.deletedAt) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No deleted map with name: ${mapName} could be found.`,
        HajkStatusCodes.UNKNOWN_MAP_NAME
      );
    }

    const deletedAt = map.deletedAt;
    const restoredAt = new Date();

    return prisma.$transaction(async (transaction) => {
      const themeResult = await transaction.theme.updateMany({
        where: { mapName, deletedAt },
        data: {
          deletedAt: null,
          lastSavedBy: userId,
          lastSavedDate: restoredAt,
        },
      });

      const restored = await transaction.map.update({
        where: { id: map.id },
        data: {
          deletedAt: null,
          lastSavedBy: userId,
          lastSavedDate: restoredAt,
        },
      });

      return {
        ...restored,
        themeCount: themeResult.count,
      };
    });
  }

  async duplicateMap(
    sourceMapName: string,
    newName: string,
    options: {
      includeLayers?: boolean;
      includeGroups?: boolean;
      includeTools?: boolean;
    } = {},
    userId?: string
  ) {
    const name =
      typeof newName === "string" ? newName.trim() : String(newName ?? "");
    if (!name) {
      throw new HajkError(
        HttpStatusCodes.BAD_REQUEST,
        "Map name is required",
        HajkStatusCodes.INVALID_REQUEST_BODY
      );
    }

    const includeLayers = options.includeLayers !== false;
    const includeGroups = options.includeGroups !== false;
    const includeTools = options.includeTools !== false;

    const source = await prisma.map.findFirst({
      where: { name: sourceMapName, deletedAt: null },
      include: {
        projection: true,
        projections: true,
        restrictedToRoles: true,
        tools: { where: ACTIVE_TOOLS_ON_MAP_WHERE },
        layers: {
          where: activeLayerInstanceWhere,
          include: { restrictedToRoles: true },
        },
        treeItems: true,
        groupExceptions: true,
        drawOrderItems: true,
        groupSettings: true,
        layerSettings: true,
        themes: { where: { deletedAt: null } },
      },
    });

    if (!source) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `"${sourceMapName}" is not a valid map`,
        HajkStatusCodes.UNKNOWN_MAP_NAME
      );
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const newMap = await tx.map.create({
          data: {
            name,
            locked: source.locked,
            options: toInputJsonValue(source.options),
            createdBy: userId,
            createdDate: new Date(),
            ...(source.projectionId
              ? { projection: { connect: { id: source.projectionId } } }
              : {}),
            ...(source.projections.length > 0
              ? {
                  projections: {
                    connect: source.projections.map((projection) => ({
                      id: projection.id,
                    })),
                  },
                }
              : {}),
            ...(source.restrictedToRoles.length > 0
              ? {
                  restrictedToRoles: {
                    create: source.restrictedToRoles.map((role) => ({
                      roleId: role.roleId,
                    })),
                  },
                }
              : {}),
          },
        });

        if (includeTools && source.tools.length > 0) {
          await tx.toolsOnMaps.createMany({
            data: source.tools.map((tool) => ({
              mapName: name,
              toolId: tool.toolId,
              active: tool.active,
              index: tool.index,
              target: tool.target,
              options: toInputJsonValue(tool.options),
            })),
          });
        }

        if (includeGroups) {
          // The map's tree (groups are a shared catalog, linked by id), its
          // exceptions to the groups, its settings for them and its draw
          // order.
          const forNewMap = <Row extends { id: string; mapName: string }>(
            rows: Row[]
          ) =>
            rows.map(
              (row) =>
                Object.fromEntries(
                  Object.entries({ ...row, mapName: name }).filter(
                    ([key]) => key !== "id"
                  )
                ) as Omit<Row, "id">
            );
          if (source.treeItems.length > 0) {
            await tx.mapTreeItem.createMany({
              data: forNewMap(source.treeItems),
            });
          }
          if (source.groupExceptions.length > 0) {
            await tx.mapGroupException.createMany({
              data: forNewMap(source.groupExceptions),
            });
          }
          if (source.drawOrderItems.length > 0) {
            await tx.mapDrawOrderItem.createMany({
              data: forNewMap(source.drawOrderItems),
            });
          }
          if (source.groupSettings.length > 0) {
            await tx.mapGroupSetting.createMany({
              data: forNewMap(source.groupSettings),
            });
          }
          if (source.layerSettings.length > 0) {
            await tx.mapLayerSetting.createMany({
              data: forNewMap(source.layerSettings),
            });
          }
        }

        if (includeLayers) {
          // Its background layers, and the search and editing layers it uses.
          for (const layer of source.layers) {
            const createdLayer = await tx.layerInstance.create({
              data: {
                displayLayerId: layer.displayLayerId,
                searchLayerId: layer.searchLayerId,
                editingLayerId: layer.editingLayerId,
                mapId: newMap.id,
                usage: layer.usage,
                infoClickActive: layer.infoClickActive,
                visibleAtStart: layer.visibleAtStart,
                zIndex: layer.zIndex,
                options: toInputJsonValue(layer.options),
              },
            });

            if (layer.restrictedToRoles.length > 0) {
              await tx.roleOnLayerInstance.createMany({
                data: layer.restrictedToRoles.map((role) => ({
                  layerInstanceId: createdLayer.id,
                  roleId: role.roleId,
                })),
              });
            }
          }
        }

        // Documents now belong to Tool instances, not maps.
        // When tools are shared via ToolsOnMaps (above), their documents
        // are automatically available on the duplicated map. No copy needed.

        if (source.themes.length > 0) {
          await tx.theme.createMany({
            data: source.themes.map((theme) => ({
              mapName: name,
              title: theme.title,
              owner: theme.owner,
              description: theme.description,
              keywords: theme.keywords,
              data: toInputJsonValue(theme.data),
              createdBy: userId,
              createdDate: new Date(),
              lastSavedBy: userId,
              lastSavedDate: new Date(),
            })),
          });
        }

        return tx.map.findUniqueOrThrow({
          where: { id: newMap.id },
          include: { projection: true, projections: true },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new HajkError(
          HttpStatusCodes.CONFLICT,
          `Could not duplicate map: a map named "${name}" already exists`,
          HajkStatusCodes.MAP_ALREADY_EXISTS
        );
      }
      throw error;
    }
  }
}

export default new MapService();

import { Prisma, UseType, type User } from "@prisma/client";
import log4js from "log4js";
import { randomUUID } from "node:crypto";

import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";
import { getUserRoles } from "../../../common/auth/get-user-roles.ts";
import { isAuthActive } from "../../../common/auth/is-auth-active.ts";
import { assertExactlyOneLayerParent } from "../utils/assert-exactly-one-layer-parent.ts";
import {
  activeLayerInstancesForMapWhere,
  activeLayerInstancesForMapsWhere,
  layerInstanceIncludeAll,
  resolveLayerPlacementById,
} from "../utils/layer-instance.ts";
import { toolsOnMapsOptionsForTarget } from "../utils/tool-placement.ts";
import { buildLayerSwitcherAdminStateForMap } from "../utils/build-layer-switcher-groups-for-map.ts";
import {
  flattenLayerSwitcherGroupsForWrite,
  type LayerSwitcherWriteGroup,
} from "../utils/flatten-layer-switcher-for-map-write.ts";

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

interface MapLayerInput {
  layerId: string;
  usage?: UseType;
  visibleAtStart?: boolean;
  infoClickActive?: boolean;
  zIndex?: number;
  /** Stored on LayerInstance.options.infobox (client baselayer shape). */
  infobox?: string;
}

/** Options for replacing direct map LayerInstances by usage. */
interface ReplaceDirectMapLayersOptions {
  /**
   * When true, BACKGROUND instances are replaced even if the payload has none
   * (used to clear all baselayers). When omitted, BACKGROUND is replaced only
   * if the payload includes at least one BACKGROUND entry.
   */
  replaceBackground?: boolean;
  /**
   * When true, FOREGROUND instances are replaced even if the payload has none.
   * Use with replaceBackground when an admin UI manages the full map-direct set.
   */
  replaceForeground?: boolean;
}

interface MapGroupInput {
  id?: string;
  groupId: string;
  parentGroupId?: string | null;
  usage?: UseType;
  name?: string;
  toggled?: boolean;
  expanded?: boolean;
  exclusiveGroup?: boolean;
  infoDocument?: boolean;
  index?: number;
  metadata?: {
    title?: string;
    description?: string;
    owner?: string;
    url?: string;
    urlTitle?: string;
    urlOpenData?: string;
  } | null;
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
  value: Prisma.JsonValue,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);
}

class MapService {
  constructor() {
    logger.debug("Initiating Map Service");
  }

  async getMaps() {
    const maps = await prisma.map.findMany({
      orderBy: { name: "asc" },
      include: {
        projection: true,
        _count: {
          select: {
            groups: true,
            tools: {
              where: ACTIVE_TOOLS_ON_MAP_WHERE,
            },
            projections: true,
          },
        },
      },
    });

    // Layer count spans direct map layers and layers inherited via groups —
    // Prisma `_count.layers` only covers direct `mapId` links, so we batch-count
    // with the same filter as getLayersForMap.
    const layerCounts = await this.countLayersByMapNames(
      maps.map((entry) => entry.name)
    );

    return maps.map(({ _count, ...map }) => ({
      ...map,
      layerCount: layerCounts.get(map.name) ?? 0,
      groupCount: _count.groups,
      toolCount: _count.tools,
      projectionCount: _count.projections,
    }));
  }

  /**
   * Counts active layer instances linked to each map — both directly (`mapId`)
   * and via groups placed on the map. Matches the filter used by getLayersForMap.
   */
  private async countLayersByMapNames(mapNames: string[]) {
    const counts = new Map(mapNames.map((name) => [name, 0]));
    if (mapNames.length === 0) {
      return counts;
    }

    const instances = await prisma.layerInstance.findMany({
      where: activeLayerInstancesForMapsWhere(mapNames),
      select: {
        map: { select: { name: true } },
        group: {
          select: {
            maps: {
              where: { mapName: { in: mapNames } },
              select: { mapName: true },
            },
          },
        },
      },
    });

    for (const instance of instances) {
      if (instance.map?.name) {
        counts.set(instance.map.name, (counts.get(instance.map.name) ?? 0) + 1);
      }
      for (const placement of instance.group?.maps ?? []) {
        counts.set(placement.mapName, (counts.get(placement.mapName) ?? 0) + 1);
      }
    }

    return counts;
  }

  async getMapNames() {
    const maps = await prisma.map.findMany({ select: { name: true } });

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
      include: {
        group: {
          select: { internalName: true },
        },
      },
    });

    return allGroups.map(({ group, ...placement }) => ({
      ...placement,
      internalName: group.internalName,
    }));
  }

  async getLayersForMap(mapName: string) {
    const instances = await prisma.layerInstance.findMany({
      where: activeLayerInstancesForMapWhere(mapName),
      include: layerInstanceIncludeAll,
      orderBy: { zIndex: "asc" },
    });

    return instances
      .map((instance) => {
        // Source info lets the admin tell map-direct layers (mapId set) apart
        // from layers inherited via a group (groupId set).
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
      where: { mapName, ...ACTIVE_TOOLS_ON_MAP_WHERE },
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
    const map = await prisma.map.findUnique({ where: { name: mapName } });
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
   * Replaces the map's directly-attached layers (LayerInstance rows with
   * `mapId`). Layers placed inside groups are untouched. Order is stored in
   * `zIndex` (falls back to array position).
   *
   * FOREGROUND (and unset usage) rows are replaced when the payload includes
   * FOREGROUND entries, or when it contains no BACKGROUND entries (draw-order
   * / Kartinnehåll). BACKGROUND rows are replaced only when the payload
   * includes BACKGROUND entries or `replaceBackground` is true — so FOREGROUND
   * saves cannot wipe baselayers, and BACKGROUND-only saves cannot wipe
   * FOREGROUND draw-order layers.
   */
  async updateMapLayers(
    mapName: string,
    layers: MapLayerInput[],
    options?: ReplaceDirectMapLayersOptions
  ) {
    const map = await this.requireMapByName(mapName);
    await this.replaceDirectMapLayers(map.id, layers, options);
  }

  /**
   * Replaces the map's group placements (GroupsOnMaps). Supports nesting via
   * `parentGroupId`; entries referenced as a parent must carry an explicit
   * `id`. Missing names default to the group's own name.
   */
  async updateMapGroups(mapName: string, groups: MapGroupInput[]) {
    await this.requireMapByName(mapName);
    await this.replaceMapGroups(mapName, groups);
  }

  /**
   * Replaces direct map layers and group placements in one transaction
   * (admin Kartinnehåll save). BACKGROUND map instances are preserved unless
   * the layers payload explicitly includes BACKGROUND entries.
   */
  async updateMapContent(
    mapName: string,
    content: { layers: MapLayerInput[]; groups: MapGroupInput[] }
  ) {
    const map = await this.requireMapByName(mapName);
    await this.validateMapGroupPlacements(content.groups);
    await prisma.$transaction(async (tx) => {
      await this.replaceDirectMapLayersInTransaction(
        tx,
        map.id,
        content.layers
      );
      await this.replaceMapGroupsInTransaction(tx, mapName, content.groups);
    });
  }

  async getMapContent(mapName: string) {
    const [layers, groups] = await Promise.all([
      this.getLayersForMap(mapName),
      this.getGroupsForMap(mapName),
    ]);
    return { layers, groups };
  }

  async getMapLayerSwitcher(mapName: string) {
    await this.requireMapByName(mapName);
    return buildLayerSwitcherAdminStateForMap(mapName);
  }

  /**
   * Atomically replaces Kartlager hierarchy (GroupsOnMaps + per-group
   * LayerInstances) and Bakgrund (map BACKGROUND LayerInstances).
   * Does not touch FOREGROUND map-direct LayerInstances (draw-order).
   */
  async updateMapLayerSwitcher(
    mapName: string,
    content: {
      groups: LayerSwitcherWriteGroup[];
      baselayers: MapLayerInput[];
    },
    userId?: string
  ) {
    const map = await this.requireMapByName(mapName);
    const { placements, groupLayers } = flattenLayerSwitcherGroupsForWrite(
      content.groups ?? []
    );

    const groupIds = Array.from(new Set(placements.map((p) => p.groupId)));
    if (groupIds.length > 0) {
      const groupRecords = await prisma.group.findMany({
        where: { id: { in: groupIds } },
        select: { id: true, name: true, type: true },
      });
      const knownIds = new Set(groupRecords.map((g) => g.id));
      for (const groupId of groupIds) {
        if (!knownIds.has(groupId)) {
          throw new HajkError(
            HttpStatusCodes.BAD_REQUEST,
            `Unknown group id: ${groupId}`,
            HajkStatusCodes.INVALID_REQUEST_BODY
          );
        }
      }
    }

    const mapGroupInputs: MapGroupInput[] = placements.map((placement) => ({
      id: placement.id,
      groupId: placement.groupId,
      parentGroupId: placement.parentGroupId,
      usage: placement.usage,
      name: placement.name,
      toggled: placement.toggled,
      expanded: placement.expanded,
      exclusiveGroup: placement.exclusiveGroup,
      infoDocument: placement.infoDocument,
      index: placement.index,
      metadata: placement.metadata,
    }));

    const backgroundLayers: MapLayerInput[] = (content.baselayers ?? []).map(
      (layer, index) => ({
        layerId: layer.layerId,
        usage: UseType.BACKGROUND,
        visibleAtStart: layer.visibleAtStart ?? false,
        infoClickActive: layer.infoClickActive ?? true,
        zIndex: layer.zIndex ?? index,
        infobox: layer.infobox ?? "",
      })
    );

    await prisma.$transaction(async (tx) => {
      await this.replaceMapGroupsInTransaction(tx, mapName, mapGroupInputs);

      for (const entry of groupLayers) {
        const layerCreates: Prisma.LayerInstanceCreateManyInput[] = [];
        for (const [index, layer] of entry.layers.entries()) {
          const resolved = await resolveLayerPlacementById(layer.layerId);
          if (!resolved.ok) {
            throw new HajkError(
              HttpStatusCodes.BAD_REQUEST,
              resolved.reason === "deleted"
                ? `Layer "${layer.layerId}" is deleted and cannot be placed in a group`
                : `Unknown layer id: ${layer.layerId}`,
              resolved.reason === "deleted"
                ? HajkStatusCodes.INVALID_REQUEST_BODY
                : HajkStatusCodes.UNKNOWN_LAYER_ID
            );
          }
          const kind = resolved.kind;
          layerCreates.push({
            mapId: map.id,
            groupId: entry.groupId,
            usage: UseType.FOREGROUND,
            visibleAtStart: layer.visibleAtStart,
            zIndex: layer.zIndex ?? index,
            infoClickActive: true,
            options: layer.options as Prisma.InputJsonValue,
            displayLayerId: kind === "display" ? layer.layerId : undefined,
            searchLayerId: kind === "search" ? layer.layerId : undefined,
            editingLayerId: kind === "editing" ? layer.layerId : undefined,
          });
          assertExactlyOneLayerParent(layerCreates[layerCreates.length - 1]);
        }

        await tx.layerInstance.deleteMany({
          where: { groupId: entry.groupId },
        });
        if (layerCreates.length > 0) {
          await tx.layerInstance.createMany({ data: layerCreates });
        }
        await tx.group.update({
          where: { id: entry.groupId },
          data: {
            lastSavedBy: userId,
            lastSavedDate: new Date(),
          },
        });
      }

      await this.replaceDirectMapLayersInTransaction(
        tx,
        map.id,
        backgroundLayers,
        { replaceBackground: true }
      );
    });

    await this.syncLayerSwitcherContentInToolOptions(
      mapName,
      content.groups ?? [],
      backgroundLayers,
    );
  }

  /**
   * Mirror Kartlager groups + Bakgrund into the map's layerswitcher Tool.options
   * (legacy map JSON shape: groups[].layers[].drawOrder, baselayers[]).
   */
  private async syncLayerSwitcherContentInToolOptions(
    mapName: string,
    groups: LayerSwitcherWriteGroup[],
    baselayers: MapLayerInput[],
  ) {
    const entry = await prisma.toolsOnMaps.findFirst({
      where: {
        mapName,
        active: true,
        tool: { type: "layerswitcher", deletedAt: null },
      },
      select: {
        toolId: true,
        tool: { select: { options: true } },
      },
    });

    if (!entry) {
      return;
    }

    const groupsForOptions = this.toLayerSwitcherToolOptionGroups(groups);

    const baselayersForOptions = baselayers.map((layer, index) => ({
      id: layer.layerId,
      drawOrder: layer.zIndex ?? index,
      visibleAtStart: layer.visibleAtStart ?? false,
      infobox: layer.infobox ?? "",
    }));

    const currentOptions =
      entry.tool.options &&
      typeof entry.tool.options === "object" &&
      !Array.isArray(entry.tool.options)
        ? (entry.tool.options as Record<string, unknown>)
        : {};

    await prisma.tool.update({
      where: { id: entry.toolId },
      data: {
        options: {
          ...currentOptions,
          groups: groupsForOptions,
          baselayers: baselayersForOptions,
        } as Prisma.InputJsonValue,
        lastSavedDate: new Date(),
      },
    });
  }

  /** Nested groups for Tool.options — preserve drawOrder on each layer ref. */
  private toLayerSwitcherToolOptionGroups(
    groups: LayerSwitcherWriteGroup[],
  ): Prisma.InputJsonObject[] {
    return groups.map((group) => ({
      id: group.id,
      type: "group",
      name: group.name ?? "",
      toggled: Boolean(group.toggled),
      expanded: Boolean(group.expanded),
      exclusiveGroup: Boolean(group.exclusiveGroup),
      infogroupvisible: Boolean(group.infogroupvisible),
      infogrouptitle: group.infogrouptitle ?? "",
      infogrouptext: group.infogrouptext ?? "",
      infogroupurl: group.infogroupurl ?? "",
      infogroupurltext: group.infogroupurltext ?? "",
      infogroupopendatalink: group.infogroupopendatalink ?? "",
      infogroupowner: group.infogroupowner ?? "",
      layers: (group.layers ?? []).map((layer) => ({
        id: layer.id,
        drawOrder: layer.drawOrder ?? 1000,
        visibleAtStart: Boolean(layer.visibleAtStart),
        infobox: layer.infobox ?? "",
      })),
      groups: this.toLayerSwitcherToolOptionGroups(group.groups ?? []),
    }));
  }

  private async replaceDirectMapLayers(
    mapId: number,
    layers: MapLayerInput[],
    options?: ReplaceDirectMapLayersOptions
  ) {
    await prisma.$transaction(async (tx) => {
      await this.replaceDirectMapLayersInTransaction(
        tx,
        mapId,
        layers,
        options
      );
    });
  }

  private async replaceDirectMapLayersInTransaction(
    tx: Prisma.TransactionClient,
    mapId: number,
    layers: MapLayerInput[],
    options?: ReplaceDirectMapLayersOptions
  ) {
    const foreground = layers.filter(
      (layer) => (layer.usage ?? UseType.FOREGROUND) !== UseType.BACKGROUND
    );
    const background = layers.filter(
      (layer) => layer.usage === UseType.BACKGROUND
    );
    const hasForegroundInPayload = foreground.length > 0;
    const hasBackgroundInPayload = background.length > 0;
    const replaceBackground =
      options?.replaceBackground === true || hasBackgroundInPayload;
    const replaceForeground =
      options?.replaceForeground === true ||
      hasForegroundInPayload ||
      (!replaceBackground && !hasBackgroundInPayload);

    const toCreate: Prisma.LayerInstanceCreateManyInput[] = [];
    if (replaceForeground) {
      const mapRecord = await tx.map.findUnique({
        where: { id: mapId },
        select: { name: true },
      });
      const mapGroupIds =
        mapRecord != null
          ? [
              ...new Set(
                (
                  await tx.groupsOnMaps.findMany({
                    where: { mapName: mapRecord.name },
                    select: { groupId: true },
                  })
                ).map((row) => row.groupId)
              ),
            ]
          : [];

      const activeCatalogIds = new Set(layers.map((layer) => layer.layerId));
      const activeCatalogIdList = [...activeCatalogIds];

      const catalogStillActiveFilter = (): Prisma.LayerInstanceWhereInput => {
        if (activeCatalogIds.size === 0) {
          return {};
        }
        return {
          OR: [
            { displayLayerId: { in: activeCatalogIdList } },
            { searchLayerId: { in: activeCatalogIdList } },
            { editingLayerId: { in: activeCatalogIdList } },
          ],
        };
      };

      // Remove every placement on this map for catalog layers that are no longer active
      // (map-direct, group-linked with mapId, and legacy group-only rows).
      if (activeCatalogIds.size === 0) {
        await tx.layerInstance.deleteMany({ where: { mapId } });
        if (mapGroupIds.length > 0) {
          await tx.layerInstance.deleteMany({
            where: { groupId: { in: mapGroupIds } },
          });
        }
      } else {
        await tx.layerInstance.deleteMany({
          where: {
            mapId,
            NOT: catalogStillActiveFilter(),
          },
        });
        if (mapGroupIds.length > 0) {
          await tx.layerInstance.deleteMany({
            where: {
              groupId: { in: mapGroupIds },
              NOT: catalogStillActiveFilter(),
            },
          });
        }
      }

      // Replace map-direct FOREGROUND rows (group placements are left intact).
      await tx.layerInstance.deleteMany({
        where: {
          mapId,
          groupId: null,
          OR: [{ usage: UseType.FOREGROUND }, { usage: null }],
        },
      });

      const groupPlacedCatalogIds = new Set<string>();
      if (mapGroupIds.length > 0) {
        const remainingGroupInstances = await tx.layerInstance.findMany({
          where: { groupId: { in: mapGroupIds } },
          select: {
            displayLayerId: true,
            searchLayerId: true,
            editingLayerId: true,
          },
        });
        for (const instance of remainingGroupInstances) {
          const catalogId =
            instance.displayLayerId ??
            instance.searchLayerId ??
            instance.editingLayerId;
          if (catalogId) {
            groupPlacedCatalogIds.add(catalogId);
          }
        }
      }

      const foregroundWithoutGroup = foreground.filter(
        (layer) => !groupPlacedCatalogIds.has(layer.layerId)
      );
      toCreate.push(
        ...(await this.buildDirectMapLayerRows(mapId, foregroundWithoutGroup))
      );
    }
    if (replaceBackground) {
      await tx.layerInstance.deleteMany({
        where: { mapId, groupId: null, usage: UseType.BACKGROUND },
      });
      toCreate.push(...(await this.buildDirectMapLayerRows(mapId, background)));
    }

    if (toCreate.length > 0) {
      await tx.layerInstance.createMany({ data: toCreate });
    }
  }

  private async buildDirectMapLayerRows(
    mapId: number,
    layers: MapLayerInput[]
  ): Promise<Prisma.LayerInstanceCreateManyInput[]> {
    const data: Prisma.LayerInstanceCreateManyInput[] = [];
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
      const kind = resolved.kind;
      const row = {
        mapId,
        displayLayerId: kind === "display" ? layer.layerId : undefined,
        searchLayerId: kind === "search" ? layer.layerId : undefined,
        editingLayerId: kind === "editing" ? layer.layerId : undefined,
        usage: layer.usage ?? UseType.FOREGROUND,
        visibleAtStart: layer.visibleAtStart ?? false,
        infoClickActive: layer.infoClickActive ?? true,
        zIndex: layer.zIndex ?? index,
        options:
          layer.infobox != null
            ? toInputJsonValue({ infobox: layer.infobox })
            : undefined,
      };
      assertExactlyOneLayerParent(row);
      data.push(row);
    }
    return data;
  }

  private async validateMapGroupPlacements(groups: MapGroupInput[]) {
    const groupIds = Array.from(new Set(groups.map((g) => g.groupId)));
    if (groupIds.length === 0) {
      return;
    }
    const groupRecords = await prisma.group.findMany({
      where: { id: { in: groupIds } },
      select: { id: true },
    });
    const knownIds = new Set(groupRecords.map((g) => g.id));
    for (const group of groups) {
      if (!knownIds.has(group.groupId)) {
        throw new HajkError(
          HttpStatusCodes.BAD_REQUEST,
          `Unknown group id: ${group.groupId}`,
          HajkStatusCodes.INVALID_REQUEST_BODY
        );
      }
    }
  }

  private async replaceMapGroups(mapName: string, groups: MapGroupInput[]) {
    const groupIds = Array.from(new Set(groups.map((g) => g.groupId)));
    const groupRecords =
      groupIds.length > 0
        ? await prisma.group.findMany({
            where: { id: { in: groupIds } },
            select: { id: true, name: true },
          })
        : [];
    const nameById = new Map(groupRecords.map((g) => [g.id, g.name]));
    await this.validateMapGroupPlacements(groups);
    await prisma.$transaction(async (tx) => {
      await this.replaceMapGroupsInTransaction(tx, mapName, groups, nameById);
    });
  }

  private async replaceMapGroupsInTransaction(
    tx: Prisma.TransactionClient,
    mapName: string,
    groups: MapGroupInput[],
    nameById?: Map<string, string>
  ) {
    const names =
      nameById ??
      new Map(
        (
          await tx.group.findMany({
            where: {
              id: { in: Array.from(new Set(groups.map((g) => g.groupId))) },
            },
            select: { id: true, name: true },
          })
        ).map((g) => [g.id, g.name])
      );

    await tx.groupsOnMaps.deleteMany({ where: { mapName } });

    const pending = [...groups];
    const createdIds = new Set<string>();

    while (pending.length > 0) {
      const batch = pending.filter(
        (entry) => !entry.parentGroupId || createdIds.has(entry.parentGroupId)
      );

      if (batch.length === 0) {
        throw new HajkError(
          HttpStatusCodes.BAD_REQUEST,
          "Invalid groups-on-maps parent references.",
          HajkStatusCodes.INVALID_REQUEST_BODY
        );
      }

      for (const entry of batch) {
        let metadataId: string | undefined;
        if (entry.metadata) {
          const createdMetadata = await tx.metadata.create({
            data: {
              title: entry.metadata.title ?? "",
              description: entry.metadata.description ?? "",
              owner: entry.metadata.owner ?? "",
              url: entry.metadata.url ?? "",
              urlTitle: entry.metadata.urlTitle ?? "",
              urlOpenData: entry.metadata.urlOpenData ?? "",
            },
          });
          metadataId = createdMetadata.id;
        }

        const created = await tx.groupsOnMaps.create({
          data: {
            ...(entry.id ? { id: entry.id } : {}),
            mapName,
            groupId: entry.groupId,
            parentGroupId: entry.parentGroupId ?? null,
            usage: entry.usage ?? UseType.FOREGROUND,
            name: entry.name ?? names.get(entry.groupId) ?? "",
            toggled: entry.toggled ?? false,
            expanded: entry.expanded ?? false,
            exclusiveGroup: entry.exclusiveGroup ?? false,
            infoDocument: entry.infoDocument ?? false,
            ...(metadataId ? { metadataId } : {}),
            index: entry.index ?? 0,
          },
        });
        createdIds.add(created.id);
      }

      for (const entry of batch) {
        const index = pending.indexOf(entry);
        if (index !== -1) {
          pending.splice(index, 1);
        }
      }
    }
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
      const existing = await prisma.map.findUnique({
        where: { name: mapName },
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

    const updatedMap = await prisma.map.update({
      where: { name: mapName },
      data: updateData,
      include: { projection: true, projections: true },
    });
    return updatedMap;
  }

  async deleteMap(mapName: string) {
    const map = await prisma.map.findUnique({ where: { name: mapName } });
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

    // Remove the map together with its per-map placements. We only delete the
    // join/placement rows (LayerInstance, ToolsOnMaps, GroupsOnMaps) — the
    // shared underlying entities (display/search/editing layers, tools, groups,
    // projections) are kept since they may be used by other maps. RoleOnMap,
    // DocumentFolder and Document are removed via onDelete: Cascade.
    await prisma.$transaction([
      prisma.layerInstance.deleteMany({ where: { mapId: map.id } }),
      prisma.toolsOnMaps.deleteMany({ where: { mapName } }),
      prisma.groupsOnMaps.deleteMany({ where: { mapName } }),
      prisma.map.delete({ where: { id: map.id } }),
    ]);
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

    const source = await prisma.map.findUnique({
      where: { name: sourceMapName },
      include: {
        projection: true,
        projections: true,
        restrictedToRoles: true,
        tools: true,
        layers: { include: { restrictedToRoles: true } },
        groups: true,
        themes: true,
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
          const uniqueGroupIds = [
            ...new Set(source.groups.map((entry) => entry.groupId)),
          ];
          const groupIdMap = new Map<string, string>();

          for (const oldGroupId of uniqueGroupIds) {
            const group = await tx.group.findUnique({
              where: { id: oldGroupId },
              include: {
                layers: { include: { restrictedToRoles: true } },
                restrictedToRoles: true,
              },
            });

            if (!group) {
              continue;
            }

            const newGroup = await tx.group.create({
              data: {
                locked: group.locked,
                name: group.name,
                internalName: group.internalName,
                type: group.type,
                createdBy: userId,
                createdDate: new Date(),
              },
            });
            groupIdMap.set(oldGroupId, newGroup.id);

            if (group.restrictedToRoles.length > 0) {
              await tx.roleOnGroup.createMany({
                data: group.restrictedToRoles.map((role) => ({
                  groupId: newGroup.id,
                  roleId: role.roleId,
                })),
              });
            }

            for (const layer of group.layers) {
              const createdLayer = await tx.layerInstance.create({
                data: {
                  displayLayerId: layer.displayLayerId,
                  searchLayerId: layer.searchLayerId,
                  editingLayerId: layer.editingLayerId,
                  mapId: newMap.id,
                  groupId: newGroup.id,
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

          const groupsOnMapsIdMap = new Map<string, string>();
          const pendingGroupsOnMaps = [...source.groups];

          while (pendingGroupsOnMaps.length > 0) {
            const batch = pendingGroupsOnMaps.filter(
              (entry) =>
                !entry.parentGroupId ||
                groupsOnMapsIdMap.has(entry.parentGroupId)
            );

            if (batch.length === 0) {
              throw new HajkError(
                HttpStatusCodes.BAD_REQUEST,
                "Invalid groups-on-maps parent references in source map.",
                HajkStatusCodes.INVALID_REQUEST_BODY
              );
            }

            for (const entry of batch) {
              const newGroupOnMapId = randomUUID();
              const mappedGroupId = groupIdMap.get(entry.groupId);

              if (!mappedGroupId) {
                throw new HajkError(
                  HttpStatusCodes.BAD_REQUEST,
                  `Group "${entry.groupId}" referenced by map "${sourceMapName}" could not be duplicated.`,
                  HajkStatusCodes.INVALID_REQUEST_BODY
                );
              }

              await tx.groupsOnMaps.create({
                data: {
                  id: newGroupOnMapId,
                  mapName: name,
                  groupId: mappedGroupId,
                  parentGroupId: entry.parentGroupId
                    ? (groupsOnMapsIdMap.get(entry.parentGroupId) ?? null)
                    : null,
                  usage: entry.usage,
                  name: entry.name,
                  toggled: entry.toggled,
                  expanded: entry.expanded,
                },
              });
              groupsOnMapsIdMap.set(entry.id, newGroupOnMapId);
            }

            for (const entry of batch) {
              const index = pendingGroupsOnMaps.indexOf(entry);
              if (index !== -1) {
                pendingGroupsOnMaps.splice(index, 1);
              }
            }
          }
        }

        if (includeLayers) {
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

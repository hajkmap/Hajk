import { GroupType, Prisma, UseType } from "@prisma/client";

import log4js from "log4js";
import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";
import {
  activeLayerInstanceWhere,
  layerInstanceIncludeAll,
} from "../utils/layer-instance.ts";
import {
  buildGroupCompositionMap,
  computeGroupCompositionStats,
} from "../utils/group-composition.ts";

const logger = log4js.getLogger("service.v3.layer");

export type LayerSwitcherTreeNode =
  | { type: "layer"; id: string }
  | {
      type: "group";
      id: string;
      name: string;
      children: LayerSwitcherTreeNode[];
    };

const LAYER_SWITCHER_TREE_OPTIONS_KEY = "layerSwitcherTree";

const groupInclude = {
  restrictedToRoles: {
    include: { role: true },
  },
} as const;

function omitLayerSwitcherTree(
  options: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(options).filter(
      ([key]) => key !== LAYER_SWITCHER_TREE_OPTIONS_KEY
    )
  );
}

interface GroupLayerInput {
  layerId: string;
  usage?: UseType;
  infoClickActive?: boolean;
  visibleAtStart?: boolean;
  zIndex?: number;
  options?: Prisma.InputJsonValue;
}

interface RoleOnGroupInput {
  roleId: string;
}

interface GroupsOnMapInput {
  id?: string;
  mapName: string;
  groupId?: string;
  parentGroupId?: string | null;
  usage: UseType;
  name: string;
  toggled?: boolean;
  expanded?: boolean;
}

interface GroupWriteData
  extends Omit<Prisma.GroupCreateInput, "layers" | "restrictedToRoles" | "maps"> {
  layers?: GroupLayerInput[];
  layerSwitcherTree?: LayerSwitcherTreeNode[];
  restrictedToRoles?: RoleOnGroupInput[];
  maps?: GroupsOnMapInput[];
  type?: GroupType;
}

interface GroupLayersUpdateData {
  layers: GroupLayerInput[];
  layerSwitcherTree?: LayerSwitcherTreeNode[];
}

function extractLayerSwitcherTree(
  options: Prisma.JsonValue | null | undefined
): LayerSwitcherTreeNode[] | undefined {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return undefined;
  }
  const tree = (options as Record<string, unknown>)[
    LAYER_SWITCHER_TREE_OPTIONS_KEY
  ];
  return Array.isArray(tree) ? (tree as LayerSwitcherTreeNode[]) : undefined;
}

function buildLayerInstanceOptions(
  layer: GroupLayerInput,
  index: number,
  layerSwitcherTree?: LayerSwitcherTreeNode[]
): Prisma.InputJsonValue {
  const base =
    layer.options &&
    typeof layer.options === "object" &&
    !Array.isArray(layer.options)
      ? { ...(layer.options as Record<string, unknown>) }
      : {};

  if (index === 0 && layerSwitcherTree?.length) {
    return {
      ...base,
      [LAYER_SWITCHER_TREE_OPTIONS_KEY]: layerSwitcherTree,
    };
  }

  if (LAYER_SWITCHER_TREE_OPTIONS_KEY in base) {
    return omitLayerSwitcherTree(base);
  }

  return base;
}

const buildLayerInstances = (
  layers: GroupLayerInput[],
  groupType: GroupType,
  layerSwitcherTree?: LayerSwitcherTreeNode[]
) =>
  layers.map((layer, index) => ({
    usage: layer.usage ?? UseType.FOREGROUND,
    infoClickActive: layer.infoClickActive ?? true,
    visibleAtStart: layer.visibleAtStart ?? false,
    zIndex: layer.zIndex ?? index,
    options: buildLayerInstanceOptions(layer, index, layerSwitcherTree),
    ...(groupType === GroupType.Search
      ? { searchLayerId: layer.layerId }
      : { displayLayerId: layer.layerId }),
  }));

const buildRoleConnections = (roles: RoleOnGroupInput[]) =>
  roles.map((role) => ({
    role: { connect: { id: role.roleId } },
  }));

async function syncGroupsOnMaps(
  transaction: Prisma.TransactionClient,
  groupId: string,
  maps: GroupsOnMapInput[]
) {
  await transaction.groupsOnMaps.deleteMany({ where: { groupId } });

  if (maps.length === 0) {
    return;
  }

  const pending = [...maps];
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
      const created = await transaction.groupsOnMaps.create({
        data: {
          id: entry.id,
          mapName: entry.mapName,
          groupId,
          parentGroupId: entry.parentGroupId ?? null,
          usage: entry.usage,
          name: entry.name,
          toggled: entry.toggled ?? false,
          expanded: entry.expanded ?? false,
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

class GroupsService {
  constructor() {
    logger.debug("Initiating Groups Service");
  }

  private async requireGroup(id: string) {
    const group = await prisma.group.findUnique({ where: { id } });
    if (group === null) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No group with id: ${id} could be found.`,
        HajkStatusCodes.UNKNOWN_GROUP_ID
      );
    }
    return group;
  }

  async getGroups() {
    const groups = await prisma.group.findMany({ orderBy: { name: "asc" } });

    if (groups.length === 0) {
      return [];
    }

    const groupIds = groups.map((group) => group.id);
    const instances = await prisma.layerInstance.findMany({
      where: {
        AND: [{ groupId: { in: groupIds } }, activeLayerInstanceWhere],
      },
      select: {
        groupId: true,
        options: true,
        displayLayerId: true,
        searchLayerId: true,
        editingLayerId: true,
      },
      orderBy: { zIndex: "asc" },
    });

    const treeByGroupId = buildGroupCompositionMap(instances);
    const directLayerCountByGroupId = new Map<string, number>();

    for (const instance of instances) {
      if (!instance.groupId) continue;
      directLayerCountByGroupId.set(
        instance.groupId,
        (directLayerCountByGroupId.get(instance.groupId) ?? 0) + 1
      );
    }

    return groups.map((group) => {
      const tree = treeByGroupId.get(group.id);
      const directLayerCount = directLayerCountByGroupId.get(group.id) ?? 0;
      const composition = computeGroupCompositionStats(tree, directLayerCount);

      return {
        ...group,
        layerCount: composition.layerCount,
        nestedGroupCount: composition.nestedGroupCount,
        nestingLevel: composition.nestingLevel,
      };
    });
  }

  async getGroupById(id: string) {
    return await prisma.group.findUnique({
      where: { id },
      include: groupInclude,
    });
  }

  async getLayersByGroupId(id: string) {
    const instances = await prisma.layerInstance.findMany({
      where: {
        AND: [{ groupId: id }, activeLayerInstanceWhere],
      },
      include: layerInstanceIncludeAll,
      orderBy: { zIndex: "asc" },
    });

    let layerSwitcherTree: LayerSwitcherTreeNode[] | undefined;

    for (const instance of instances) {
      const tree = extractLayerSwitcherTree(instance.options);
      if (tree?.length) {
        layerSwitcherTree = tree;
        break;
      }
    }

    const layers = instances
      .map((instance) => {
        const placementOptions =
          instance.options &&
          typeof instance.options === "object" &&
          !Array.isArray(instance.options)
            ? { ...(instance.options as Record<string, unknown>) }
            : {};

        const cleanedPlacementOptions = omitLayerSwitcherTree(placementOptions);

        const baseLayer = instance.displayLayer
          ? { ...instance.displayLayer, layerKind: "display" as const }
          : instance.searchLayer
            ? { ...instance.searchLayer, layerKind: "search" as const }
            : instance.editingLayer
              ? { ...instance.editingLayer, layerKind: "editing" as const }
              : null;

        if (!baseLayer) return null;

        return {
          ...baseLayer,
          drawOrder: instance.zIndex,
          visibleAtStart: instance.visibleAtStart,
          placementOptions: cleanedPlacementOptions,
        };
      })
      .filter((layer): layer is NonNullable<typeof layer> => layer !== null);

    return { layers, layerSwitcherTree };
  }

  async getMapsByGroupId(id: string) {
    const maps = await prisma.map.findMany({
      select: {
        id: true,
        name: true,
      },
      where: { groups: { some: { groupId: id } } },
    });

    return maps;
  }

  async createGroup(data: GroupWriteData, userId?: string) {
    const {
      layers = [],
      layerSwitcherTree,
      restrictedToRoles = [],
      maps,
      ...groupData
    } = data;
    const groupType = groupData.type ?? GroupType.Layer;
    const layerInstances = buildLayerInstances(
      layers,
      groupType,
      layerSwitcherTree
    );
    const roleConnections = buildRoleConnections(restrictedToRoles);

    return await prisma.$transaction(async (transaction) => {
      const group = await transaction.group.create({
        data: {
          ...groupData,
          createdBy: userId,
          createdDate: new Date(),
          lastSavedBy: userId,
          lastSavedDate: new Date(),
          ...(layerInstances.length > 0 && {
            layers: { create: layerInstances },
          }),
          ...(roleConnections.length > 0 && {
            restrictedToRoles: { create: roleConnections },
          }),
        },
      });

      if (maps !== undefined) {
        await syncGroupsOnMaps(transaction, group.id, maps);
      }

      return transaction.group.findUnique({
        where: { id: group.id },
        include: groupInclude,
      });
    });
  }

  async updateGroupLayers(
    id: string,
    data: GroupLayersUpdateData,
    userId?: string
  ) {
    const existingGroup = await this.requireGroup(id);
    const layerInstances = buildLayerInstances(
      data.layers,
      existingGroup.type,
      data.layerSwitcherTree
    );

    return await prisma.group.update({
      where: { id },
      data: {
        lastSavedBy: userId,
        lastSavedDate: new Date(),
        layers: {
          deleteMany: {},
          create: layerInstances,
        },
      },
      include: groupInclude,
    });
  }

  async updateGroup(id: string, data: GroupWriteData, userId?: string) {
    const { layers, layerSwitcherTree, restrictedToRoles, maps, ...groupData } =
      data;

    return await prisma.$transaction(async (transaction) => {
      const existingGroup = await transaction.group.findUnique({
        where: { id },
      });

      if (existingGroup === null) {
        throw new HajkError(
          HttpStatusCodes.NOT_FOUND,
          `No group with id: ${id} could be found.`,
          HajkStatusCodes.UNKNOWN_GROUP_ID
        );
      }

      const groupType = groupData.type ?? existingGroup.type;
      const layerInstances =
        layers !== undefined
          ? buildLayerInstances(layers, groupType, layerSwitcherTree)
          : undefined;
      const roleConnections =
        restrictedToRoles !== undefined
          ? buildRoleConnections(restrictedToRoles)
          : undefined;

      await transaction.group.update({
        where: { id },
        data: {
          ...groupData,
          lastSavedBy: userId,
          lastSavedDate: new Date(),
          ...(layerInstances !== undefined && {
            layers: {
              deleteMany: {},
              create: layerInstances,
            },
          }),
          ...(roleConnections !== undefined && {
            restrictedToRoles: {
              deleteMany: {},
              create: roleConnections,
            },
          }),
        },
      });

      if (maps !== undefined) {
        await syncGroupsOnMaps(transaction, id, maps);
      }

      return transaction.group.findUnique({
        where: { id },
        include: groupInclude,
      });
    });
  }

  async deleteGroup(id: string) {
    await this.requireGroup(id);

    await prisma.$transaction(async (transaction) => {
      // Collect every GroupsOnMaps placement that must be removed: the group's
      // own placements plus their entire subtree (children referencing a
      // deleted placement via parentGroupId), so no orphaned nodes remain.
      const rootPlacements = await transaction.groupsOnMaps.findMany({
        where: { groupId: id },
        select: { id: true },
      });

      const placementIdsToDelete = new Set<string>(
        rootPlacements.map((placement) => placement.id)
      );

      let frontier = [...placementIdsToDelete];
      while (frontier.length > 0) {
        const children = await transaction.groupsOnMaps.findMany({
          where: { parentGroupId: { in: frontier } },
          select: { id: true },
        });

        const newIds = children
          .map((child) => child.id)
          .filter((childId) => !placementIdsToDelete.has(childId));

        newIds.forEach((childId) => placementIdsToDelete.add(childId));
        frontier = newIds;
      }

      // Remove the placements (whole subtree at once; Postgres resolves the
      // self-referencing FK within the single statement).
      if (placementIdsToDelete.size > 0) {
        await transaction.groupsOnMaps.deleteMany({
          where: { id: { in: [...placementIdsToDelete] } },
        });
      }

      // Remove the group's own layer instances and role restrictions.
      await transaction.layerInstance.deleteMany({ where: { groupId: id } });
      await transaction.roleOnGroup.deleteMany({ where: { groupId: id } });

      // Finally remove the group itself.
      await transaction.group.delete({ where: { id } });
    });
  }
}

export default new GroupsService();

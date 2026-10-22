import { GroupType, Prisma } from "@prisma/client";

import log4js from "log4js";
import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";
import { activeLayerInstanceWhere } from "../utils/layer-instance.ts";
import LayerTreeService from "./layer-tree.service.ts";

const logger = log4js.getLogger("service.v3.layer");

const groupInclude = {
  restrictedToRoles: {
    include: { role: true },
  },
} as const;

interface GroupLayerInput {
  layerId: string;
}

interface RoleOnGroupInput {
  roleId: string;
}

interface GroupWriteData
  extends Omit<Prisma.GroupCreateInput, "layers" | "restrictedToRoles"> {
  /**
   * On creation: a layer group's first layers (its content, edited in its
   * tree afterwards), or a search group's layers.
   */
  layers?: GroupLayerInput[];
  restrictedToRoles?: RoleOnGroupInput[];
  type?: GroupType;
}

interface GroupCompositionStats {
  layerCount: number;
  nestedGroupCount: number;
  nestingLevel: number;
}

const buildRoleConnections = (roles: RoleOnGroupInput[]) =>
  roles.map((role) => ({
    role: { connect: { id: role.roleId } },
  }));

/**
 * What each group holds in its own tree, its linked groups' content included:
 * layers and groups (each time they occur) and how deep the groups go.
 */
function compositionStats(
  items: { groupId: string; displayLayerId: string | null; childGroupId: string | null }[]
): (groupId: string) => GroupCompositionStats {
  const itemsByGroup = new Map<string, typeof items>();
  for (const item of items) {
    itemsByGroup.set(item.groupId, [...(itemsByGroup.get(item.groupId) ?? []), item]);
  }
  return (groupId) => {
    let layerCount = 0;
    let nestedGroupCount = 0;
    let depth = 0;
    const walk = (id: string, level: number, path: Set<string>) => {
      for (const item of itemsByGroup.get(id) ?? []) {
        if (item.displayLayerId) {
          layerCount += 1;
        } else if (item.childGroupId && !path.has(item.childGroupId)) {
          nestedGroupCount += 1;
          depth = Math.max(depth, level);
          walk(item.childGroupId, level + 1, new Set(path).add(item.childGroupId));
        }
      }
    };
    walk(groupId, 1, new Set([groupId]));
    return { layerCount, nestedGroupCount, nestingLevel: depth + 1 };
  };
}

class GroupsService {
  constructor() {
    logger.debug("Initiating Groups Service");
  }

  private async requireGroup(id: string) {
    const group = await prisma.group.findFirst({
      where: { id, deletedAt: null },
    });
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
    const groups = await prisma.group.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });

    if (groups.length === 0) {
      return [];
    }

    // A layer group's content is its tree; a search group's, its layers.
    const [items, searchInstances] = await Promise.all([
      prisma.groupItem.findMany({
        where: {
          group: { deletedAt: null },
          OR: [
            { displayLayer: { deletedAt: null } },
            { childGroup: { deletedAt: null } },
          ],
        },
        orderBy: { index: "asc" },
        select: { groupId: true, displayLayerId: true, childGroupId: true },
      }),
      prisma.layerInstance.findMany({
        where: {
          AND: [
            { groupId: { in: groups.map((group) => group.id) } },
            activeLayerInstanceWhere,
          ],
        },
        select: { groupId: true },
      }),
    ]);
    const statsOf = compositionStats(items);
    const searchLayerCount = new Map<string, number>();
    for (const { groupId } of searchInstances) {
      if (!groupId) continue;
      searchLayerCount.set(groupId, (searchLayerCount.get(groupId) ?? 0) + 1);
    }

    return groups.map((group) => ({
      ...group,
      ...(group.type === GroupType.Search
        ? {
            layerCount: searchLayerCount.get(group.id) ?? 0,
            nestedGroupCount: 0,
            nestingLevel: 1,
          }
        : statsOf(group.id)),
    }));
  }

  async getGroupById(id: string) {
    const group = await prisma.group.findFirst({
      where: { id, deletedAt: null },
      include: groupInclude,
    });

    return group;
  }

  /** The maps whose tree shows the group, wherever in it. */
  async getMapsByGroupId(id: string) {
    await this.requireGroup(id);

    const contents = await LayerTreeService.getMapContents();
    const mapNames = [...contents]
      .filter(([, content]) => content.groups.has(id))
      .map(([mapName]) => mapName);
    if (mapNames.length === 0) {
      return [];
    }
    return await prisma.map.findMany({
      select: { id: true, name: true },
      where: { name: { in: mapNames }, deletedAt: null },
    });
  }

  async createGroup(data: GroupWriteData, userId?: string) {
    const { layers = [], restrictedToRoles = [], ...groupData } = data;
    const groupType = groupData.type ?? GroupType.Layer;
    const layerIds = [...new Set(layers.map((layer) => layer.layerId))];
    const roleConnections = buildRoleConnections(restrictedToRoles);

    return await prisma.$transaction(async (transaction) => {
      const group = await transaction.group.create({
        data: {
          ...groupData,
          createdBy: userId,
          createdDate: new Date(),
          lastSavedBy: userId,
          lastSavedDate: new Date(),
          ...(layerIds.length > 0 &&
            (groupType === GroupType.Search
              ? {
                  layers: {
                    create: layerIds.map((searchLayerId, index) => ({
                      searchLayerId,
                      zIndex: index,
                    })),
                  },
                }
              : {
                  items: {
                    create: layerIds.map((displayLayerId, index) => ({
                      displayLayerId,
                      index,
                    })),
                  },
                })),
          ...(roleConnections.length > 0 && {
            restrictedToRoles: { create: roleConnections },
          }),
        },
      });

      return transaction.group.findUnique({
        where: { id: group.id },
        include: groupInclude,
      });
    });
  }

  /** The group's own fields; a layer group's content is saved with its tree. */
  async updateGroup(
    id: string,
    data: Omit<GroupWriteData, "layers">,
    userId?: string
  ) {
    const { restrictedToRoles, ...groupData } = data;

    return await prisma.$transaction(async (transaction) => {
      const existingGroup = await transaction.group.findFirst({
        where: { id, deletedAt: null },
      });

      if (existingGroup === null) {
        throw new HajkError(
          HttpStatusCodes.NOT_FOUND,
          `No group with id: ${id} could be found.`,
          HajkStatusCodes.UNKNOWN_GROUP_ID
        );
      }

      const roleConnections =
        restrictedToRoles !== undefined
          ? buildRoleConnections(restrictedToRoles)
          : undefined;

      await transaction.group.update({
        where: { id },
        data: {
          ...groupData,
          // Raised only by saves of the group's tree, whatever the body holds.
          treeVersion: undefined,
          lastSavedBy: userId,
          lastSavedDate: new Date(),
          ...(roleConnections !== undefined && {
            restrictedToRoles: {
              deleteMany: {},
              create: roleConnections,
            },
          }),
        },
      });

      return transaction.group.findUnique({
        where: { id },
        include: groupInclude,
      });
    });
  }

  async deleteGroup(id: string) {
    await this.requireGroup(id);

    // The group's places in trees stay as they are; the trees leave deleted
    // groups out.
    await prisma.$transaction(async (transaction) => {
      await transaction.layerInstance.deleteMany({ where: { groupId: id } });
      await transaction.roleOnGroup.deleteMany({ where: { groupId: id } });

      await transaction.mapTreeItem.deleteMany({ where: { groupId: id } });
      await transaction.mapGroupSetting.deleteMany({ where: { groupId: id } });
      await transaction.mapLayerSetting.deleteMany({ where: { groupId: id } });
      await transaction.mapGroupException.deleteMany({
        where: {
          OR: [{ groupId: id }, { childGroupId: id }],
        },
      });

      await transaction.groupNestedItem.deleteMany({
        where: {
          OR: [
            { ownerGroupId: id },
            { groupId: id },
            { childGroupId: id },
          ],
        },
      });
      await transaction.groupItem.deleteMany({
        where: {
          OR: [{ groupId: id }, { childGroupId: id }],
        },
      });

      const deletedAt = new Date();

      await transaction.group.updateMany({
        where: { id, deletedAt: null },
        data: { deletedAt, lastSavedDate: deletedAt },
      });
    });
  }

  async getDeletedGroups() {
    return prisma.group.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
    });
  }

  async restoreGroup(id: string, userId?: string) {
    const group = await prisma.group.findFirst({
      where: { id, deletedAt: { not: null } },
    });

    if (!group) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No deleted group with id: ${id} could be found.`,
        HajkStatusCodes.UNKNOWN_GROUP_ID
      );
    }

    return prisma.group.update({
      where: { id },
      data: {
        deletedAt: null,
        lastSavedBy: userId,
        lastSavedDate: new Date(),
      },
      include: groupInclude,
    });
  }
}

export default new GroupsService();

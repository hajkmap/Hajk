import { Prisma } from "@prisma/client";

import log4js from "log4js";
import prisma from "../../../common/prisma.ts";

const logger = log4js.getLogger("service.v3.layer");

class GroupsService {
  constructor() {
    logger.debug("Initiating Groups Service");
  }

  async getGroups() {
    return await prisma.group.findMany();
  }

  async getGroupById(id: string) {
    const group = await prisma.group.findUnique({
      where: { id },
    });

    return group;
  }

  async getLayersByGroupId(id: string) {
    const layers = await prisma.layer.findMany({
      where: { groups: { some: { groupId: id } } },
    });

    return layers;
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
  async createGroup(data: Prisma.GroupCreateInput, userId?: string) {
    return await prisma.group.create({
      data: {
        ...data,
        createdBy: userId,
        createdDate: new Date(),
        lastSavedBy: userId,
        lastSavedDate: new Date(),
      },
    });
  }
  async updateGroup(
    id: string,
    data: Prisma.GroupUpdateInput,
    userId?: string
  ) {
    return await prisma.group.update({
      where: { id },
      data: {
        ...data,
        lastSavedBy: userId,
        lastSavedDate: new Date(),
      },
    });
  }
  async deleteGroup(id: string) {
    return await prisma.group.delete({
      where: { id },
    });
  }
}

export default new GroupsService();

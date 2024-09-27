import { PrismaClient } from "@prisma/client";

import log4js from "log4js";

const logger = log4js.getLogger("service.v3.layer");
const prisma = new PrismaClient();

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
      where: { groups: { some: { groupId: id } } },
    });

    return maps;
  }
}

export default new GroupsService();

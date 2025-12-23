import { PrismaClient, Prisma } from "@prisma/client";

import log4js from "log4js";

const logger = log4js.getLogger("service.v3.tool");
const prisma = new PrismaClient();

class ToolService {
  constructor() {
    logger.debug("Initiating Tool Service");
  }

  async getTools() {
    return await prisma.tool.findMany();
  }

  async isToolTypeValid(toolType: string) {
    return await prisma.tool.findFirstOrThrow({ where: { type: toolType } });
  }

  async getMapsWithTool(toolName: string) {
    const maps = await prisma.map.findMany({
      select: { name: true, id: true },
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

    return maps;
  }

  async createTool(data: Prisma.ToolCreateInput, userId?: string) {
    return await prisma.tool.create({
      data: {
        ...data,
        createdBy: userId,
        createdDate: new Date(),
        lastSavedBy: userId,
        lastSavedDate: new Date(),
      },
    });
  }

  async updateTool(id: number, data: Prisma.ToolUpdateInput, userId?: string) {
    return await prisma.tool.update({
      where: { id },
      data: {
        ...data,
        lastSavedBy: userId,
        lastSavedDate: new Date(),
      },
    });
  }

  async deleteTool(id: number) {
    return await prisma.tool.delete({
      where: { id },
    });
  }
}

export default new ToolService();

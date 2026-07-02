import { Prisma } from "@prisma/client";

import log4js from "log4js";
import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";

const logger = log4js.getLogger("service.v3.tool");

class ToolService {
  constructor() {
    logger.debug("Initiating Tool Service");
  }

  async getTools() {
    return await prisma.tool.findMany({
      where: { deletedAt: null },
      orderBy: { type: "asc" },
      include: {
        maps: {
          // Count maps where the tool is enabled. Inactive rows are kept to
          // preserve placement but should not count as "used".
          where: { active: true },
          select: { mapName: true },
        },
      },
    });
  }

  async getToolTypes() {
    return await prisma.toolType.findMany({ orderBy: { type: "asc" } });
  }

  async isToolTypeValid(toolType: string) {
    return await prisma.toolType.findFirstOrThrow({
      where: { type: toolType },
    });
  }

  async getMapsWithTool(toolName: string) {
    const maps = await prisma.map.findMany({
      select: { name: true, id: true },
      where: {
        tools: {
          some: {
            target: { not: null },
            tool: {
              type: toolName,
              deletedAt: null,
            },
          },
        },
      },
    });

    return maps;
  }

  async createTool(data: Prisma.ToolUncheckedCreateInput, userId?: string) {
    const toolType = await prisma.toolType.findUnique({
      where: { type: data.type },
    });

    if (!toolType) {
      throw new HajkError(
        HttpStatusCodes.BAD_REQUEST,
        `Tool type "${data.type}" does not exist.`,
        HajkStatusCodes.UNKNOWN_TOOL_TYPE
      );
    }

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

  // Soft delete — the row is kept (with its ToolsOnMaps placements) so the
  // tool can be restored with its full configuration.
  async deleteTool(id: number, userId?: string) {
    return await prisma.tool.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        lastSavedBy: userId,
        lastSavedDate: new Date(),
      },
    });
  }
}

export default new ToolService();

import { Prisma } from "@prisma/client";

import log4js from "log4js";
import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";
import { isToolPlaced } from "../utils/tool-placement.ts";

const logger = log4js.getLogger("service.v3.tool");

/** Plugins the client no longer has. Existing instances keep working, but new
 * ones can't be created. */
const DEPRECATED_TOOL_TYPES = ["measure"];

/** One catalog instance, created by the seed. It cannot be created or deleted. */
const SINGLETON_TOOL_TYPES = ["commandpalette"];

class ToolService {
  constructor() {
    logger.debug("Initiating Tool Service");
  }

  async getTools() {
    return await prisma.toolInstance.findMany({
      where: {
        deletedAt: null,
        type: { notIn: DEPRECATED_TOOL_TYPES },
      },
      orderBy: { type: "asc" },
      include: {
        maps: {
          // Count maps where the tool is enabled. Inactive rows are kept to
          // preserve placement but should not count as "used".
          where: { active: true, map: { deletedAt: null } },
          select: { mapName: true },
        },
      },
    });
  }

  async getToolTypes() {
    return await prisma.toolType.findMany({
      where: {
        type: { notIn: [...DEPRECATED_TOOL_TYPES, ...SINGLETON_TOOL_TYPES] },
      },
      orderBy: { type: "asc" },
    });
  }

  async isToolTypeValid(toolType: string) {
    return await prisma.toolType.findFirstOrThrow({
      where: { type: toolType },
    });
  }

  async getMapsWithTool(toolName: string) {
    const toolWhere = { tool: { type: toolName, deletedAt: null } };
    const maps = await prisma.map.findMany({
      select: {
        name: true,
        id: true,
        tools: { where: toolWhere, select: { options: true } },
      },
      where: {
        deletedAt: null,
        tools: { some: toolWhere },
      },
    });

    return maps
      .filter((map) => map.tools.some((tool) => isToolPlaced(tool.options)))
      .map(({ name, id }) => ({ name, id }));
  }

  async createTool(
    data: Prisma.ToolInstanceUncheckedCreateInput,
    userId?: string
  ) {
    const toolType = await prisma.toolType.findUnique({
      where: { type: data.type },
    });

    if (!toolType || DEPRECATED_TOOL_TYPES.includes(data.type)) {
      throw new HajkError(
        HttpStatusCodes.BAD_REQUEST,
        `Tool type "${data.type}" does not exist.`,
        HajkStatusCodes.UNKNOWN_TOOL_TYPE
      );
    }

    if (SINGLETON_TOOL_TYPES.includes(data.type)) {
      throw new HajkError(
        HttpStatusCodes.BAD_REQUEST,
        `Tool type "${data.type}" already exists and cannot be created again.`,
        HajkStatusCodes.UNKNOWN_TOOL_TYPE
      );
    }

    return await prisma.toolInstance.create({
      data: {
        ...data,
        createdBy: userId,
        createdDate: new Date(),
        lastSavedBy: userId,
        lastSavedDate: new Date(),
      },
    });
  }

  async updateTool(
    id: number,
    data: Prisma.ToolInstanceUpdateInput,
    userId?: string
  ) {
    return await prisma.toolInstance.update({
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
    const tool = await prisma.toolInstance.findUnique({ where: { id } });
    if (tool && SINGLETON_TOOL_TYPES.includes(tool.type)) {
      throw new HajkError(
        HttpStatusCodes.BAD_REQUEST,
        `Tool type "${tool.type}" cannot be deleted.`,
        HajkStatusCodes.UNKNOWN_TOOL_TYPE
      );
    }

    return await prisma.toolInstance.update({
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

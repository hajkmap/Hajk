import { PrismaClient } from "@prisma/client";

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
      select: { name: true },
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

    // Transform the [{name: "map1"}, {name: "map2"}] to ["map1", "map2"]
    return maps.map((m) => m.name);
  }
}

export default new ToolService();

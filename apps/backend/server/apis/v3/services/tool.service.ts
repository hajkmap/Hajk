import { PrismaClient } from "@prisma/client";

import log4js from "log4js";

const logger = log4js.getLogger("service.v3.tool");
const prisma = new PrismaClient();

class ToolService {
  constructor() {
    logger.debug("Initiating Tool Service");
  }

  async getTools() {
    try {
      return await prisma.tool.findMany();
    } catch (error) {
      return { error };
    }
  }

  async getMapsWithTool(toolName: string) {
    try {
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
      return maps.map((m) => m.name);
    } catch (error) {
      return { error };
    }
  }
}

export default new ToolService();

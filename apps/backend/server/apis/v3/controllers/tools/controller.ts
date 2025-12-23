import type { Request, Response } from "express";
import ToolService from "../../services/tool.service.ts";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import { HajkError } from "../../../../common/classes.ts";
import HajkStatusCodes from "../../../../common/hajk-status-codes.ts";

class ToolsController {
  async getTools(_: Request, res: Response) {
    const tools = await ToolService.getTools();
    res.status(HttpStatusCodes.OK).json({ count: tools.length, tools });
  }

  async getMapsWithTool(req: Request, res: Response) {
    try {
      // This will throw if the tool type is not valid.
      await ToolService.isToolTypeValid(req.params.toolName);
    } catch (error) {
      const e = new HajkError(
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        `Tool type "${req.params.toolName}" does not exist in the database.`,
        HajkStatusCodes.UNKNOWN_TOOL_TYPE
      );
      e.cause = error;
      throw e;
    }

    // If we got this far, let's see which maps use this tool.
    const mapsWithTool = await ToolService.getMapsWithTool(req.params.toolName);

    res
      .status(HttpStatusCodes.OK)
      .json({ count: mapsWithTool.length, maps: mapsWithTool });
  }

  async createTool(req: Request, res: Response) {
    const tool = await ToolService.createTool(req.body, req.user?.id);
    res.status(HttpStatusCodes.CREATED).json(tool);
  }

  async updateTool(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    const tool = await ToolService.updateTool(id, req.body, req.user?.id);
    res.status(HttpStatusCodes.OK).json(tool);
  }

  async deleteTool(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    await ToolService.deleteTool(id);
    res.status(HttpStatusCodes.NO_CONTENT).send();
  }
}
export default new ToolsController();

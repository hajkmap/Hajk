import type { Request, Response } from "express";

import HttpStatusCodes from "../../../../common/HttpStatusCodes.ts";
import ToolService from "../../services/tool.service.ts";

class ToolsController {
  async getTools(_: Request, res: Response) {
    const tools = await ToolService.getTools();
    return res.status(HttpStatusCodes.OK).json({ tools });
  }

  async getMapsWithTool(req: Request, res: Response) {
    // This will throw if the tool type is not valid.
    await ToolService.isToolTypeValid(req.params.toolName);

    // If we got this far, let's see which maps use this tool.
    const mapsWithTool = await ToolService.getMapsWithTool(req.params.toolName);

    return res.status(HttpStatusCodes.OK).json({ mapsWithTools: mapsWithTool });
  }
}
export default new ToolsController();

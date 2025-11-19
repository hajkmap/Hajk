import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import PublicService from "../../services/public.service.ts";

import type { Request, Response } from "express";

class PublicController {
  async getClientConfigForMap(req: Request, res: Response) {
    const mapConfig = await PublicService.getClientConfigForMap(
      req.params.mapName,
      req.user
    );

    res.status(HttpStatusCodes.OK).json(mapConfig);
  }
}
export default new PublicController();

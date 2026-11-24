import type { Request, Response } from "express";

import OgcService from "../../services/ogc.service.ts";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import { asyncHandler } from "../../utils/async-handler.ts";
import { adUserOf } from "../../utils/user-name.ts";

const fieldsOf = (req: Request) =>
  typeof req.query.fields === "string" ? req.query.fields : undefined;

class OgcController {
  listWfstLayers = asyncHandler(async (req: Request, res: Response) => {
    const layers = await OgcService.listWfstLayers(
      adUserOf(res),
      fieldsOf(req)
    );
    res.status(HttpStatusCodes.OK).json({ count: layers.length, layers });
  });

  getWfstLayer = asyncHandler(async (req: Request, res: Response) => {
    const layer = await OgcService.getWfstLayer(
      String(req.params.id),
      adUserOf(res),
      fieldsOf(req)
    );
    res.status(HttpStatusCodes.OK).json(layer);
  });
}

export default new OgcController();

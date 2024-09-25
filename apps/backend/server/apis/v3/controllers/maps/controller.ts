import { HajkError } from "../../../../common/classes.ts";
import HajkStatusCodes from "../../../../common/hajk-status-codes.ts";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import MapService from "../../services/map.service.ts";

import type { Request, Response } from "express";

class MapsController {
  async getMaps(_: Request, res: Response) {
    const maps = await MapService.getMapNames();
    return res.status(HttpStatusCodes.OK).json({ maps });
  }

  async getMapByName(req: Request, res: Response) {
    const mapConfig = await MapService.getMapByName(req.params.mapName);

    // If map is null, it's because the supplied map name doesn't exist.
    // Let's throw an error.
    if (mapConfig === null) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `"${req.params.mapName}" is not a valid map`,
        HajkStatusCodes.UNKNOWN_MAP_NAME
      );
    }

    return res.status(HttpStatusCodes.OK).json(mapConfig);
  }

  async getGroupsForMap(req: Request, res: Response) {
    const groups = await MapService.getGroupsForMap(req.params.mapName);
    return res.status(HttpStatusCodes.OK).json({ groups });
  }

  async getLayersForMap(req: Request, res: Response) {
    const layers = await MapService.getLayersForMap(req.params.mapName);
    return res.status(HttpStatusCodes.OK).json({ layers });
  }

  async getProjectionsForMap(req: Request, res: Response) {
    const projections = await MapService.getProjectionsForMap(
      req.params.mapName
    );
    return res.status(HttpStatusCodes.OK).json({ projections });
  }

  async getToolsForMap(req: Request, res: Response) {
    const tools = await MapService.getToolsForMap(req.params.mapName);
    return res.status(HttpStatusCodes.OK).json({ tools });
  }
}
export default new MapsController();

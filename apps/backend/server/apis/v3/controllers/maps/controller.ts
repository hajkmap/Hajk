import { RouteError } from "../../../../common/classes.ts";
import HttpStatusCodes from "../../../../common/HttpStatusCodes.ts";
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
      throw new RouteError(
        HttpStatusCodes.NOT_FOUND,
        `"${req.params.mapName}" is not a valid map`
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

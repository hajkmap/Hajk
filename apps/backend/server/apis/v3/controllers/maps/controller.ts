import HttpStatusCodes from "../../../../common/HttpStatusCodes.ts";
import MapService from "../../services/map.service.ts";

import type { Request, Response } from "express";

export class Controller {
  async getMaps(req: Request, res: Response) {
    const maps = await MapService.getMaps();
    return res.status(HttpStatusCodes.OK).json(maps);
  }

  async getMapByName(req: Request, res: Response) {
    const mapConfig = await MapService.getMapByName(req.params.mapName);
    return res.status(HttpStatusCodes.OK).json(mapConfig);
  }

  async getGroupsForMap(req: Request, res: Response) {
    const groups = await MapService.getGroupsForMap(req.params.mapName);
    return res.status(HttpStatusCodes.OK).json(groups);
  }

  async getLayersForMap(req: Request, res: Response) {
    const layers = await MapService.getLayersForMap(req.params.mapName);
    return res.status(HttpStatusCodes.OK).json(layers);
  }

  async getProjectionsForMap(req: Request, res: Response) {
    const projections = await MapService.getProjectionsForMap(
      req.params.mapName
    );
    return res.status(HttpStatusCodes.OK).json(projections);
  }

  async getToolsForMap(req: Request, res: Response) {
    const tools = await MapService.getToolsForMap(req.params.mapName);
    return res.status(HttpStatusCodes.OK).json(tools);
  }
}
export default new Controller();

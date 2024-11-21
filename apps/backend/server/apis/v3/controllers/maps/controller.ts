import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import MapService from "../../services/map.service.ts";

import type { Request, Response } from "express";

class MapsController {
  async getMaps(_: Request, res: Response) {
    const maps = await MapService.getMapNames();
    return res.status(HttpStatusCodes.OK).json({ count: maps.length, maps });
  }

  async getMapByName(req: Request, res: Response) {
    const mapConfig = await MapService.getMapByName(
      req.params.mapName,
      req.user
    );

    return res.status(HttpStatusCodes.OK).json(mapConfig);
  }

  async getGroupsForMap(req: Request, res: Response) {
    const groups = await MapService.getGroupsForMap(req.params.mapName);
    return res
      .status(HttpStatusCodes.OK)
      .json({ count: groups.length, groups });
  }

  async getLayersForMap(req: Request, res: Response) {
    const layers = await MapService.getLayersForMap(req.params.mapName);
    return res
      .status(HttpStatusCodes.OK)
      .json({ count: layers.length, layers });
  }

  async getProjectionsForMap(req: Request, res: Response) {
    const projections = await MapService.getProjectionsForMap(
      req.params.mapName
    );
    return res
      .status(HttpStatusCodes.OK)
      .json({ count: projections.length, projections });
  }

  async getToolsForMap(req: Request, res: Response) {
    const tools = await MapService.getToolsForMap(req.params.mapName);
    return res.status(HttpStatusCodes.OK).json({ count: tools.length, tools });
  }

  async createMap(req: Request, res: Response) {
    const map = await MapService.createMap(req.body);
    return res.status(HttpStatusCodes.CREATED).json(map);
  }

  async updateMap(req: Request, res: Response) {
    const map = await MapService.updateMap(req.params.mapName, req.body);
    return res.status(HttpStatusCodes.OK).json(map);
  }

  async deleteMap(req: Request, res: Response) {
    await MapService.deleteMap(req.params.mapName);
    return res.status(HttpStatusCodes.NO_CONTENT).send();
  }
}
export default new MapsController();

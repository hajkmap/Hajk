import MapService from "../../services/map.service.ts";
import handleStandardResponse from "../../utils/handleStandardResponse.ts";

import type { Request, Response } from "express";

export class Controller {
  getMaps(req: Request, res: Response) {
    MapService.getMaps().then((data) => handleStandardResponse(res, data));
  }

  getMapByName(req: Request, res: Response) {
    MapService.getMapByName(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  getGroupsForMap(req: Request, res: Response) {
    MapService.getGroupsForMap(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  getLayersForMap(req: Request, res: Response) {
    MapService.getLayersForMap(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  getProjectionsForMap(req: Request, res: Response) {
    MapService.getProjectionsForMap(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  getToolsForMap(req: Request, res: Response) {
    MapService.getToolsForMap(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }
}
export default new Controller();

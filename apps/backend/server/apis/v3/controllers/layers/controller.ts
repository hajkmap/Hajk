import type { Request, Response } from "express";
import LayerService from "../../services/layer.service.ts";
import handleStandardResponse from "../../utils/handleStandardResponse.ts";

export class Controller {
  getLayers(req: Request, res: Response) {
    LayerService.getLayers().then((data) => handleStandardResponse(res, data));
  }

  getLayerById(req: Request, res: Response) {
    LayerService.getLayerById(req.params.id).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  getLayerTypes(req: Request, res: Response) {
    LayerService.getLayerTypes().then((data) =>
      handleStandardResponse(res, data)
    );
  }

  getLayersByType(req: Request, res: Response) {
    LayerService.getLayersByType(req.params.type).then((data) =>
      handleStandardResponse(res, data)
    );
  }
}
export default new Controller();

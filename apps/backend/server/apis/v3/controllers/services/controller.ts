import type { Request, Response } from "express";

import ServicesService from "../../services/services.service.ts";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import { HajkError } from "../../../../common/classes.ts";
import HajkStatusCodes from "../../../../common/hajk-status-codes.ts";

class ServicesController {
  async getServices(_: Request, res: Response) {
    const services = await ServicesService.getServices();
    return res
      .status(HttpStatusCodes.OK)
      .json({ count: services.length, services });
  }

  async getServiceById(req: Request, res: Response) {
    const service = await ServicesService.getServiceById(req.params.id);
    if (service === null) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No service with id: ${req.params.id} could be found.`,
        HajkStatusCodes.UNKNOWN_SERVICE_ID
      );
    }

    return res.status(HttpStatusCodes.OK).json(service);
  }

  async getLayersByServiceId(req: Request, res: Response) {
    const layers = await ServicesService.getLayersByServiceId(req.params.id);
    return res
      .status(HttpStatusCodes.OK)
      .json({ count: layers.length, layers });
  }
}
export default new ServicesController();

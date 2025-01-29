import type { Request, Response } from "express";

import ServicesService from "../../services/services.service.ts";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import { HajkError } from "../../../../common/classes.ts";
import HajkStatusCodes from "../../../../common/hajk-status-codes.ts";

class ServicesController {
  async getServices(_: Request, res: Response) {
    const services = await ServicesService.getServices();
    res.status(HttpStatusCodes.OK).json({ count: services.length, services });
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

    res.status(HttpStatusCodes.OK).json(service);
  }

  async getLayersByServiceId(req: Request, res: Response) {
    const layers = await ServicesService.getLayersByServiceId(req.params.id);
    res.status(HttpStatusCodes.OK).json({ count: layers.length, layers });
  }

  async getMapsByServiceId(req: Request, res: Response) {
    const maps = await ServicesService.getMapsByServiceId(req.params.id);
    res.status(HttpStatusCodes.OK).json({ count: maps.length, maps });
  }

  async getAllProjections(req: Request, res: Response) {
    const projections = await ServicesService.getAllProjections();
    res
      .status(HttpStatusCodes.OK)
      .json({ count: projections.length, projections });
  }

  async createService(req: Request, res: Response) {
    const service = await ServicesService.createService(req.body);
    res.status(HttpStatusCodes.CREATED).json(service);
  }

  async updateService(req: Request, res: Response) {
    const service = await ServicesService.updateService(
      req.params.id,
      req.body
    );
    res.status(HttpStatusCodes.OK).json(service);
  }

  async deleteService(req: Request, res: Response) {
    await ServicesService.deleteService(req.params.id);
    res.status(HttpStatusCodes.NO_CONTENT).send();
  }
}
export default new ServicesController();

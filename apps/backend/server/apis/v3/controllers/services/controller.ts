import type { Request, Response } from "express";

import ServicesService from "../../services/services.service.ts";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import { HajkError } from "../../../../common/classes.ts";
import HajkStatusCodes from "../../../../common/hajk-status-codes.ts";
import type {
  ServiceCreateInput,
  ServiceUpdateInput,
} from "../../schemas/service.schemas.ts";
import { asyncHandler } from "../../utils/async-handler.ts";

class ServicesController {
  getServices = asyncHandler(async (_: Request, res: Response) => {
    const services = await ServicesService.getServices();
    res.status(HttpStatusCodes.OK).json({ count: services.length, services });
  });

  getServiceById = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServicesService.getServiceById(req.params.id);
    if (service === null) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No service with id: ${req.params.id} could be found.`,
        HajkStatusCodes.UNKNOWN_SERVICE_ID
      );
    }

    res.status(HttpStatusCodes.OK).json(service);
  });

  getLayersByServiceId = asyncHandler(async (req: Request, res: Response) => {
    const layers = await ServicesService.getLayersByServiceId(req.params.id);
    res.status(HttpStatusCodes.OK).json({ count: layers.length, layers });
  });

  getMapsByServiceId = asyncHandler(async (req: Request, res: Response) => {
    const maps = await ServicesService.getMapsByServiceId(req.params.id);
    res.status(HttpStatusCodes.OK).json({ count: maps.length, maps });
  });

  getAllProjections = asyncHandler(async (req: Request, res: Response) => {
    const projections = await ServicesService.getAllProjections();
    res
      .status(HttpStatusCodes.OK)
      .json({ count: projections.length, projections });
  });

  createService = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServicesService.createService(
      req.body as ServiceCreateInput
    );
    res.status(HttpStatusCodes.CREATED).json(service);
  });

  updateService = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServicesService.updateService(
      req.params.id,
      req.body as ServiceUpdateInput
    );
    res.status(HttpStatusCodes.OK).json(service);
  });

  deleteService = asyncHandler(async (req: Request, res: Response) => {
    await ServicesService.deleteService(req.params.id);
    res.status(HttpStatusCodes.NO_CONTENT).send();
  });
}
export default new ServicesController();

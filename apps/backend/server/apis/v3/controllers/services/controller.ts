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

  getLayerCountByServiceId = asyncHandler(
    async (req: Request, res: Response) => {
      const counts = await ServicesService.getLayerCountByServiceId(
        req.params.id,
      );
      res.status(HttpStatusCodes.OK).json(counts);
    },
  );

  getLayersByServiceId = asyncHandler(async (req: Request, res: Response) => {
    const layers = await ServicesService.getLayersByServiceId(req.params.id);
    res.status(HttpStatusCodes.OK).json({ count: layers.length, layers });
  });

  getRemoteCapabilityLayers = asyncHandler(
    async (req: Request, res: Response) => {
      const payload = await ServicesService.getRemoteCapabilityLayerNames(
        req.params.id,
      );
      if (payload === null) {
        throw new HajkError(
          HttpStatusCodes.NOT_FOUND,
          `No service with id: ${req.params.id} could be found.`,
          HajkStatusCodes.UNKNOWN_SERVICE_ID,
        );
      }
      res.status(HttpStatusCodes.OK).json({
        count: payload.layers.length,
        ...payload,
      });
    },
  );

  getMapsByServiceId = asyncHandler(async (req: Request, res: Response) => {
    const maps = await ServicesService.getMapsByServiceId(req.params.id);
    res.status(HttpStatusCodes.OK).json({ count: maps.length, maps });
  });

  getGroupsByServiceId = asyncHandler(async (req: Request, res: Response) => {
    const groups = await ServicesService.getGroupsByServiceId(req.params.id);
    res.status(HttpStatusCodes.OK).json({ count: groups.length, groups });
  });

  getAllProjections = asyncHandler(async (req: Request, res: Response) => {
    const projections = await ServicesService.getAllProjections();
    res
      .status(HttpStatusCodes.OK)
      .json({ count: projections.length, projections });
  });

  createService = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServicesService.createService(
      req.body as ServiceCreateInput,
      req.user?.id
    );
    res.status(HttpStatusCodes.CREATED).json(service);
  });

  updateService = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServicesService.updateService(
      req.params.id,
      req.body as ServiceUpdateInput,
      req.user?.id
    );
    res.status(HttpStatusCodes.OK).json(service);
  });

  updateHealthStatus = asyncHandler(async (req: Request, res: Response) => {
    const { healthStatus } = req.body as {
      healthStatus: "HEALTHY" | "UNHEALTHY";
    };
    await ServicesService.updateHealthStatus(req.params.id, healthStatus);
    res.status(HttpStatusCodes.NO_CONTENT).send();
  });

  deleteService = asyncHandler(async (req: Request, res: Response) => {
    await ServicesService.deleteService(req.params.id);
    res.status(HttpStatusCodes.NO_CONTENT).send();
  });

  getDeletedServices = asyncHandler(async (_: Request, res: Response) => {
    const services = await ServicesService.getDeletedServices();
    res.status(HttpStatusCodes.OK).json({ count: services.length, services });
  });

  restoreService = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServicesService.restoreService(
      req.params.id,
      req.user?.id
    );
    res.status(HttpStatusCodes.OK).json(service);
  });
}
export default new ServicesController();

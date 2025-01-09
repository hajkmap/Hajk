import type { Request, Response } from "express";
import { ServiceType } from "@prisma/client";

import LayerService from "../../services/layer.service.ts";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import { HajkError } from "../../../../common/classes.ts";
import HajkStatusCodes from "../../../../common/hajk-status-codes.ts";

class LayersController {
  async getLayers(_: Request, res: Response) {
    const layers = await LayerService.getLayers();
    res.status(HttpStatusCodes.OK).json({ count: layers.length, layers });
  }

  async getLayerById(req: Request, res: Response) {
    const layer = await LayerService.getLayerById(req.params.id);
    if (layer === null) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No layer with id: ${req.params.id} could be found.`,
        HajkStatusCodes.UNKNOWN_LAYER_ID
      );
    }

    res.status(HttpStatusCodes.OK).json(layer);
  }

  async getLayerTypes(_: Request, res: Response) {
    const layerTypes = await LayerService.getLayerTypes();

    res
      .status(HttpStatusCodes.OK)
      .json({ count: layerTypes.length, layerTypes });
  }

  async getLayersByType(req: Request, res: Response) {
    // Let's ensure that the provided layer type is valid.
    if (!Object.values(ServiceType).toString().includes(req.params.type)) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `Unsupported layer type provided. Supported types are: ${Object.values(
          ServiceType
        )}.`,
        HajkStatusCodes.UNKNOWN_LAYER_TYPE
      );
    }

    // If we've got this far, let's talk to the database.
    const layers = await LayerService.getLayersByType(
      req.params.type as ServiceType
    );

    res.status(HttpStatusCodes.OK).json({ count: layers.length, layers });
  }

  async createLayer(req: Request, res: Response) {
    const layer = await LayerService.createLayer(req.body);
    res.status(HttpStatusCodes.CREATED).json(layer);
  }
}
export default new LayersController();

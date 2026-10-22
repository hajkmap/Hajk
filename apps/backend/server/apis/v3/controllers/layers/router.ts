import * as express from "express";
import controller from "./controller.ts";
import { validatePayload } from "../../middlewares/payload.validation.ts";
import {
  LayerCreateSchema,
  LayerUpdateSchema,
} from "../../schemas/layer.schemas.ts";

export default express
  .Router()
  .get("/", controller.getLayers)
  .get("/usage-summary", controller.getUsageSummary)
  .get("/deleted", controller.getDeletedLayers)
  .get("/:id/service", controller.getServiceByLayerId)
  .get("/:id/usage", controller.getUsageByLayerId)
  .get("/types", controller.getLayerTypes)
  .get("/types/:type", controller.getLayersByType)
  .get("/:id", controller.getLayerById)
  .post("/", validatePayload(LayerCreateSchema), controller.createLayer)
  .post("/:id/restore", controller.restoreLayer)
  .patch("/:id", validatePayload(LayerUpdateSchema), controller.updateLayer)
  .delete("/:id", controller.deleteLayer)
  .get("/role/:id", controller.getRoleOnLayerByLayerId)
  .post("/role", controller.createAndUpdateRoleOnLayer);

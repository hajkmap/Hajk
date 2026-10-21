import * as express from "express";
import controller from "./controller.ts";
import { validatePayload } from "../../middlewares/payload.validation.ts";
import {
  ServiceCreateSchema,
  ServiceUpdateSchema,
} from "../../schemas/service.schemas.ts";

export default express
  .Router()
  .get("/", controller.getServices)
  .get("/projections", controller.getAllProjections)
  .get("/deleted", controller.getDeletedServices)
  .get("/:id", controller.getServiceById)
  .get("/:id/layers/count", controller.getLayerCountByServiceId)
  .get("/:id/layers", controller.getLayersByServiceId)
  .get("/:id/capabilities", controller.getRemoteCapabilityLayers)
  .get("/:id/maps", controller.getMapsByServiceId)
  .get("/:id/groups", controller.getGroupsByServiceId)
  .post("/", validatePayload(ServiceCreateSchema), controller.createService)
  .post("/:id/restore", controller.restoreService)
  .patch("/:id", validatePayload(ServiceUpdateSchema), controller.updateService)
  .patch("/:id/health-status", controller.updateHealthStatus)
  .delete("/:id", controller.deleteService);

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
  .get("/:id", controller.getServiceById)
  .get("/:id/layers", controller.getLayersByServiceId)
  .get("/:id/maps", controller.getMapsByServiceId)
  .post("/", validatePayload(ServiceCreateSchema), controller.createService)
  .patch("/:id", validatePayload(ServiceUpdateSchema), controller.updateService)
  .delete("/:id", controller.deleteService);

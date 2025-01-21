import * as express from "express";
import controller from "./controller.ts";
import { validatePayload } from "../../middlewares/payload.validation.ts";
import {
  ServiceCreateInputSchema,
  ServicePartialSchema,
} from "../../../../generated/zod/index.ts";

export default express
  .Router()
  .get("/", controller.getServices)
  .get("/:id", controller.getServiceById)
  .get("/:id/layers", controller.getLayersByServiceId)
  .get("/:id/maps", controller.getMapsByServiceId)
  .post(
    "/",
    validatePayload(ServiceCreateInputSchema),
    controller.createService
  )
  .patch(
    "/:id",
    validatePayload(ServicePartialSchema),
    controller.updateService
  )
  .delete("/:id", controller.deleteService);

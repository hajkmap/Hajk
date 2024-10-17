import * as express from "express";
import controller from "./controller.ts";

export default express
  .Router()
  .get("/", controller.getServices)
  .get("/:id", controller.getServiceById)
  .get("/:id/layers", controller.getLayersByServiceId)
  .get("/:id/maps", controller.getMapsByServiceId)
  .post("/", controller.createService)
  .patch("/:id", controller.updateService)
  .delete("/:id", controller.deleteService);

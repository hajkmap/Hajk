import * as express from "express";
import controller from "./controller.ts";

export default express
  .Router()
  .get("/", controller.getLayers)
  .get("/:id/service", controller.getServiceByLayerId)
  .get("/types", controller.getLayerTypes)
  .get("/types/:type", controller.getLayersByType)
  .get("/:id", controller.getLayerById)
  .post("/", controller.createLayer)
  .patch("/:id", controller.updateLayer)
  .delete("/:id", controller.deleteLayer);

import * as express from "express";
import controller from "./controller.ts";

export default express
  .Router()
  .get("/", controller.getServices)
  .get("/:id", controller.getServiceById)
  .get("/:id/layers", controller.getLayersByServiceId);

import * as express from "express";
import controller from "./controller.ts";

export default express
  .Router()
  .get("/", controller.getLayers)
  .get("/types", controller.getLayerTypes)
  .get("/types/:type", controller.getLayersByType)
  .get("/:id", controller.getLayerById);

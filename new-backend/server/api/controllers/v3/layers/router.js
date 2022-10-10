import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  .get("/", controller.getLayers)
  .get("/:id", controller.getLayerById)
  .get("/type/:type", controller.getLayerByType);

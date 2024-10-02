import * as express from "express";
import controller from "./controller.ts";

export default express
  .Router()
  .get("/", controller.getGroups)
  .get("/:id", controller.getGroupById)
  .get("/:id/layers", controller.getLayersByGroupId)
  .get("/:id/maps", controller.getMapsByGroupId);

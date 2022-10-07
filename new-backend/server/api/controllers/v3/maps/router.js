import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  .get("/", controller.getMaps)
  .get("/:mapName", controller.getMapByName)
  .get("/:mapName/groups", controller.getGroupsForMap)
  .get("/:mapName/layers", controller.getLayersForMap)
  .get("/:mapName/projections", controller.getProjectionsForMap)
  .get("/:mapName/tools", controller.getToolsForMap);

import * as express from "express";
import MapsController from "./controller.ts";

export default express
  .Router()
  .get("/", MapsController.getMaps)
  .get("/:mapName", MapsController.getMapByName)
  .get("/:mapName/groups", MapsController.getGroupsForMap)
  .get("/:mapName/layers", MapsController.getLayersForMap)
  .get("/:mapName/projections", MapsController.getProjectionsForMap)
  .get("/:mapName/tools", MapsController.getToolsForMap);

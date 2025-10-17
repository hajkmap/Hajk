import * as express from "express";
import MapsController from "./controller.ts";

export default express
  .Router()
  .get("/", MapsController.getMaps)
  .post("/", MapsController.createMap)
  .patch("/:mapName", MapsController.updateMap)
  .delete("/:mapName", MapsController.deleteMap)
  .get("/:mapName", MapsController.getMapByName)
  .get("/:mapName/groups", MapsController.getGroupsForMap)
  .get("/:mapName/layers", MapsController.getLayersForMap)
  .get("/:mapName/projections", MapsController.getProjectionsForMap)
  .get("/:mapName/tools", MapsController.getToolsForMap);

import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  .get("/", controller.getMaps)
  // TODO: Move me to seed.js
  .get("/populateAllMaps", controller.populateAllMaps)
  .get("/:mapName/tools", controller.getToolsForMap)
  .get("/:mapName/layers", controller.getLayersForMap)
  // TODO: Move me to seed.js
  .get("/:mapName/populate", controller.populateMap)
  .get("/:mapName", controller.getMapByName);

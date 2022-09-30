import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  .get("/", controller.getMaps)
  .get("/:mapName/tools", controller.getToolsForMap)
  // TODO: Move me to seed.js
  .get("/:mapName/populate", controller.populate)
  .get("/:mapName", controller.getMapByName);

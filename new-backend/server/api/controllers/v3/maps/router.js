import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  .get("/", controller.getMaps)
  .get("/:mapName/tools", controller.getToolsForMap)
  .get("/:mapName", controller.getMapByName);

import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  .get("/mapsWithTool/:toolName", controller.getMapsWithTool)
  .get("/:mapName", controller.getMap);

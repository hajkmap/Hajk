import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  .get("/toolsInMap/:mapName", controller.getToolsForMap);

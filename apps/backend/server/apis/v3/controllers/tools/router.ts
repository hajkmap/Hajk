import * as express from "express";
import controller from "./controller.js";

export default express
  .Router()
  .get("/", controller.getTools)
  .get("/:toolName/maps", controller.getMapsWithTool);

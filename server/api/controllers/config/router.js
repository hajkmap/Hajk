import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  .get("/layers", controller.layers)
  .get("/:map", controller.byMap);

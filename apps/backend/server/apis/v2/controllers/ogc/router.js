import * as express from "express";
import controller from "./controller.js";

// RestrictAdmin ??
export default express
  .Router()
  .get("/wfst", controller.listWFSTLayers)
  .get("/wfst/:id/features", controller.getWFSTFeatures);

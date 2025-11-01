import * as express from "express";
import controller from "./controller.js";

// RestrictAdmin ??
export default express
  .Router()
  .get("/wfst", controller.listWFSTLayers)
  .get("/wfst/:id", controller.getWFSTLayer)
  .get("/wfst/:id/features", controller.getWFSTFeatures)
  .post("/wfst/:id/transaction", controller.commitWFSTTransaction);

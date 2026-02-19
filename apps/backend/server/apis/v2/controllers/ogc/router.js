import * as express from "express";
import controller from "./controller.js";

// AD user extraction is handled inside each controller method via
// ad.getUserFromRequestHeader(req). This respects AD_LOOKUP_ACTIVE,
// AD_USE_GROUPS_FROM_HEADER, and AD_TRUSTED_HEADER from .env.
export default express
  .Router()
  .get("/wfst", controller.listWFSTLayers)
  .get("/wfst/:id", controller.getWFSTLayer);

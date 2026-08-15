import * as express from "express";
import controller from "./controller.js";

// AD user extraction is handled centrally by the extractUserContext
// middleware (registered in common/server.js), which puts the accepted
// identity in res.locals.authUser — the controller methods read it from
// there. The middleware respects AD_TRUSTED_PROXY_IPS and AD_TRUSTED_HEADER
// from .env.
export default express
  .Router()
  .get("/wfst", controller.listWFSTLayers)
  .get("/wfst/:id", controller.getWFSTLayer);

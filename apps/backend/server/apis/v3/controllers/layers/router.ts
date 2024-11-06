import * as express from "express";
import controller from "./controller.ts";
import { isAuthenticated } from "../../../../common/auth/is-authenticated.middleware.ts";

export default express
  .Router()
  .get("/", isAuthenticated, controller.getLayers)
  .get("/types", controller.getLayerTypes)
  .get("/types/:type", controller.getLayersByType)
  .get("/:id", controller.getLayerById);

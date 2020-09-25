import * as express from "express";
import controller from "./controller";

export default express.Router().put("/:type", controller.putLayerOfType);
// .get("/:layer", controller.getLayer);

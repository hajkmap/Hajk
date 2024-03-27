import * as express from "express";
import controller from "./controller.js";

export default express
  .Router()
  .get("/layers", controller.layers) // Get all layers (from layers.json)
  .get("/userspecificmaps", controller.userSpecificMaps) // MapSwitcher component uses this to determine which maps should be visible

  // …but if none of the above matched, let's assume the string
  // provided is a param that should be used as map config name.
  .get("/:map", controller.byMap); // Get specific map config

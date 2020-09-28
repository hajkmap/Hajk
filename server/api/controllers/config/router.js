import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  // First we put specified routes so we can catch them
  .get("/layers", controller.layers) // Get all layers (from layers.json)
  .get("/list", controller.list) // List all available maps
  .get("/userspecificmaps", controller.userSpecificMaps) // MapSwitcher component uses this to determine which maps should be visible

  // If none of the above matched, let's assume the string is a param
  .get("/:map", controller.byMap); // Get specific map config

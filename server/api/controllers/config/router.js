import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  // First we handle _specific_ routes, so we can catch them…
  .get("/export/:map/:format", controller.exportMapConfig) // Describe all available layers in a human-readable format
  .get("/layers", controller.layers) // Get all layers (from layers.json)
  .get("/list", controller.list) // List all available maps
  .get("/userspecificmaps", controller.userSpecificMaps) // MapSwitcher component uses this to determine which maps should be visible
  .get("/create/:name", controller.createNewMap) // FIXME: Replace with a PUT when Admin is ready
  .get("/delete/:name", controller.deleteMap) // FIXME: Replace with a DELETE when Admin is ready
  .put("/duplicate/:nameFrom/:nameTo", controller.duplicateMap)

  // …but if none of the above matched, let's assume the string
  // provided is a param that should be used as map config name.
  .get("/:map", controller.byMap); // Get specific map config

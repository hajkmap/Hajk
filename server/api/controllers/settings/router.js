import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  // We use the same controller method to handle these 3
  // PUT requests, as they all write into the same file,
  // only different portions of it.
  .put("/layermenu", controller.putSettingsToMapFile)
  .put("/mapsettings", controller.putSettingsToMapFile)
  .put("/toolsettings", controller.putSettingsToMapFile)
  // We use the same controller method for both layer
  // creation (POST) and updates (PUT).
  .post("/:type", controller.putLayerOfType)
  .put("/:type", controller.putLayerOfType)
  // Handle layer removal
  .delete("/:type/:layerId", controller.deleteLayerFromStore);

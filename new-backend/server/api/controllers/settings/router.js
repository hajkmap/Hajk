import * as express from "express";
import controller from "./controller.js";
import restrictAdmin from "../../middlewares/restrict.admin.js";

export default express
  .Router()
  .use(restrictAdmin) // We will not allow any of the following routes unless user is admin
  // We use the same controller method to handle these 3
  // PUT requests, as they all write into the same file,
  // only different portions of it.
  .put("/layermenu", controller.putSettingsToMapFile)
  .put("/mapsettings", controller.putSettingsToMapFile)
  .put("/toolsettings", controller.putSettingsToMapFile)
  .post("/:type", controller.putLayerOfType) // Will add new each time it's called
  .put("/:type", controller.putLayerOfType) // Will overwrite existing and the result is idempotent
  // Handle layer removal
  .delete("/:type/:layerId", controller.deleteLayerFromStore);

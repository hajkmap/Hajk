import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  .put("/layermenu", controller.putLayerSwitcherSettings)
  // TODO: .put("/toolsettings", controller.putToolSettings)
  .put("/:type", controller.putLayerOfType);
// TODO: .delete("/:type/:id", controller.deleteLayerFromStore);

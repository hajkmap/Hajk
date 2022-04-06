import * as express from "express";
import controller from "./controller";
import restrictAdmin from "../../middlewares/restrict.admin";

export default express
  .Router()
  .use(restrictAdmin) // We will not allow any of the following routes unless user is admin
  // First we handle _specific_ routes, so we can catch them…
  .get("/create/:name", controller.createNewMap) // FIXME: Replace with a PUT when Admin is ready
  .put("/create/:name", controller.createNewMap)
  .get("/delete/:name", controller.deleteMap) // FIXME: Replace with a DELETE when Admin is ready
  .delete("/delete/:name", controller.deleteMap)
  .put("/duplicate/:nameFrom/:nameTo", controller.duplicateMap)
  .get("/export/:map/:format", controller.exportMapConfig) // Describe all available layers in a human-readable format
  .get("/layers", controller.layers) // Get all layers (from layers.json)
  .get("/list", controller.list) // List all available maps
  .get("/listimage", controller.listimage) // List all available maps
  .get("/listvideo", controller.listvideo)
  .get("/listaudio", controller.listaudio)

  // …but if none of the above matched, let's assume the string
  // provided is a param that should be used as map config name.
  .get("/:map", controller.byMap); // Get specific map config

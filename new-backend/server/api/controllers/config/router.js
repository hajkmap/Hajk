import * as express from "express";
import controller from "./controller";
import checkAdminAuthorization from "../../middlewares/check.admin.authorization";

export default express
  .Router()
  // First we handle _specific_ routes, so we can catch them…
  .get("/create/:name", [checkAdminAuthorization, controller.createNewMap]) // FIXME: Replace with a PUT when Admin is ready
  .put("/create/:name", [checkAdminAuthorization, controller.createNewMap])
  .get("/delete/:name", [checkAdminAuthorization, controller.deleteMap]) // FIXME: Replace with a DELETE when Admin is ready
  .delete("/delete/:name", [checkAdminAuthorization, controller.deleteMap])
  .put("/duplicate/:nameFrom/:nameTo", [
    checkAdminAuthorization,
    controller.duplicateMap,
  ])
  .get("/export/:map/:format", [
    checkAdminAuthorization,
    controller.exportMapConfig,
  ]) // Describe all available layers in a human-readable format
  // TODO: We need to separate /layers from /allLayers that should return unfiltered layers store for admins
  .get("/layers", controller.layers) // Get all layers (from layers.json)
  .get("/list", [checkAdminAuthorization, controller.list]) // List all available maps
  .get("/userspecificmaps", controller.userSpecificMaps) // MapSwitcher component uses this to determine which maps should be visible
  .get("/availableadgroups", [
    checkAdminAuthorization,
    controller.availableADGroups,
  ]) // MapSwitcher component uses this to determine which maps should be visible
  .get("/findcommonadgroupsforusers", [
    checkAdminAuthorization,
    controller.findCommonADGroupsForUsers,
  ]) // MapSwitcher component uses this to determine which maps should be visible

  // …but if none of the above matched, let's assume the string
  // provided is a param that should be used as map config name.
  .get("/:map", controller.byMap); // Get specific map config

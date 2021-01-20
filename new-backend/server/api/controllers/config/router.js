import * as express from "express";
import controller from "./controller";
import checkAdminAuthorization from "../../middlewares/check.admin.authorization";

export default express
  .Router()
  .get("/layers", controller.layers) // Get all layers (from layers.json)
  .get("/userspecificmaps", controller.userSpecificMaps) // MapSwitcher component uses this to determine which maps should be visible

  // TODO: Move those two AD methods to AD router
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

import * as express from "express";
import controller from "./controller";
import checkAdminAuthorization from "../../middlewares/check.admin.authorization";

export default express
  .Router()
  .use(checkAdminAuthorization) // We will not allow any of the following routes unless user is admin
  .get("/availableadgroups", controller.availableADGroups)
  .get("/findcommonadgroupsforusers", controller.findCommonADGroupsForUsers)
  .get("/users", controller.getStore)
  .get("/groups", controller.getStore)
  .get("/groupsPerUser", controller.getStore)
  .put("/flushStores", controller.flushStores);

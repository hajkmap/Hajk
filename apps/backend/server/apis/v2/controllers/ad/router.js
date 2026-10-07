import * as express from "express";
import controller from "./controller.js";
import restrictAdmin from "../../middlewares/restrict.admin.js";
import { adminLimiter } from "../../../../common/middlewares/rate.limiter.js";

export default express
  .Router()
  .use(adminLimiter, restrictAdmin) // We will not allow any of the following routes unless user is admin
  .get("/availableadgroups", controller.availableADGroups)
  .get("/findcommonadgroupsforusers", controller.findCommonADGroupsForUsers)
  .get("/users", controller.getStore)
  .get("/groups", controller.getStore)
  .get("/groupsPerUser", controller.getStore)
  .put("/flushStores", controller.flushStores);

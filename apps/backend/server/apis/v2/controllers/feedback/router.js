import * as express from "express";
import controller from "./controller.js";
import restrictAdmin from "../../middlewares/restrict.admin.js";
import {
  adminLimiter,
  feedbackLimiter,
} from "../../../../common/middlewares/rate.limiter.js";

export default express
  .Router()
  .get("/challenge", controller.challenge)
  .post("/", feedbackLimiter, controller.submit)
  .use(adminLimiter, restrictAdmin) // All routes that follow are admin-only!
  .get("/", controller.list)
  .get("/stats", controller.stats)
  .delete("/", controller.deleteAll);

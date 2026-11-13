import * as express from "express";
import controller from "./controller.js";
import { adminLimiter } from "../../../../common/middlewares/rate.limiter.js";

export default express
  .Router()
  .use(adminLimiter) // Report generation is expensive, so use the stricter tier
  .post("/realestateownerreport", controller.getRealestateOwnerList)
  .post("/residentreport", controller.getResidentList);

import * as express from "express";
import controller from "./controller.js";
import { adminLimiter } from "../../../../common/middlewares/rate.limiter.js";
import restrictToTools from "../../middlewares/restrict.tool.js";

export default express
  .Router()
  .use(adminLimiter) // Report generation is expensive, so use the stricter tier
  .post(
    "/realestateownerreport",
    restrictToTools([{ type: "fir", option: "propertyList" }]),
    controller.getRealestateOwnerList
  )
  .post(
    "/residentreport",
    // Kir posts its resident list here too
    restrictToTools([
      { type: "fir", option: "residentList" },
      { type: "kir", option: "residentList" },
    ]),
    controller.getResidentList
  );

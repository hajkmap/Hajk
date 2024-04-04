import * as express from "express";
import controller from "./controller.js";

export default express
  .Router()
  .post("/realestateownerreport", controller.getRealestateOwnerList)
  .post("/residentreport", controller.getResidentList);

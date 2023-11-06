import * as express from "express";
import controller from "./controller.js";
import restrictAdmin from "../../middlewares/restrict.admin.js";

export default express
  .Router()
  .get("/list", controller.surveylist)
  .get("/load/:name", controller.getByNameSurvey)
  .get("/answer/load/:name", controller.getByNameSurveyLoad)
  .put("/answer/save/:surveyId", controller.saveByNameSurvey)
  .use(restrictAdmin); // All routes that follow are admin-only!

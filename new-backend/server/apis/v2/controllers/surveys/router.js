import * as express from "express";
import controller from "./controller.js";
import restrictAdmin from "../../middlewares/restrict.admin.js";

export default express
  .Router()
  .put("/answers/:surveyId", controller.saveByNameSurveyAnswer)
  .get("/:name", controller.getByNameSurvey)
  .use(restrictAdmin) // All routes that follow are admin-only!
  .get("/list/", controller.surveylist)
  .get("/answers/:name", controller.getByNameSurveyLoad)
  .put("/:surveyId", controller.saveByNameSurvey);

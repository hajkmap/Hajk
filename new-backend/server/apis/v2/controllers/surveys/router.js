import * as express from "express";
import controller from "./controller.js";
import restrictAdmin from "../../middlewares/restrict.admin.js";

export default express
  .Router()
  .get("/list/", controller.surveylist)
  .put("/answers/:surveyId", controller.saveByNameSurveyAnswer)
  .get("/:name", controller.getByNameSurvey)
  .get("/answers/:name", controller.getByNameSurveyLoad)
  .use(restrictAdmin) // All routes that follow are admin-only!;
  .put("/:surveyId", controller.saveByNameSurvey);

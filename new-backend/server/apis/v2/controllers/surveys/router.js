import * as express from "express";
import controller from "./controller.js";
import restrictAdmin from "../../middlewares/restrict.admin.js";

export default express
  .Router()
  .get("/list/", controller.surveylist)
  .get("/:name", controller.getByNameSurvey)
  .get("/answers/:name", controller.getByNameSurveyLoad)
  .put("/answers/:surveyId", controller.saveByNameSurveyAnswer)
  .put("/:surveyId", controller.saveByNameSurvey)
  .use(restrictAdmin); // All routes that follow are admin-only!

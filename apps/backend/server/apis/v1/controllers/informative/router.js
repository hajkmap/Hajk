import * as express from "express";
import controller from "./controller.js";
import restrictAdmin from "../../middlewares/restrict.admin.js";

export default express
  .Router()
  .get("/load/:name", controller.getByName)
  .use(restrictAdmin) // All routes that follow are admin-only!
  .post("/create", controller.create) // FIXME: Remove POST
  .put("/create", controller.create) // PUT is correct here, as this operation is idempotent
  .delete("/delete/:name", controller.deleteByName)
  .get("/list", controller.list)
  .get("/list/:name", controller.list) // FIXME: For now, the name paramter is ignored - should list only documents connected to specified map
  .post("/save/:name", controller.saveByName) // FIXME: Remove POST
  .put("/save/:name", controller.saveByName); // PUT is correct here, as this operation is idempotent

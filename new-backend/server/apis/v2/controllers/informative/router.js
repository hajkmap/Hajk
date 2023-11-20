import * as express from "express";
import controller from "./controller.js";
import restrictAdmin from "../../middlewares/restrict.admin.js";

export default express
  .Router()
  .get("/load/:name", controller.getByName)
  .get("/load/:folder/:name", controller.getByName)
  .use(restrictAdmin) // All routes that follow are admin-only!
  .post("/create", controller.create)
  .put("/create", controller.create)
  .post("/createfolder", controller.createFolder)
  .get("/folderlist", controller.folderlist)
  .delete("/delete/:name", controller.deleteByName)
  .delete("/delete/:folder/:name", controller.deleteByName)
  .get("/list", controller.list)
  .get("/list/:folder", controller.list)
  .post("/save/:name", controller.saveByName) // FIXME: Remove POST
  .put("/save/:name", controller.saveByName) // PUT is correct here, as this operation is idempotent
  .post("/save/:folder/:name", controller.saveByName) // FIXME: Remove POST
  .put("/save/:folder/:name", controller.saveByName); // PUT is correct here, as this operation is idempotent

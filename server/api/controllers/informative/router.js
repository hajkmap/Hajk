import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  .post("/create", controller.create)
  .get("/load/:name", controller.getByName)
  .post("/save/:name", controller.saveByName)
  .delete("/delete/:name", controller.deleteByName)
  .get("/list", controller.list)
  .get("/list/:name", controller.list); // FIXME: For now, the name paramter is ignored - should list only documents connected to specified map

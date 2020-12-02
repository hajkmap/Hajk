import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  .get("/users", controller.getStore)
  .get("/groups", controller.getStore)
  .get("/groupsPerUser", controller.getStore)
  .put("/flushStores", controller.flushStores);

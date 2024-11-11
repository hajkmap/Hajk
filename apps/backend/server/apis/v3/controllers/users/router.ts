import * as express from "express";
import controller from "./controller.ts";

export default express
  .Router()
  .get("/", controller.getUsers)
  .get("/roles", controller.getRoles)
  .get("/:id", controller.getUserById)
  .get("/:id/roles", controller.getRolesByUserId);

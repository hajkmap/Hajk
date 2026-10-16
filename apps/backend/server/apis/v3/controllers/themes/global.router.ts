import * as express from "express";
import controller from "./controller.ts";

export default express
  .Router()
  .get("/deleted", controller.getDeletedThemes)
  .post("/:id/restore", controller.restoreTheme);

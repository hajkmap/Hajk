import * as express from "express";
import controller from "./controller";

export default express
  .Router()
  .get("/repositories/list", controller.getRepositories) // List all repositories
  .get("/repositories/:name", controller.getRepositoryDetails) // List all workspaces in repository
  .get("/parameters/:repository/:name", controller.getWorkspaceParameters) // Get workspace parameters
  .post("/submit/:repository/:name", controller.runWorkspace) // Get workspace parameters
  .get("/status/id/:id", controller.checkWorkspaceStatus); // Get workspace parameters

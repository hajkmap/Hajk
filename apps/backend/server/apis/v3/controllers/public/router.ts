import * as express from "express";
import PublicController from "./controller.ts";
import searchRouter from "../search/router.ts";

export default express
  .Router()
  // We can connect additional routers here...
  .use("/search", searchRouter)
  // ...as well as directly add endpoint handlers.
  .get("/maps/:mapName", PublicController.getClientConfigForMap);

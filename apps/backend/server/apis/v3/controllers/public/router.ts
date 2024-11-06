import * as express from "express";
import MapsController from "../maps/controller.ts";
import searchRouter from "../search/router.ts";

// For now we're reusing existing controllers but limit which
// specific handlers are accessible to the endpoints. This might not
// be the best solution, so let's keep in mind that this might need changing.
// In that case, a separate PublicController should be imported and probably use
// some a separate PublicService in order to serve responses to endpoints in this router.
export default express
  .Router()
  // We can connect additional routers here...
  .use("/search", searchRouter)
  // ...as well as directly add endpoint handlers.
  .get("/maps/:mapName", MapsController.getMapByName);

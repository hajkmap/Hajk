import * as express from "express";
import PublicController from "./controller.ts";
import searchRouter from "../search/router.ts";

export default express
  .Router()
  // We can connect additional routers here...
  .use("/search", searchRouter)
  // ...as well as directly add endpoint handlers.
  .get("/maps/:mapName", PublicController.getClientConfigForMap)
  // DocumentHandler documents of a map, for any user that may see the map.
  // Order matters: /load/:folder/:name before /load/:name.
  .get(
    "/maps/:mapName/documenthandler/loadall",
    PublicController.loadAllDocumentsForMap
  )
  .get(
    "/maps/:mapName/documenthandler/load/:folder/:name",
    PublicController.loadDocumentInFolderForMap
  )
  .get(
    "/maps/:mapName/documenthandler/load/:name",
    PublicController.loadDocumentRootForMap
  );

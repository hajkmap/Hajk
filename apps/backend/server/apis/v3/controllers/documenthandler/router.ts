import * as express from "express";
import controller from "./controller.ts";
import { validatePayload } from "../../middlewares/payload.validation.ts";
import restrictAdmin from "../../middlewares/restrict.admin.ts";
import {
  FolderCreateSchema,
  FolderRenameSchema,
  DocumentCreateSchema,
  DocumentSaveSchema,
  DocumentMoveSchema,
} from "../../schemas/document.schemas.ts";

// Sub-router for /:folder/documents — mergeParams inherits :mapName and :folder
const documentsRouter = express.Router({ mergeParams: true });
documentsRouter
  .get("/", controller.getDocuments)
  .get("/:name", controller.getDocument)
  .post(
    "/",
    restrictAdmin,
    validatePayload(DocumentCreateSchema),
    controller.createDocument
  )
  .put(
    "/:name",
    restrictAdmin,
    validatePayload(DocumentSaveSchema),
    controller.saveDocument
  )
  .patch(
    "/:name/move",
    restrictAdmin,
    validatePayload(DocumentMoveSchema),
    controller.moveDocument
  )
  .delete("/:name", restrictAdmin, controller.deleteDocument);

// Main router mounted at /:mapName/documenthandler — mergeParams inherits :mapName
export default express
  .Router({ mergeParams: true })
  .get("/folders", controller.getFolders)
  .post(
    "/folders",
    restrictAdmin,
    validatePayload(FolderCreateSchema),
    controller.createFolder
  )
  .put(
    "/folders/:folder",
    restrictAdmin,
    validatePayload(FolderRenameSchema),
    controller.renameFolder
  )
  .delete("/folders/:folder", restrictAdmin, controller.deleteFolder)
  // Client-facing load endpoints — order matters: /load/:folder/:name before /load/:name
  .get("/load/:folder/:name", controller.loadDocumentInFolder)
  .get("/load/:name", controller.loadDocumentRoot)
  .use("/folders/:folder/documents", documentsRouter);

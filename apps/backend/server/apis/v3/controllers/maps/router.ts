import * as express from "express";
import MapsController from "./controller.ts";
import themesRouter from "../themes/router.ts";
import { validatePayload } from "../../middlewares/payload.validation.ts";
import {
  MapCreateSchema,
  MapDuplicateSchema,
  MapUpdateSchema,
  MapLayersUpdateSchema,
  MapGroupsUpdateSchema,
  MapContentUpdateSchema,
} from "../../schemas/map.schemas.ts";

export default express
  .Router()
  .get("/", MapsController.getMaps)
  .post("/", validatePayload(MapCreateSchema), MapsController.createMap)
  .patch(
    "/:mapName",
    validatePayload(MapUpdateSchema),
    MapsController.updateMap
  )
  .delete("/:mapName", MapsController.deleteMap)
  .post(
    "/:mapName/duplicate",
    validatePayload(MapDuplicateSchema),
    MapsController.duplicateMap
  )
  .get("/:mapName", MapsController.getMapByName)
  .get("/:mapName/groups", MapsController.getGroupsForMap)
  .get("/:mapName/layers", MapsController.getLayersForMap)
  .get("/:mapName/content", MapsController.getMapContent)
  .get("/:mapName/projections", MapsController.getProjectionsForMap)
  .get("/:mapName/tools", MapsController.getToolsForMap)
  .put("/:mapName/tools", MapsController.updateMapTools)
  .put(
    "/:mapName/layers",
    validatePayload(MapLayersUpdateSchema),
    MapsController.updateMapLayers
  )
  .put(
    "/:mapName/groups",
    validatePayload(MapGroupsUpdateSchema),
    MapsController.updateMapGroups
  )
  .put(
    "/:mapName/content",
    validatePayload(MapContentUpdateSchema),
    MapsController.updateMapContent
  )
  .use("/:mapName/themes", themesRouter);

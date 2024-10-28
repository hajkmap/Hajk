import * as express from "express";
import MapsController from "./controller.ts";
import { validatePayload } from "../../middlewares/payload.validation.ts";
import {
  MapCreateInputSchema,
  MapUpdateInputSchema,
} from "../../../../generated/zod/index.ts";

export default express
  .Router()
  .get("/", MapsController.getMaps)
  .post("/", validatePayload(MapCreateInputSchema), MapsController.createMap)
  .patch(
    "/:mapName",
    validatePayload(MapUpdateInputSchema),
    MapsController.updateMap
  )
  .delete("/:mapName", MapsController.deleteMap)
  .get("/:mapName", MapsController.getMapByName)
  .get("/:mapName/groups", MapsController.getGroupsForMap)
  .get("/:mapName/layers", MapsController.getLayersForMap)
  .get("/:mapName/projections", MapsController.getProjectionsForMap)
  .get("/:mapName/tools", MapsController.getToolsForMap);

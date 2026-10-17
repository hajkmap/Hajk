import * as express from "express";
import controller from "./controller.ts";
import { validatePayload } from "../../middlewares/payload.validation.ts";
import {
  GroupCreateSchema,
  GroupUpdateSchema,
} from "../../schemas/group.schemas.ts";

export default express
  .Router()
  .get("/", controller.getGroups)
  .get("/placements", controller.getPlacements)
  .get("/:id", controller.getGroupById)
  .get("/:id/maps", controller.getMapsByGroupId)
  .get("/:id/tree", controller.getGroupTree)
  .put("/:id/tree", controller.updateGroupTree)
  .post("/", validatePayload(GroupCreateSchema), controller.createGroup)
  .patch("/:id", validatePayload(GroupUpdateSchema), controller.updateGroup)
  .delete("/:id", controller.deleteGroup);

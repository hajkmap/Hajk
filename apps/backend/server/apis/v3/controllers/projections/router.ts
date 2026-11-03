import * as express from "express";
import controller from "./controller.ts";
import { validatePayload } from "../../middlewares/payload.validation.ts";
import {
  ProjectionCreateSchema,
  ProjectionUpdateSchema,
} from "../../schemas/projection.schemas.ts";

export default express
  .Router()
  .get("/", controller.getProjections)
  .post(
    "/",
    validatePayload(ProjectionCreateSchema),
    controller.createProjection
  )
  .patch(
    "/:id",
    validatePayload(ProjectionUpdateSchema),
    controller.updateProjection
  )
  .delete("/:id", controller.deleteProjection);

import * as express from "express";
import controller from "./controller.ts";
import { validatePayload } from "../../middlewares/payload.validation.ts";
import {
  LocalAccountCreateSchema,
  LocalAccountUpdateSchema,
  RoleCreateSchema,
  RoleUpdateSchema,
} from "../../schemas/user.schemas.ts";

export default express
  .Router()
  .get("/", controller.getUsers)
  .get("/roles", controller.getRoles)
  .get("/:id", controller.getUserById)
  .patch(
    "/:id",
    validatePayload(LocalAccountUpdateSchema),
    controller.updateUserAndLocalAccount
  )
  .delete("/:id", controller.deleteUser)
  .get("/:id/roles", controller.getRolesByUserId)
  .post(
    "/",
    validatePayload(LocalAccountCreateSchema),
    controller.createUserAndLocalAccount
  )
  .post("/roles", validatePayload(RoleCreateSchema), controller.createRole)
  .patch(
    "/roles/:id",
    validatePayload(RoleUpdateSchema),
    controller.updateRole
  );

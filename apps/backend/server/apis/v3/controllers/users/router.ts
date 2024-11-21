import * as express from "express";
import controller from "./controller.ts";
import { validatePayload } from "../../middlewares/payload.validation.ts";
import {
  LocalAccountCreateInputSchema,
  LocalAccountUpdateInputSchema,
  RoleCreateInputSchema,
  RoleUpdateInputSchema,
} from "../../../../generated/zod/index.ts";

export default express
  .Router()
  .get("/", controller.getUsers)
  .get("/roles", controller.getRoles)
  .get("/:id", controller.getUserById)
  .patch(
    "/:id",
    validatePayload(LocalAccountUpdateInputSchema),
    controller.updateUserAndLocalAccount
  )
  .delete("/:id", controller.deleteUser)
  .get("/:id/roles", controller.getRolesByUserId)
  .post(
    "/",
    validatePayload(LocalAccountCreateInputSchema),
    controller.createUserAndLocalAccount
  )
  .post("/roles", validatePayload(RoleCreateInputSchema), controller.createRole)
  .patch(
    "/roles/:id",
    validatePayload(RoleUpdateInputSchema),
    controller.updateRole
  );

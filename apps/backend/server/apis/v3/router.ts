import { Router } from "express";

import authRouter from "./controllers/auth/router.ts";
import groupsRouter from "./controllers/groups/router.ts";
import layersRouter from "./controllers/layers/router.ts";
import mapsRouter from "./controllers/maps/router.ts";
import publicRouter from "./controllers/public/router.ts";
import servicesRouter from "./controllers/services/router.ts";
import toolsRouter from "./controllers/tools/router.ts";
import usersRouter from "./controllers/users/router.ts";

import { isAuthenticated } from "../../common/auth/is-authenticated.middleware.ts";
import { isAdmin } from "../../common/auth/is-admin.ts";

export default Router()
  // The /auth endpoint should always be accessible
  .use("/auth", authRouter)
  // All other endpoints require authentication
  .use("/public", isAuthenticated, publicRouter)
  // The admin endpoints require that the user is authenticated and has the admin role
  .use("/groups", isAdmin, groupsRouter)
  .use("/layers", isAdmin, layersRouter)
  .use("/maps", isAdmin, mapsRouter)
  .use("/services", isAdmin, servicesRouter)
  .use("/tools", isAdmin, toolsRouter)
  .use("/users", isAdmin, usersRouter);

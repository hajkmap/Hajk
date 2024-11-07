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

export default Router()
  // The /auth and /public endpoints should always be accessible
  .use("/auth", authRouter)
  .use("/public", publicRouter)
  // All other endpoints require authentication
  .use("/groups", isAuthenticated, groupsRouter)
  .use("/layers", isAuthenticated, layersRouter)
  .use("/maps", isAuthenticated, mapsRouter)
  .use("/services", isAuthenticated, servicesRouter)
  .use("/tools", isAuthenticated, toolsRouter)
  .use("/users", isAuthenticated, usersRouter);

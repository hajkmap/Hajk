import { Router } from "express";

import authRouter from "./controllers/auth/router.ts";
import groupsRouter from "./controllers/groups/router.ts";
import layersRouter from "./controllers/layers/router.ts";
import mapsRouter from "./controllers/maps/router.ts";
import publicRouter from "./controllers/public/router.ts";
import servicesRouter from "./controllers/services/router.ts";
import toolsRouter from "./controllers/tools/router.ts";

import { isAuthenticated } from "../../common/auth/is-authenticated.middleware.ts";

export default Router()
  // The /auth and /public endpoints should always be accessible
  .use("/auth", authRouter)
  .use("/public", publicRouter)
  // All other endpoints require authentication
  .use(isAuthenticated)
  .use("/groups", groupsRouter)
  .use("/layers", layersRouter)
  .use("/maps", mapsRouter)
  .use("/services", servicesRouter)
  .use("/tools", toolsRouter);

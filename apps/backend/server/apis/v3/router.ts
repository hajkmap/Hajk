import { Router } from "express";

import groupsRouter from "./controllers/groups/router.ts";
import layersRouter from "./controllers/layers/router.ts";
import mapsRouter from "./controllers/maps/router.ts";
import searchRouter from "./controllers/search/router.ts";
import servicesRouter from "./controllers/services/router.ts";
import toolsRouter from "./controllers/tools/router.ts";

export default Router()
  .use("/groups", groupsRouter)
  .use("/layers", layersRouter)
  .use("/maps", mapsRouter)
  .use("/search", searchRouter)
  .use("/services", servicesRouter)
  .use("/tools", toolsRouter);

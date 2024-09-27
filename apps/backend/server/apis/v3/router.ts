import { Router } from "express";

import mapsRouter from "./controllers/maps/router.ts";
import toolsRouter from "./controllers/tools/router.ts";
import layersRouter from "./controllers/layers/router.ts";
import servicesRouter from "./controllers/services/router.ts";
import searchRouter from "./controllers/search/router.ts";

export default Router()
  .use("/maps", mapsRouter)
  .use("/tools", toolsRouter)
  .use("/layers", layersRouter)
  .use("/services", servicesRouter)
  .use("/search", searchRouter);

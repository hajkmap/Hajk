import * as express from "express";

import mapsRouter from "./controllers/maps/router.ts";
import toolsRouter from "./controllers/tools/router.ts";
import layersRouter from "./controllers/layers/router.ts";

export default express
  .Router()
  .use("/maps", mapsRouter)
  .use("/tools", toolsRouter)
  .use("/layers", layersRouter);

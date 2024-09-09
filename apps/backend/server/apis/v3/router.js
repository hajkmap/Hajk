import * as express from "express";

import mapsRouter from "./controllers/maps/router.js";
import toolsRouter from "./controllers/tools/router.js";
import layersRouter from "./controllers/layers/router.js";

export default express
  .Router()
  .use("/maps", mapsRouter)
  .use("/tools", toolsRouter)
  .use("/layers", layersRouter);

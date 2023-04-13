import * as express from "express";

import configRouter from "./controllers/config/router";
import mapconfigRouter from "./controllers/mapconfig/router";
import settingsRouter from "./controllers/settings/router";
import informativeRouter from "./controllers/informative/router";
import adRouter from "./controllers/ad/router";

export default express
  .Router()
  .use("/config", configRouter)
  .use("/informative", informativeRouter)
  .use("/mapconfig", mapconfigRouter)
  .use("/settings", settingsRouter)
  .use("/ad", adRouter);

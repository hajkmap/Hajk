import * as express from "express";

import configRouter from "./controllers/config/router.js";
import mapconfigRouter from "./controllers/mapconfig/router.js";
import settingsRouter from "./controllers/settings/router.js";
import informativeRouter from "./controllers/informative/router.js";
import adRouter from "./controllers/ad/router.js";
import firRouter from "./controllers/fir/router.js";
import surveyRouter from "./controllers/surveys/router.js";

export default express
  .Router()
  .use("/config", configRouter)
  .use("/informative", informativeRouter)
  .use("/mapconfig", mapconfigRouter)
  .use("/settings", settingsRouter)
  .use("/ad", adRouter)
  .use("/fir", firRouter)
  .use("/surveys", surveyRouter);

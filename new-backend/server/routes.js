import configRouter from "./api/controllers/config/router";
import configRouterV2 from "./api/controllers/configV2/router";
import mapconfigRouter from "./api/controllers/mapconfig/router";
import settingsRouter from "./api/controllers/settings/router";
import informativeRouter from "./api/controllers/informative/router";
import adRouter from "./api/controllers/ad/router";

export default function routes(app) {
  app.use("/api/v1/config", configRouter);
  app.use("/api/v2/config", configRouterV2);
  app.use("/api/v1/informative", informativeRouter);
  app.use("/api/v1/mapconfig", mapconfigRouter);
  app.use("/api/v1/settings", settingsRouter);
  app.use("/api/v1/ad", adRouter);
}

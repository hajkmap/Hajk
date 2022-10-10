import configRouter from "./api/controllers/config/router";
import configRouterV2 from "./api/controllers/configV2/router";
import mapconfigRouter from "./api/controllers/mapconfig/router";
import settingsRouter from "./api/controllers/settings/router";
import informativeRouter from "./api/controllers/informative/router";
import adRouter from "./api/controllers/ad/router";
import mapsRouter from "./api/controllers/v3/maps/router";
import toolsRouter from "./api/controllers/v3/tools/router";
import layersRouter from "./api/controllers/v3/layers/router";

export default function routes(app) {
  app.use("/api/v1/config", configRouter);
  app.use("/api/v2/config", configRouterV2);
  app.use("/api/v1/informative", informativeRouter);
  app.use("/api/v1/mapconfig", mapconfigRouter);
  app.use("/api/v1/settings", settingsRouter);
  app.use("/api/v1/ad", adRouter);
  app.use("/api/v3/maps", mapsRouter);
  app.use("/api/v3/tools", toolsRouter);
  app.use("/api/v3/layers", layersRouter);
}

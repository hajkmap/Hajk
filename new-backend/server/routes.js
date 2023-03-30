import configRouter from "./apis/v1/controllers/config/router";
import mapconfigRouter from "./apis/v1/controllers/mapconfig/router";
import settingsRouter from "./apis/v1/controllers/settings/router";
import informativeRouter from "./apis/v1/controllers/informative/router";
import adRouter from "./apis/v1/controllers/ad/router";

import configRouterV2 from "./apis/v2/controllers/config/router";
import mapconfigRouterV2 from "./apis/v2/controllers/mapconfig/router";
import settingsRouterV2 from "./apis/v2/controllers/settings/router";
import informativeRouterV2 from "./apis/v2/controllers/informative/router";
import adRouterV2 from "./apis/v2/controllers/ad/router";

export default function routes(app) {
  app.use("/api/v1/config", configRouter);
  app.use("/api/v1/informative", informativeRouter);
  app.use("/api/v1/mapconfig", mapconfigRouter);
  app.use("/api/v1/settings", settingsRouter);
  app.use("/api/v1/ad", adRouter);

  app.use("/api/v2/config", configRouterV2);
  app.use("/api/v2/informative", informativeRouterV2);
  app.use("/api/v2/mapconfig", mapconfigRouterV2);
  app.use("/api/v2/settings", settingsRouterV2);
  app.use("/api/v2/ad", adRouterV2);
}

import examplesRouter from "./api/controllers/examples/router";
import configRouter from "./api/controllers/config/router";
import settingsRouter from "./api/controllers/settings/router";
import informativeRouter from "./api/controllers/informative/router";

export default function routes(app) {
  app.use("/api/v1/config", configRouter);
  app.use("/api/v1/examples", examplesRouter);
  app.use("/api/v1/informative", informativeRouter);
  app.use("/api/v1/settings", settingsRouter);
}

import examplesRouter from "./api/controllers/examples/router";
import configRouter from "./api/controllers/config/router";

export default function routes(app) {
  app.use("/api/v1/examples", examplesRouter);
  app.use("/api/v1/config", configRouter);
}

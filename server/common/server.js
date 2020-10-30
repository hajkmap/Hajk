import Express from "express";
import * as path from "path";
import * as bodyParser from "body-parser";
import * as http from "http";
import cookieParser from "cookie-parser";

import sokigoFBProxy from "../api/middlewares/sokigo.fb.proxy";

import helmet from "helmet";
import cors from "cors";

import oas from "./oas";

const app = new Express();
const exit = process.exit;

export default class ExpressServer {
  constructor() {
    const root = path.normalize(`${__dirname}/../..`);
    app.set("appPath", `${root}client`);

    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(
      cors({
        origin: "*",
        optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
      })
    );

    // Don't enable FB Proxy if necessary env variable isn't sat
    if (process.env.FB_SERVICE_BASE_URL !== undefined)
      app.use("/api/v1/proxy", sokigoFBProxy());
    else
      console.info(
        "Sokigo FB Proxy not enabled due to missing settings, see your .env file."
      );
    app.use(bodyParser.json({ limit: process.env.REQUEST_LIMIT || "100kb" }));
    app.use(
      bodyParser.urlencoded({
        extended: true,
        limit: process.env.REQUEST_LIMIT || "100kb",
      })
    );
    app.use(bodyParser.text({ limit: process.env.REQUEST_LIMIT || "100kb" }));
    app.use(cookieParser(process.env.SESSION_SECRET));
    app.use(Express.static(`${root}/public`));
  }

  router(routes) {
    this.routes = routes;
    return this;
  }

  listen(port = process.env.PORT) {
    const welcome = (p) => () =>
      console.info("Hajk backend is up and running on http://localhost:" + p);

    oas(app, this.routes)
      .then(() => {
        http.createServer(app).listen(port, welcome(port));
      })
      .catch((e) => {
        console.error(e);
        exit(1);
      });

    return app;
  }
}

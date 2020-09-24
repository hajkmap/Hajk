import Express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import * as path from "path";
import * as bodyParser from "body-parser";
import * as http from "http";
import * as os from "os";
import cookieParser from "cookie-parser";

import helmet from "helmet";
import cors from "cors";

import oas from "./oas";

import l from "./logger";

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

    app.use(
      "/api/v1/proxy",
      createProxyMiddleware({
        target: process.env.FB_SERVICE_BASE_URL,
        logLevel: "info",
        pathRewrite: (originalPath, req) => {
          l.info(req, "Request");
          l.info(originalPath, "Pre");
          // Remove the portion that shouldn't be there when we proxy the request
          // and split the remaining string on "?" to separate any query params
          let segments = originalPath.replace("/api/v1/proxy", "").split("?");

          // The path part is the first segment, prior "?"
          const path = segments[0];
          let query = `?Database=${process.env.FB_SERVICE_DB}&User=${process.env.FB_SERVICE_USER}&Password=${process.env.FB_SERVICE_PASS}`;

          // If there was another segment, it was the query string that we should preserve
          query = segments[1] ? query + "&" + segments[1] : query;

          l.info(path + query, "Post");
          return path + query;
        },
        onError: (err, req, res) => {
          l.error(err, req, res);
        },
      })
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
      l.info(
        `up and running in ${
          process.env.NODE_ENV || "development"
        } @: ${os.hostname()} on port: ${p}}`
      );

    oas(app, this.routes)
      .then(() => {
        http.createServer(app).listen(port, welcome(port));
      })
      .catch((e) => {
        l.error(e);
        exit(1);
      });

    return app;
  }
}

import Express from "express";

import log4js from "log4js";

import * as path from "path";
import * as bodyParser from "body-parser";
import * as http from "http";
import cookieParser from "cookie-parser";

import sokigoFBProxy from "../api/middlewares/sokigo.fb.proxy";

import helmet from "helmet";
import cors from "cors";
import compression from "compression";

import oas from "./oas";

const app = new Express();

// Setup our logger
log4js.configure({
  // Appenders are output methods, e.g. if log should be written to file or console (or both)
  appenders: {
    // Console appender will print to stdout
    console: { type: "stdout" },
    // File appender will print to a log file, rotating it each day
    file: { type: "dateFile", filename: "logs/output.log" },
    // This appender is used for writing access logs and will rotate daily
    accessLog: { type: "dateFile", filename: "logs/access.log" },
  },
  categories: {
    default: {
      // Use settings from .env to decide which appenders (defined above) will be active
      appenders: process.env.LOG_DEBUG_TO.split(","),
      // Use settings from .env to determine which log level should be used
      level: process.env.LOG_LEVEL,
    },
    // If activated in .env, write access log to the configured appenders
    ...(process.env.LOG_ACCESS_LOG_TO.trim().length !== 0 && {
      http: {
        appenders: process.env.LOG_ACCESS_LOG_TO.split(","),
        level: "all",
      },
    }),
  },
});

const logger = log4js.getLogger("hajk");
const exit = process.exit;

export default class ExpressServer {
  constructor() {
    const root = path.normalize(`${__dirname}/../..`);
    app.set("appPath", `${root}client`);

    app.use(log4js.connectLogger(log4js.getLogger("http")));

    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(
      cors({
        origin: "*",
        optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
      })
    );
    app.use(compression());

    // Don't enable FB Proxy if necessary env variable isn't sat
    if (
      process.env.FB_SERVICE_ACTIVE === "true" &&
      process.env.FB_SERVICE_BASE_URL !== undefined
    ) {
      app.use("/api/v1/fbproxy", sokigoFBProxy());
      logger.info(
        "FB_SERVICE_ACTIVE is set to %o in .env. Enabling Sokigo FB Proxy",
        process.env.FB_SERVICE_ACTIVE
      );
    } else
      logger.info(
        "FB_SERVICE_ACTIVE is set to %o in .env. Not enabling Sokigo FB Proxy",
        process.env.FB_SERVICE_ACTIVE
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
      logger.info(`Hajk backend is up and running on http://localhost:${p}`);

    oas(app, this.routes)
      .then(() => {
        http.createServer(app).listen(port, welcome(port));
      })
      .catch((e) => {
        logger.error(e);
        exit(1);
      });

    return app;
  }
}

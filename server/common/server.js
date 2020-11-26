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
    // Default appender, will print to stdout
    console: {
      type: "stdout",
    },
    // This appender has a layout pattern that also prints line numbers,
    // use it if you set 'enableCallStack: true' for a given category
    consoleWithLineNumbers: {
      type: "stdout",
      layout: {
        type: "pattern",
        pattern: "%d %p %c %f:%l %m%n",
      },
    },
    // This appender is used for writing access logs,
    // it will rotate daily
    accessLog: { type: "dateFile", filename: "logs/access.log" },
  },
  categories: {
    // 'default' will be valid for all categories if not overwritten.
    default: {
      appenders: ["console"],
      level: process.env.LOG_LEVEL,
    },
    // Rename this to default if you want line numbers (call stack)
    defaultWithLineNumbers: {
      appenders: ["consoleWithLineNumbers"],
      level: process.env.LOG_LEVEL,
      enableCallStack: true,
    },

    // Send log of http requests (access log) to a separate appender
    http: { appenders: ["accessLog"], level: "all" },
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

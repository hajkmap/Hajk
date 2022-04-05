import Express from "express";
import * as path from "path";
import * as http from "http";

import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";

import log4js from "log4js";
import clfDate from "clf-date";
import oas from "./oas";

import sokigoFBProxy from "../api/middlewares/sokigo.fb.proxy";
import checkAdminAuthorization from "../api/middlewares/check.admin.authorization";
// import detailedRequestLogger from "../api/middlewares/detailed.request.logger";

const app = new Express();

// Setup our logger.
// First, see if Hajk is running in a clustered environment, if so, we want unique log file
// names for each instance
const uniqueInstance =
  process.env.HAJK_INSTANCE_ID.length > 0
    ? `_${process.env.HAJK_INSTANCE_ID}`
    : "";
log4js.configure({
  // Appenders are output methods, e.g. if log should be written to file or console (or both)
  appenders: {
    // Console appender will print to stdout
    console: { type: "stdout" },
    // File appender will print to a log file, rotating it each day.
    file: { type: "dateFile", filename: `logs/output${uniqueInstance}.log` },
    // Another file appender, specifically to log events that modify Hajk's layers/maps
    adminEventLog: {
      type: "dateFile",
      filename: `logs/admin_events${uniqueInstance}.log`,
      // Custom layout as we only care about the timestamp, the message and new line,
      // log level and log context are not of interest to this specific appender.
      layout: {
        type: "pattern",
        pattern: "[%d] %m",
      },
    },
    // Appender used for writing access logs. Rotates daily.
    accessLog: {
      type: "dateFile",
      filename: `logs/access${uniqueInstance}.log`,
      layout: { type: "messagePassThrough" },
    },
  },
  // Categories specify _which appender is used with respective logger_. E.g., if we create
  // a logger with 'const logger = log4js.getLogger("foo")', and there exists a "foo" category
  // below, the options (regarding appenders and log level to use) will be used. If "foo" doesn't
  // exist, log4js falls back to the "default" category.
  categories: {
    default: {
      // Use settings from .env to decide which appenders (defined above) will be active
      appenders: process.env.LOG_DEBUG_TO.split(","),
      // Use settings from .env to determine which log level should be used
      level: process.env.LOG_LEVEL,
    },
    // Separate category to log admin UI events (requests to endpoints that modify the layers/maps)
    ...(process.env.LOG_ADMIN_EVENTS === "true" && {
      adminEvent: {
        appenders: ["adminEventLog"],
        level: "all",
      },
    }),
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
    logger.debug("Process's current working directory: ", process.cwd());

    // If EXPRESS_TRUST_PROXY is set in .env, pass on the value to Express.
    // See https://expressjs.com/en/guide/behind-proxies.html.
    if (process.env.EXPRESS_TRUST_PROXY) {
      // .env doesn't handle boolean values well, but this setting can be
      // either a boolean or a string or an array of strings. Let's fix it.
      let trustProxy;

      switch (process.env.EXPRESS_TRUST_PROXY) {
        case "true":
          trustProxy = true;
          break;
        case "false":
          trustProxy = false;
          break;
        default:
          trustProxy = process.env.EXPRESS_TRUST_PROXY;
          break;
      }

      logger.debug(
        "Express configured to run behind a proxy. Setting 'trust proxy' value to %o.",
        trustProxy
      );

      app.set("trust proxy", trustProxy);
    }

    // Configure the HTTP access logger. We want it to log in the Combined Log Format, which requires some custom configuration below.
    app.use(
      log4js.connectLogger(log4js.getLogger("http"), {
        format: (req, res, format) =>
          format(
            ":remote-addr - " + // Host name or IP of accesser. RFC 1413 identity (unreliable, hence always a dash)
              (req.get(process.env.AD_TRUSTED_HEADER || "X-Control-Header") ||
                "-") + // Value of X-Control-Header (or whatever header specified in .env)
              ` [${clfDate()}]` + // Timestamp string surrounded by square brackets, e.g. [12/Dec/2012:12:12:12 -0500]
              ' ":method :url HTTP/:http-version"' + // HTTP request surrounded by double quotes, e.g., "GET /stuff.html HTTP/1.1"
              ' :status :content-length ":referrer"' + // HTTP status code, content length in bytes and referer (where request came from to your site)
              ' ":user-agent"' // User agent string, e.g. name of the browser
          ),
      })
    );

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
    app.use(Express.json({ limit: process.env.REQUEST_LIMIT || "100kb" }));
    app.use(
      Express.urlencoded({
        extended: true,
        limit: process.env.REQUEST_LIMIT || "100kb",
      })
    );
    app.use(Express.text({ limit: process.env.REQUEST_LIMIT || "100kb" }));
    app.use(cookieParser(process.env.SESSION_SECRET));

    // Serve some static files if requested to:
    // - The API Explorer is useful but we should be able to disable it
    process.env.EXPOSE_API_EXPLORER === "true" &&
      app.use(
        "/api-explorer",
        Express.static(path.join(process.cwd(), "static", "api-explorer"))
      );

    // - Hajk consists of 3 apps: backend (this API), client and admin.
    //   Client should be accessible directly under /…
    process.env.EXPOSE_CLIENT === "true" &&
      app.use(
        "/",
        Express.static(path.join(process.cwd(), "static", "client"))
      );

    //   …while admin app should be under /admin. Notice access restriction middleware.
    process.env.EXPOSE_ADMIN === "true" &&
      app.use("/admin", [
        checkAdminAuthorization,
        Express.static(path.join(process.cwd(), "static", "admin")),
      ]);
    // app.use(detailedRequestLogger);
  }

  router(routes) {
    this.routes = routes;
    return this;
  }

  listen(port = process.env.PORT) {
    const welcome = (p) => () =>
      logger.info(
        `Server startup completed. Launched on port ${p}. (http://localhost:${p})`
      );

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

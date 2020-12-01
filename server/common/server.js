import Express from "express";

import log4js from "log4js";
import clfDate from "clf-date";

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
    logger.debug("Process's current working directory: ", process.cwd());
    app.set("appPath", process.cwd());

    // If EXPRESS_TRUST_PROXY is sat in .env, pass on the value to Express.
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
    app.use(bodyParser.json({ limit: process.env.REQUEST_LIMIT || "100kb" }));
    app.use(
      bodyParser.urlencoded({
        extended: true,
        limit: process.env.REQUEST_LIMIT || "100kb",
      })
    );
    app.use(bodyParser.text({ limit: process.env.REQUEST_LIMIT || "100kb" }));
    app.use(cookieParser(process.env.SESSION_SECRET));
    logger.debug(
      "Exposing static files from directory:",
      path.join(process.cwd(), "public")
    );
    app.use(Express.static(path.join(process.cwd(), "public")));
    app.use((req, res, next) => {
      logger.trace("req.ip: %o", req.ip);
      logger.trace("req.ips: %o", req.ips);
      logger.debug(
        "req.connection.remoteAddress: %o",
        req.connection.remoteAddress
      );
      logger.trace("req.hostname: %o", req.hostname);
      logger.trace(
        "AD_TRUSTED_PROXY_IPS: %o",
        process.env.AD_TRUSTED_PROXY_IPS
      );
      logger.trace(
        "EXPRESS_TRUST_PROXY: app.set('trust proxy', %o)",
        process.env.EXPRESS_TRUST_PROXY
      );
      next();
    });
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

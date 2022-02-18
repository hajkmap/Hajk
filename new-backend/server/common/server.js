import Express from "express";
import * as path from "path";
import * as http from "http";
import fs from "fs";

import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";

import log4js from "../api/utils/hajkLogger";
import clfDate from "clf-date";

import websockets from "./websockets";

import { createProxyMiddleware } from "http-proxy-middleware";

import sokigoFBProxy from "../api/middlewares/sokigo.fb.proxy";
import fmeServerProxy from "../api/middlewares/fme.server.proxy";
import restrictStatic from "../api/middlewares/restrict.static";
import detailedRequestLogger from "../api/middlewares/detailed.request.logger";

import * as OpenApiValidator from "express-openapi-validator";
import errorHandler from "../api/middlewares/error.handler";

const app = new Express();

const logger = log4js.getLogger("hajk");

export default class ExpressServer {
  constructor() {
    logger.debug("Process's current working directory: ", process.cwd());
    const apiSpec = path.join(__dirname, "api.yml");
    const validateResponses = !!(
      process.env.OPENAPI_ENABLE_RESPONSE_VALIDATION &&
      process.env.OPENAPI_ENABLE_RESPONSE_VALIDATION.toLowerCase() === "true"
    );

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

    process.env.LOG_DETAILED_REQUEST_LOGGER === "true" &&
      app.use(detailedRequestLogger);

    app.use(
      helmet({
        contentSecurityPolicy: false, // If active, we get errors loading inline <script>
        frameguard: false, // If active, other pages can't embed our maps
      })
    );

    app.use(
      cors({
        origin: "*",
        optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
      })
    );

    // Enable compression early so that responses that follow will get gziped
    app.use(compression());

    this.setupGenericProxy();

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

    // Don't enable FME-server Proxy if necessary env variable isn't sat
    if (
      process.env.FME_SERVER_ACTIVE === "true" &&
      process.env.FME_SERVER_BASE_URL !== undefined
    ) {
      app.use("/api/v1/fmeproxy", fmeServerProxy());
      logger.info(
        "FME_SERVER_ACTIVE is set to %o in .env. Enabling FME-server proxy",
        process.env.FME_SERVER_ACTIVE
      );
    } else
      logger.info(
        "FME_SERVER_ACTIVE is set to %o in .env. Not enabling FME-server proxy",
        process.env.FME_SERVER_ACTIVE
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

    // Optionally, expose the Hajk client app directly under root (/)
    process.env.EXPOSE_CLIENT === "true" &&
      app.use(
        "/",
        Express.static(path.join(process.cwd(), "static", "client"))
      );

    // Optionally, other directories placed in "static" can be exposed.
    this.setupStaticDirs();

    // Finally, finish by running through the Validator and exposing the API specification
    app.use(process.env.OPENAPI_SPEC || "/spec", Express.static(apiSpec));
    app.use(
      OpenApiValidator.middleware({
        apiSpec,
        validateResponses,
        validateRequests: {
          allowUnknownQueryParameters: true,
        },
        ignorePaths: /.*\/spec(\/|$)/,
      })
    );
  }

  /**
   * @summary Create proxies for endpoints specified in DOTENV as "PROXY_*".
   * @issue https://github.com/hajkmap/Hajk/issues/824
   * @returns
   * @memberof ExpressServer
   */
  setupGenericProxy() {
    try {
      // Prepare a logger
      const l = log4js.getLogger("hajk.proxy");

      // Prepare a mapping of log levels between those used by Log4JS and
      // http-proxy-middleware's internal levels
      const logLevels = {
        ALL: "debug",
        TRACE: "debug",
        DEBUG: "debug",
        INFO: "info",
        WARN: "warn",
        ERROR: "error",
        FATAL: "error",
        MARK: "error",
        OFF: "silent",
      };

      // Convert the settings from DOTENV to a nice Array of Objects.
      const proxyMap = Object.entries(process.env)
        .filter(([k]) => k.startsWith("PROXY_"))
        .map(([k, v]) => {
          // Get rid of the leading "PROXY_" and convert to lower case
          k = k.replace("PROXY_", "").toLowerCase();
          return { context: k, target: v };
        });

      proxyMap.forEach((v) => {
        // Grab context and target from current element
        const context = v.context;
        const target = v.target;
        l.trace(`Setting up Hajk proxy "${context}"`);

        // Create the proxy itself
        app.use(
          `/api/v1/proxy/${context}`,
          createProxyMiddleware({
            target: target,
            changeOrigin: true,
            pathRewrite: {
              [`^/api/v1/proxy/${context}`]: "", // remove base path
            },
            logProvider: () => l,
            logLevel: logLevels[process.env.LOG_LEVEL],
          })
        );
      });
    } catch (error) {
      return { error };
    }
  }

  setupStaticDirs() {
    const l = log4js.getLogger("hajk.static");

    l.trace("Setting up access to static directories…");
    try {
      const dir = path.join(process.cwd(), "static");
      // List dir contents, the second parameter will ensure we get Dirent objects
      const staticDirs = fs
        .readdirSync(dir, {
          withFileTypes: true,
        })
        .filter((entry) => {
          // Filter out only files (we're not interested in directories).
          // Also, "client" is a special cases, handled separately.
          if (entry.isDirectory() === false || entry.name === "client") {
            return false;
          } else {
            return true;
          }
        })
        // Create an array using name of each Dirent object, remove file extension
        .map((entry) => entry.name);

      if (staticDirs.length > 0) {
        l.trace(
          "Found following directories in 'static': %s",
          staticDirs.join(", ")
        );
      } else {
        l.trace(
          "No directories found in 'static' - not exposing anything except the backend's API itself."
        );
      }

      // For each found dir, see if there's a corresponding entry in .env. We require
      // admins to explicitly expose (and optionally restrict) those directories.
      staticDirs.forEach((dir) => {
        // See if there's a corresponding key for current dir in .env,
        // the following notation is assumed: foo-bar -> EXPOSE_AND_RESTRICT_STATIC_FOO_BAR, hence replace below.
        const dotEnvKeyName = `EXPOSE_AND_RESTRICT_STATIC_${dir
          .toUpperCase()
          .replace(/-/g, "_")}`;
        const restrictedToGroups = process.env[dotEnvKeyName];

        if (restrictedToGroups === "") {
          // If the key is set (which is indicated with the value of an empty string),
          // it means that access to dir is unrestricted.
          l.info(`Exposing '%s' as unrestricted static directory.`, dir);
          app.use(
            `/${dir}`,
            Express.static(path.join(process.cwd(), "static", dir))
          );
        } else if (
          typeof restrictedToGroups === "string" &&
          restrictedToGroups.length > 0
        ) {
          l.info(
            `Exposing '%s' as a restricted directory. Allowed groups: %s`,
            dir,
            restrictedToGroups
          );
          // If there are restrictions, run a middleware that will enforce the restrictions,
          // if okay, expose - else return 403.
          app.use(`/${dir}`, [
            restrictStatic,
            Express.static(path.join(process.cwd(), "static", dir)),
          ]);
        } else {
          l.warn(
            "The directory '%s' was found in static, but no setting could be found in .env. The directory will NOT be exposed. If you wish to expose it, add the key '%s' to your .env.",
            dir,
            dotEnvKeyName
          );
        }
      });
    } catch (error) {
      return { error };
    }
  }

  router(routes) {
    routes(app);
    app.use(errorHandler);
    return this;
  }

  listen(port = process.env.PORT) {
    const welcome = (p) => () =>
      logger.info(
        `Server startup completed. Launched on port ${p}. (http://localhost:${p})`
      );

    // Grab the Server…
    const server = http.createServer(app).listen(port, welcome(port));

    // …and supply it to the WebSocket component.
    websockets(server);

    return app;
  }
}

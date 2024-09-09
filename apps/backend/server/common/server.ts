import Express from "express";
import * as path from "path";
import * as http from "http";
import fs from "fs";
import { fileURLToPath } from "url";

import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import * as OpenApiValidator from "express-openapi-validator";

import log4js from "./utils/hajkLogger.js";
import clfDate from "clf-date";

import websockets from "./websockets/index.js";

import { createProxyMiddleware } from "http-proxy-middleware";

import detailedRequestLogger from "./middlewares/detailed.request.logger.js";
import errorHandler from "./middlewares/error.handler.js";

const app = new Express();

const logger = log4js.getLogger("hajk");

const ALLOWED_API_VERSIONS = [2, 3];

export default class ExpressServer {
  constructor() {
    // Check engine version and display notice if applicable. The current recommendation
    // is based on the fact that `verifyLayers` uses `fetch`, which isn't available prior v18.
    // See also https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch
    const recommendedMajorVersion = 22;
    if (process.versions.node.split(".")[0] < recommendedMajorVersion) {
      logger.warn(
        `The current NodeJS runtime version (${process.version}) is lower than the recommended one (v${recommendedMajorVersion}.0.0). Some features will not be available. Consider upgrading to the recommended version in order to make use of all the latest features.`
      );
    }

    logger.debug("Process's current working directory: ", process.cwd());

    // Check which API versions should be enabled. We must do some work to ensure
    // that the value from .env is valid. But we have an early fallback, in case
    // no value is provided.
    let _apiVersions =
      process.env.API_VERSIONS?.trim?.() || ALLOWED_API_VERSIONS.join(",");

    // By now we'll always have a string, although it can be empty, or
    // contain invalid characters. Let's remove those faulty entries.
    _apiVersions = _apiVersions.split(",").filter((iv) => {
      // Attempt to parse as integer
      const v = Number.parseInt(iv);

      // If not valid, ignore
      if (Number.isInteger(v) === false) {
        logger.warn(
          `[API] Invalid version in .env. Ignoring entry: "${v}". Supported versions are: ${ALLOWED_API_VERSIONS.join(
            ", "
          )}`
        );
        return false;
      }

      // Check if the parsed integer really is a valid API version
      if (ALLOWED_API_VERSIONS.includes(v) === false) {
        logger.warn(
          `[API] Version specified in .env not allowed. Ignoring entry: "${v}". Supported versions are: ${ALLOWED_API_VERSIONS.join(
            ", "
          )}`
        );
        return false;
      }

      // If we got this far, v is a valid API version and can be kept in the array
      return v;
    });

    // One last check is needed: we could end up here with _apiVersions=[] (if the filtering above resulted
    // in none valid entiries). Take care of it by checking that the array isn't empty, fallback to defaults
    const apiVersions =
      _apiVersions.length === 0 ? ALLOWED_API_VERSIONS : _apiVersions;

    // Also, store as an app variable for later use across the app
    app.set("apiVersions", apiVersions);
    logger.info(
      "[API] Starting with the following API versions enabled:",
      apiVersions
    );

    // Check the setting in .env to see if validation is wanted
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
        crossOriginResourcePolicy: {
          policy: "cross-origin",
        },
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
    if (process.env.ENABLE_GZIP_COMPRESSION !== "false") {
      logger.trace("[HTTP] Enabling Hajk's built-in GZIP compression");
      app.use(compression());
    } else {
      logger.warn(
        `[HTTP] Not enabling GZIP compression. If this is a production environment 
you should make sure that you implement a reverse proxy that enables content compression. Alternatively, enable Hajk's 
built-it compression by setting the ENABLE_GZIP_COMPRESSION option to "true" in .env.`
      );
    }

    // We have to make sure to add the json-parsers etc. after the proxies has been initiated.
    // If they are added before, eventual payload trough the proxies will not be handled correctly.
    this.setupProxies().then(() => {
      app.use(Express.json({ limit: process.env.REQUEST_LIMIT || "100kb" }));
      app.use(
        Express.urlencoded({
          extended: true,
          limit: process.env.REQUEST_LIMIT || "100kb",
        })
      );
      app.use(Express.text({ limit: process.env.REQUEST_LIMIT || "100kb" }));
      app.use(cookieParser(process.env.SESSION_SECRET));
    });

    // Optionally, expose the Hajk client app directly under root (/)
    process.env.EXPOSE_CLIENT === "true" &&
      app.use(
        "/",
        Express.static(path.join(process.cwd(), "static", "client"))
      );

    // Optionally, other directories placed in "static" can be exposed.
    this.setupStaticDirs();

    // Expose the OpenAPI specifications on /api/vN/spec and
    // enabled the API validator middleware for all enabled
    // API versions
    apiVersions.forEach((v) => {
      // Grab paths to our OpenAPI specifications by…
      // …grabbing the current file's full URL and making it a file path…
      const __filename = fileURLToPath(import.meta.url);
      // …and extracting the dir name from file's path.
      const __dirname = path.dirname(__filename);
      // Finally, put it together with the filename of the YAML file
      // that holds the specification.
      const openApiSpecification = path.join(__dirname, `api.v${v}.yml`);

      // Expose the API specification as a simple static route…
      logger.trace(
        `[API] Exposing ${openApiSpecification} on route /api/v${v}/spec`
      );
      app.use(`/api/v${v}/spec`, Express.static(openApiSpecification));

      // …and apply the Validator middleware. We do it inside a timeout,
      // which isn't optimal. The reasoning behind is that we must "wait
      // a second or two" before we setup this middleware, to allow the
      // async imports (which are initiated earlier) to finish so that those
      // routes are set up when OAV runs its middleware. If we were to apply
      // the middleware directly, any non-existing routes (such as those being
      // created in async parts of the code) would render a 404 in the middleware.
      // Related to #1309. Discovered during PR in #1332.
      setTimeout(() => {
        logger.trace(`[VALIDATOR] Setting up OpenApiValidator for /api/v${v}`);
        app.use(
          OpenApiValidator.middleware({
            apiSpec: openApiSpecification,
            validateResponses,
            validateRequests: {
              allowUnknownQueryParameters: true,
            },
            ignorePaths: /.*\/spec(\/|$)/,
          })
        );
      }, 2000);
    });
  }

  async setupSokigoProxy() {
    // Each API version has its own Sokigo proxy middleware. Let's iterate them.
    for await (const v of app.get("apiVersions")) {
      // Don't enable FB Proxy if necessary env variable isn't sat
      if (
        process.env.FB_SERVICE_ACTIVE === "true" &&
        process.env.FB_SERVICE_BASE_URL !== undefined
      ) {
        const { default: sokigoFBProxy } = await import(
          `../apis/v${v}/middlewares/sokigo.fb.proxy.${parseInt(v) < 3 ? "js" : "ts"}`
        );
        app.use(`/api/v${v}/fbproxy`, sokigoFBProxy());
        logger.info(
          "FB_SERVICE_ACTIVE is set to %o in .env. Enabling Sokigo FB Proxy for API V%s",
          process.env.FB_SERVICE_ACTIVE,
          v
        );
      } else
        logger.info(
          "FB_SERVICE_ACTIVE is set to %o in .env. Not enabling Sokigo FB Proxy for API V%s",
          process.env.FB_SERVICE_ACTIVE,
          v
        );
    }
  }

  async setupFmeProxy() {
    // Each API version has its own FME proxy middleware. Let's iterate them.
    for await (const v of app.get("apiVersions")) {
      // Don't enable FME-server Proxy if necessary env variable isn't sat
      if (
        process.env.FME_SERVER_ACTIVE === "true" &&
        process.env.FME_SERVER_BASE_URL !== undefined
      ) {
        const { default: fmeServerProxy } = await import(
          `../apis/v${v}/middlewares/fme.server.proxy.${parseInt(v) < 3 ? "js" : "ts"}`
        );

        app.use(`/api/v${v}/fmeproxy`, fmeServerProxy());
        logger.info(
          "FME_SERVER_ACTIVE is set to %o in .env. Enabling FME-server proxy for API V%s",
          process.env.FME_SERVER_ACTIVE,
          v
        );
      } else
        logger.info(
          "FME_SERVER_ACTIVE is set to %o in .env. Not enabling FME-server proxy for API V%s",
          process.env.FME_SERVER_ACTIVE,
          v
        );
    }
  }

  /**
   * @summary Create proxies for endpoints specified in DOTENV as "PROXY_*".
   * @description A proxy will be created for each of the active API versions.
   * @example If admin configures a key named PROXY_GEOSERVER and enables
   * version 1 and 2 of the API, the following endpoints will be made available:
   * - /api/v1/proxy/geoserver
   * - /api/v2/proxy/geoserver
   * @issue https://github.com/hajkmap/Hajk/issues/824
   * @issue https://github.com/hajkmap/Hajk/issues/1309
   * @returns
   * @memberof ExpressServer
   */
  setupGenericProxy() {
    // Prepare a logger
    const l = log4js.getLogger("hajk.proxy");
    try {
      // Convert the settings from DOTENV to a nice Array of Objects.
      const proxyMap = Object.entries(process.env)
        .filter(([k]) => k.startsWith("PROXY_"))
        .map(([k, v]) => {
          // Get rid of the leading "PROXY_" and convert to lower case
          k = k.replace("PROXY_", "").toLowerCase();
          return { context: k, target: v };
        });

      // Iterate enabled API versions and expose one proxy endpoint
      // for each version.
      for (const apiVersion of app.get("apiVersions")) {
        proxyMap.forEach((v) => {
          // Grab context and target from current element
          const context = v.context;
          const target = v.target;
          l.trace(
            `Setting up proxy: /api/v${apiVersion}/proxy/${context} -> ${target}`
          );

          // Create the proxy itself
          app.use(
            `/api/v${apiVersion}/proxy/${context}`,
            createProxyMiddleware({
              logLevel: "silent",
              target: target,
              changeOrigin: true,
              pathRewrite: {
                [`^/api/v${apiVersion}/proxy/${context}`]: "", // remove base path
              },
            })
          );
        });
      }
    } catch (error) {
      l.error(error);
      return { error };
    }
  }

  // Since we have to await the setup of the proxies (so that the JSON-parser etc. initiates after the proxies),
  // we'll gather the all the setups here so they are easy to call.
  async setupProxies() {
    await this.setupSokigoProxy();
    await this.setupFmeProxy();
    this.setupGenericProxy();
  }

  async setupStaticDirs() {
    const l = log4js.getLogger("hajk.static");

    // Try to convert the value from config to an Int
    let normalizedStaticExposerVersion = Number.parseInt(
      process.env.STATIC_EXPOSER_VERSION?.trim?.()
    );

    // Grab active API versions
    const apiVersions = app.set("apiVersions");

    // If NaN, or if version required is not any of the active API versions,
    // let's fall back to the highest active version
    if (
      Number.isNaN(normalizedStaticExposerVersion) ||
      !apiVersions.includes(normalizedStaticExposerVersion)
    ) {
      normalizedStaticExposerVersion = Math.max(...apiVersions);
    }

    const apiVersion = normalizedStaticExposerVersion;

    l.info(
      `Attempting to expose static directories using Static Exposer from API V${apiVersion}`
    );

    try {
      // Dynamically import the required version of Static Restrictor
      const { default: restrictStatic } = await import(
        `../apis/v${apiVersion}/middlewares/restrict.static.${apiVersion < 3 ? "js" : "ts"}`
      );

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
    // Startup handler
    const welcome = (p) => () =>
      logger.info(
        `Server startup completed. Some services may still be initiating. Launched on port ${p}. (http://localhost:${p})`
      );

    // Shutdown handler
    const shutdown = (signal, value) => {
      logger.info("Shutdown requested…");
      server.close(() => {
        logger.info(`Server stopped by ${signal} with value ${value}.`);
      });
    };

    // Take care of graceful shutdown by defining signals that we want to handle.
    // Please note that SIGKILL signal (9) cannot be intercepted, so it's omitted.
    const signals = {
      SIGHUP: 1,
      SIGINT: 2,
      SIGTERM: 15,
    };

    // Create a listener for each of the signals that we want to handle
    Object.keys(signals).forEach((signal) => {
      process.on(signal, () => shutdown(signal, signals[signal]));
    });

    // Let's setup the server and start listening.
    const server = http.createServer(app).listen(port, welcome(port));

    // For WS support we must also supply the server to the WebSocket component.
    process.env.ENABLE_WEBSOCKETS?.toLowerCase() === "true" &&
      websockets(server);

    return app;
  }
}

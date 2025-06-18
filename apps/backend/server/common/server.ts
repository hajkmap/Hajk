import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { type WebSocketServer } from "ws";

import { randomUUID } from "crypto";
import fs from "fs";
import * as path from "path";
import { createServer, type Server as NodeServerType } from "http";
import { fileURLToPath } from "url";

import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import { legacyCreateProxyMiddleware as createProxyMiddleware } from "http-proxy-middleware";
import * as OpenApiValidator from "express-openapi-validator";

import expressSession from "express-session";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { PrismaClient } from "@prisma/client";

import { getCLFDate } from "./utils/get-clf-date.ts";
import log4js from "./utils/hajk-logger.js";
import { initRoutes } from "./routes.ts";
import websockets from "./websockets/index.ts";
import detailedRequestLogger from "./middlewares/detailed.request.logger.js";

import HttpStatusCodes from "./http-status-codes.ts";
import { HajkError, RouteError } from "./classes.ts";
import { HttpError } from "express-openapi-validator/dist/framework/types.js";
import { isInstanceOfPrismaError } from "./utils/is-instance-of-prisma-error.ts";

import { isAuthActive } from "./auth/is-auth-active.ts";
import { setupPassport } from "./auth/passport.middleware.ts";

const logger = log4js.getLogger("hajk");

// The source of truth regarding which API versions are allowed.
const ALLOWED_API_VERSIONS = [2, 3];

class Server {
  private app: Application;
  private server: NodeServerType;
  private wss: WebSocketServer | null = null;
  private apiVersions: number[];

  constructor() {
    logger.debug("Process's current working directory: ", process.cwd());

    // First things first...
    this.app = express();
    this.server = createServer(this.app);

    // Ensure that runtime requirements are met
    this.checkRuntimeVersion();

    // Figure out which API versions are valid and store results for later use (e.g. in router setup)
    this.apiVersions = this.setValidApiVersions();

    // Go on with the rest of the initialization. The reason why it's done in a separate
    // method, rather than directly in the constructor, is that we want to use async/await
    // during some parts of the initialization, while having an async constructor is not allowed.
    this.asyncInit();
  }

  private checkRuntimeVersion() {
    // Check engine version and display notice if applicable. We currently require
    // NodeJS v22.0.0 or higher, due to the use of experimental TS features.
    const recommendedMajorVersion = 22;
    if (
      Number.parseFloat(process.versions.node.split(".")[0]) <
      recommendedMajorVersion
    ) {
      logger.warn(
        `The current NodeJS runtime version (${process.version}) is lower than the recommended one (v${recommendedMajorVersion}.0.0). Some features will not be available. Consider upgrading to the recommended version in order to make use of all the latest features.`
      );
    }
  }

  private setValidApiVersions() {
    // Check which API versions should be enabled. We must do some work to ensure
    // that the value from .env is valid. But we have an early fallback, in case
    // no value is provided.
    const _apiVersionsFromConfig =
      process.env.API_VERSIONS?.trim?.().split(",").map(Number) ||
      ALLOWED_API_VERSIONS;

    // By now we'll always have a string, although it can be empty, or
    // contain invalid characters. Let's remove those faulty entries.
    const _apiVersions = _apiVersionsFromConfig.filter((v) => {
      // Attempt to parse as integer

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
    // in none valid entires). Take care of it by checking that the array isn't empty, fallback to defaults
    const apiVersions =
      _apiVersions.length === 0 ? ALLOWED_API_VERSIONS : _apiVersions;

    logger.info(
      "[API] Starting with the following API versions enabled:",
      apiVersions
    );

    // Finally, store as an app variable for later use across the app...
    this.app.set("apiVersions", apiVersions);

    // ...and return it, so the private field can be set in the constructor.
    return apiVersions;
  }

  private async asyncInit() {
    // Configure the "trust proxy" parameter of Express, https://expressjs.com/en/guide/behind-proxies.html
    this.setExpressTrustProxy();

    // Setup Log4JS for HTTP access logging
    this.setupLogging();

    // Helmet, CORS, GZIP etc middlewares must be set up early,
    // **before** any routes and parsers are setup.
    this.setupMiddlewares();

    // Body parsers, for JSON, URL encoded bodies, etc. must be
    // setup **before** any routes, so that they can be parsed properly.
    this.setupParsers();

    // Sessions are only available if API version 3 or higher is enabled.
    if (this.apiVersions.some((v) => v >= 3)) {
      this.setupSession();
    }

    // If .env tells that we should use authentication, let's
    // initiate PassportJS with all its strategies.
    if (isAuthActive) {
      setupPassport(this.app);
    }

    // Hajk's own proxies that can be configured in .env. Await, because
    // we must dynamically load the corresponding modules.
    await this.setupProxies();

    // Figure out if Hajks client app should be exposed under root (/)
    this.exposeHajksClientApplication();

    // Optionally, other directories (placed in "static/") can be exposed.
    // Await, because we must dynamically load the corresponding modules.
    await this.setupStaticDirs();

    // Setup the main application router (for "/api/vN" endpoints).
    // Await, because we must dynamically load the corresponding modules.
    await initRoutes(this.app);

    // Finally, expose the OpenAPI specifications on /api/vN/spec and
    // enabled the API validator middleware for all enabled
    // API versions.
    this.exposeOpenAPISpecifications();

    // Add error handler
    this.setupErrorHandler();
  }

  private setExpressTrustProxy() {
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

      this.app.set("trust proxy", trustProxy);
    }
  }

  private setupLogging() {
    // Configure the HTTP access logger. We want it to log in the Combined Log Format, which requires some custom configuration below.
    this.app.use(
      log4js.connectLogger(log4js.getLogger("http"), {
        format: (req: Request, res: Response, format) =>
          format(
            ":remote-addr - " + // Host name or IP of accesser. RFC 1413 identity (unreliable, hence always a dash)
              (req.get(process.env.AD_TRUSTED_HEADER || "X-Control-Header") ||
                "-") + // Value of X-Control-Header (or whatever header specified in .env)
              ` [${getCLFDate()}]` + // Timestamp string surrounded by square brackets, e.g. [12/Dec/2012:12:12:12 -0500]
              ' ":method :url HTTP/:http-version"' + // HTTP request surrounded by double quotes, e.g., "GET /stuff.html HTTP/1.1"
              ' :status :content-length ":referrer"' + // HTTP status code, content length in bytes and referer (where request came from to your site)
              ' ":user-agent"' // User agent string, e.g. name of the browser
          ),
      })
    );

    // eslint-disable-next-line
    process.env.LOG_DETAILED_REQUEST_LOGGER === "true" &&
      this.app.use(detailedRequestLogger);
  }

  private getCorsAllowedOriginsFromEnv() {
    if (
      !process.env.CORS_ALLOWED_ORIGINS ||
      process.env.CORS_ALLOWED_ORIGINS === "*"
    ) {
      return ["*"];
    }

    return process.env.CORS_ALLOWED_ORIGINS.split(",");
  }

  private setupMiddlewares() {
    this.app.use(
      helmet({
        contentSecurityPolicy: false, // If active, we get errors loading inline <script>
        crossOriginResourcePolicy: {
          policy: "cross-origin",
        },
        frameguard: false, // If active, other pages can't embed our maps
      })
    );

    const corsAllowedOrigins = this.getCorsAllowedOriginsFromEnv();

    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || corsAllowedOrigins.includes("*")) {
            return callback(null, "*");
          }
          if (corsAllowedOrigins.includes(origin)) {
            return callback(null, origin || true);
          }
          return callback(new Error("CORS error"));
        },
        optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
        credentials: true,
      })
    );

    // Enable compression early so that responses that follow will get gziped
    if (process.env.ENABLE_GZIP_COMPRESSION !== "false") {
      logger.trace("[HTTP] Enabling Hajk's built-in GZIP compression");
      this.app.use(compression());
    } else {
      logger.warn(
        `[HTTP] Not enabling GZIP compression. If this is a production environment 
you should make sure that you implement a reverse proxy that enables content compression. Alternatively, enable Hajk's 
built-it compression by setting the ENABLE_GZIP_COMPRESSION option to "true" in .env.`
      );
    }
  }

  private setupParsers() {
    this.app.use(express.json({ limit: process.env.REQUEST_LIMIT || "100kb" }));
    this.app.use(
      express.urlencoded({
        extended: true,
        limit: process.env.REQUEST_LIMIT || "100kb",
      })
    );
    this.app.use(express.text({ limit: process.env.REQUEST_LIMIT || "100kb" }));
  }

  private setupSession() {
    const sessionSecret = process.env.EXPRESS_SESSION_SECRET?.includes(",")
      ? process.env.EXPRESS_SESSION_SECRET?.split(",")
      : (process.env.EXPRESS_SESSION_SECRET ??
        "fallbackIfNoSecretProvidedInDotEnv");
    this.app.use(
      expressSession({
        secret: sessionSecret,
        name: process.env.EXPRESS_SESSION_NAME || "hajk.sid",
        store: new PrismaSessionStore(new PrismaClient(), {
          checkPeriod: 2 * 60 * 1000, //ms
          dbRecordIdIsSessionId: true,
          dbRecordIdFunction: undefined,
        }),
        cookie: {
          maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days, in ms. Consider shortening.
        },
        rolling: process.env.EXPRESS_SESSION_ROLLING === "true" || false, // Refresh session expiry on each request
        resave: false, // See documentation for `resave`. Our store implements the `touch()` method, so we can likely go with `false` here.
        /**
         * Forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified.
         * Choosing `false` is useful for implementing login sessions, reducing server storage usage, or complying with laws that require permission before setting a cookie.
         * Choosing `false` will also help with race conditions where a client makes multiple parallel requests without a session.
         *
         * The default value is `true`, but using the default has been deprecated, as the default will change in the future.
         * Please research into this setting and choose what is appropriate to your use-case.
         *
         * **If you are using `express-session` in conjunction with PassportJS:**
         * Passport will add an empty Passport object to the session for use after a user is authenticated, which will be treated as a modification to the session, causing it to be saved.
         * This has been fixed in PassportJS 0.3.0.
         */
        saveUninitialized: false, // TODO: Was true previously, let's see how it works out.
      })
    );
  }

  private async setupProxies() {
    // Await the setup of the proxies. They must complete before we
    // can continue and set up the parsers.
    await this.setupSokigoProxy();
    await this.setupFmeProxy();
    this.setupGenericProxy();
  }

  private exposeHajksClientApplication() {
    // Optionally, expose the Hajk client this.app directly under root (/)
    // eslint-disable-next-line
    process.env.EXPOSE_CLIENT === "true" &&
      this.app.use(
        "/",
        express.static(path.join(process.cwd(), "static", "client"))
      );
  }

  private async setupStaticDirs() {
    const l = log4js.getLogger("hajk.static");

    // Try to convert the value from config to an Int
    let normalizedStaticExposerVersion = Number.parseInt(
      process.env.STATIC_EXPOSER_VERSION?.trim?.() || ""
    );

    // If NaN, or if version required is not any of the active API versions,
    // let's fall back to the highest active version
    if (
      Number.isNaN(normalizedStaticExposerVersion) ||
      !this.apiVersions.includes(normalizedStaticExposerVersion)
    ) {
      normalizedStaticExposerVersion = Math.max(...this.apiVersions);
    }

    const apiVersion = normalizedStaticExposerVersion;

    l.info(
      `Attempting to expose static directories using Static Exposer from API V${apiVersion}`
    );

    try {
      // Dynamically import the required version of Static Restrictor middleware
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
        // Note that we don't really do anything about other special characters in the key name, so it's best
        // to keep the directory names inside /static/ limited to a-z, A-Z, 0-9, dashes and underscores.
        const dotEnvKeyName = `EXPOSE_AND_RESTRICT_STATIC_${dir
          .toUpperCase()
          .replace(/-/g, "_")}`;
        const restrictedToGroups = process.env[dotEnvKeyName];

        // Early check to see if the found directory should be exposed at all.
        if (restrictedToGroups === undefined) {
          l.warn(
            "The directory '%s' was found in static, but no setting could be found in .env. The directory will NOT be exposed. If you wish to expose it, add the key '%s' to your .env.",
            dir,
            dotEnvKeyName
          );

          // Nothing more to do for this iteration, let's skip the rest of it
          return;
        }

        // Sometimes, we may want to expose a static application that handles its routing
        // internally. In those cases, we want a catch-all middleware that sends the
        // requests to a specific file within the static dir. That file's name (typically, index.html)
        // can be configured in .env. If this key exists, we won't use the regular static middleware,
        // but will instead send the request to that file.
        const dotEnvKeyNameForCatchAll = `${dotEnvKeyName}_CATCH_ALL_FILENAME`; // replace all dashes and spaces with underscores
        const catchAllHandlerFileName = process.env[dotEnvKeyNameForCatchAll];

        // Save for later use
        const staticDirPath = path.join(process.cwd(), "static", dir);

        // Prepare the middlewares for the handler. We use arrays, as later on
        // we may want to insert an element into the beginning of the array (using unshift),
        // if the directory should to be restricted to certain AD groups.
        const staticMiddlewareHandlers = [express.static(staticDirPath)];
        const regexMiddlewareHandlers = [
          (_req: Request, res: Response) => {
            res.sendFile(
              path.join(staticDirPath, catchAllHandlerFileName || "")
            );
          },
        ];

        l.info("Exposing '%s' as static directory", dir);

        // Check if there are groups to restrict to, if so add the restrictStatic middleware
        // to the beginning of the array (will be used as a handler).
        if (
          typeof restrictedToGroups === "string" &&
          restrictedToGroups.length > 0
        ) {
          l.info(
            "Restricting access to '%s' to groups: %s",
            dir,
            restrictedToGroups
          );

          // Add the restriction middleware to the beginning of the array
          regexMiddlewareHandlers.unshift(restrictStatic);
          staticMiddlewareHandlers.unshift(restrictStatic);
        }

        // Expose the directory using the static middleware (it may or may not be restricted, see above).
        this.app.use(`/${dir}`, staticMiddlewareHandlers);

        // If a catch-all filename was specified for the directory, add a regex matcher and force all
        // request that don't match anything from the default static middleware to the catch-all handler.
        if (
          typeof catchAllHandlerFileName === "string" &&
          catchAllHandlerFileName.length > 0
        ) {
          // Create the RegEx that matches anything in the directory, e.g. /admin/foo/bar/baz.html
          const rx = new RegExp("/" + dir + "/(.*)");
          l.info(
            `Adding a catch-all route for '${dir}'. Any requests that don't match real files in '${dir}' will be forced to ${catchAllHandlerFileName}.`
          );

          // Use the RegEx (rather than a string) to match route, register a special handler that
          // forces those requests the specified file.
          this.app.use(rx, regexMiddlewareHandlers);
        }
      });
    } catch (error) {
      l.error(error);
      return { error };
    }
  }

  private exposeOpenAPISpecifications() {
    // Check the setting in .env to see if validation is wanted
    const validateResponses = !!(
      process.env.OPENAPI_ENABLE_RESPONSE_VALIDATION &&
      process.env.OPENAPI_ENABLE_RESPONSE_VALIDATION.toLowerCase() === "true"
    );

    this.apiVersions.forEach((v) => {
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
      this.app.use(`/api/v${v}/spec`, express.static(openApiSpecification));

      // …and apply the Validator middleware. We do it inside a timeout,
      // which isn't optimal. The reasoning behind is that we must "wait
      // a second or two" before we setup this middleware, to allow the
      // async imports (which are initiated earlier) to finish so that those
      // routes are set up when OAV runs its middleware. If we were to apply
      // the middleware directly, any non-existing routes (such as those being
      // created in async parts of the code) would render a 404 in the middleware.
      // Related to #1309. Discovered during PR in #1332.
      logger.trace(`[VALIDATOR] Setting up OpenApiValidator for /api/v${v}`);
      this.app.use(
        OpenApiValidator.middleware({
          apiSpec: openApiSpecification,
          validateResponses,
          validateRequests: {
            allowUnknownQueryParameters: true,
          },
          ignorePaths: /.*\/spec(\/|$)/,
        })
      );
    });
  }

  /**
   * Sets up the error handler, logs output to the console or file log, depending
   * on the configuration in .env. Also, ensures that user gets a correct response
   * with a suitable status code.
   */
  private setupErrorHandler() {
    this.app.use(
      (
        err: Error,
        _: Request,
        res: Response,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        next: NextFunction
      ) => {
        // First, let's generate an unique error ID. This will allow system administrators
        // to search for the error in the logs, while not exposing any sensitive
        // data in the response.
        const errorId = randomUUID();

        // Log to the default active logger, unless we're in test mode.
        if (process.env.NODE_ENV !== "test") {
          logger.error(`[ERROR ID ${errorId}]\n`, err);
        }

        // Set some default values for the response.
        let status = HttpStatusCodes.BAD_REQUEST;
        let message = err.message;
        let hajkCode: string | null = null;

        // Now, let's see if the error has some specific status code or
        // other parameters that would lead us to override the default
        // response values from the lines above.

        // Prisma errors unfortunately don't extend a common ancestor, so it's
        // a bit hacky to determine if an error comes from Prisma. But here it goes:
        if (isInstanceOfPrismaError(err)) {
          // Since Prisma's error messages are way to detailed for public consumption,
          // we just set a generic message in that case. Please note that
          // the real error message has already got written to the error log,
          // so the system administrators can retrieve it based on the error ID
          // sent in the response.
          status = HttpStatusCodes.INTERNAL_SERVER_ERROR;
          message = "Internal Database Server Error";
        }
        // Hajk errors come with a special property: hajkCode. Let's assign it so it
        // can be sent in the response later on.
        else if (err instanceof HajkError) {
          hajkCode = err.hajkCode;
          status = err.status;
        }
        // Let's use the fact that our own RouteError class, as well as all
        // errors that inherit from HttpError (which is part of OpenApiValidator)
        // come with a status property. That status is a valid HTTP status code
        // and we should use it in our response.
        else if (err instanceof RouteError || err instanceof HttpError) {
          status = err.status;
        }

        // Send error response, include the error ID for reference
        res.status(status).json({
          errorId,
          error: message,
          ...(hajkCode && { hajkCode }),
        });
      }
    );
  }

  private async setupSokigoProxy() {
    // Each API version has its own Sokigo proxy middleware. Let's iterate them.
    for await (const v of this.apiVersions) {
      // Don't enable FB Proxy if necessary env variable isn't sat
      if (
        process.env.FB_SERVICE_ACTIVE === "true" &&
        process.env.FB_SERVICE_BASE_URL !== undefined
      ) {
        const { default: sokigoFBProxy } = await import(
          `../apis/v${v}/middlewares/sokigo.fb.proxy.${v < 3 ? "js" : "ts"}`
        );
        this.app.use(`/api/v${v}/fbproxy`, sokigoFBProxy());
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

  private async setupFmeProxy() {
    // Each API version has its own FME proxy middleware. Let's iterate them.
    for await (const v of this.apiVersions) {
      // Don't enable FME-server Proxy if necessary env variable isn't sat
      if (
        process.env.FME_SERVER_ACTIVE === "true" &&
        process.env.FME_SERVER_BASE_URL !== undefined
      ) {
        const { default: fmeServerProxy } = await import(
          `../apis/v${v}/middlewares/fme.server.proxy.${v < 3 ? "js" : "ts"}`
        );

        this.app.use(`/api/v${v}/fmeproxy`, fmeServerProxy());
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
   * Creates proxies for endpoints specified in DOTENV as "PROXY_*".
   *
   * A proxy will be created for each of the active API versions.
   *
   * @example If admin configures a key named `PROXY_GEOSERVER` and enables
   * versions 1 and 2 of the API, the following endpoints will be made available:
   *
   * - `/api/v1/proxy/geoserver`
   * - `/api/v2/proxy/geoserver`
   *
   * @see https://github.com/hajkmap/Hajk/issues/824
   * @see https://github.com/hajkmap/Hajk/issues/1309
   */
  private setupGenericProxy() {
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
      for (const apiVersion of this.apiVersions) {
        proxyMap.forEach((v) => {
          // Grab context and target from current element
          const context = v.context;
          const target = v.target;
          l.trace(
            `Setting up proxy: /api/v${apiVersion}/proxy/${context} -> ${target}`
          );

          // Create the proxy itself
          this.app.use(
            `/api/v${apiVersion}/proxy/${context}`,
            createProxyMiddleware({
              logger: l,
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

  private setupGracefulShutdownHandler() {
    const shutdown = (signal: string, value: number) => {
      const shutdownExpressServer = () => {
        this.server.close(() => {
          logger.info(`Server stopped by ${signal} with value ${value}.`);

          // Finally, ensure that NodeJS process exists
          process.exit(0);
        });
      };
      logger.info("Shutdown requested…");

      // If we have set up a WebSocketServer...
      if (this.wss !== null) {
        // ...let's close it first, so that we don't accept any
        // incoming upgrade connections during the shutdown phase.
        this.wss.close(() => {
          logger.info(`Websockets closed by ${signal} with value ${value}.`);

          // Once WSS is down, let's close the HTTP server
          shutdownExpressServer();
        });
      }
      // Else, if we didn't activate WSS, let's close the HTTP server directly
      else {
        shutdownExpressServer();
      }
    };

    // Take care of graceful shutdown by defining signals that we want to handle.
    // Please note that SIGKILL signal (9) cannot be intercepted, so it's omitted.
    const signals: Record<string, number> = {
      SIGHUP: 1,
      SIGINT: 2,
      SIGTERM: 15,
    };

    // Create a listener for each of the signals that we want to handle
    Object.keys(signals).forEach((signal) => {
      process.on(signal, () => shutdown(signal, signals[signal]));
    });
  }

  public async listen() {
    // First start the WSS, if configured to do so
    if (process.env.ENABLE_WEBSOCKETS?.toLowerCase() === "true") {
      this.wss = await websockets(this.server);
    }

    // Figure out which port the server should listen on
    const port: number = Number.parseInt(process.env.PORT || "3000");

    // Graceful shutdown handler
    this.setupGracefulShutdownHandler();

    // Let's start listening
    this.server.listen(port, () =>
      logger.info(
        `Server launched on port ${port}. Some services may still be initiating. (http://localhost:${port})`
      )
    );
  }
}

export default new Server();

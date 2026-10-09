import helmet from "helmet";

import log4js from "./hajkLogger.js";

const logger = log4js.getLogger("hajk.security");

// Builds the options for the CORS and Helmet middlewares from .env.
// All settings are optional and the defaults match how Hajk has always
// behaved: any origin may call the API, there's no CSP and the maps
// can be embedded on any page. See the SECURITY HEADERS section in
// .env.example for a description of each setting.

const CSP_MODES = ["off", "report-only", "enforce"];

/**
 * @summary Grab a boolean from .env, with a fallback. Like
 * ExpressServer.grabDotEnvBoolean, but an empty value also gives the fallback.
 * @param {string} name Name of the .env variable
 * @param {boolean} defaultValue Value to use if the variable isn't set
 * @returns {boolean}
 */
const grabBoolean = (name, defaultValue) => {
  const value = process.env[name]?.trim();
  if (!value) return defaultValue;
  return value === "1" || value.toLowerCase() === "true";
};

/**
 * @summary Split a list from .env on commas and/or whitespace.
 * @param {string} name Name of the .env variable
 * @returns {string[]} Empty if the variable is missing
 */
const grabList = (name) =>
  (process.env[name] || "").split(/[\s,]+/).filter((v) => v.length > 0);

/**
 * @summary Parse CSP_DIRECTIVES, e.g. "img-src 'self' data:; connect-src 'self' https:",
 * into the format Helmet expects. A directive prefixed with "-" (e.g.
 * "-upgrade-insecure-requests") removes that directive from Helmet's defaults.
 * @returns {Object.<string, string[] | null>}
 */
const parseCspDirectives = () => {
  const directives = {};
  (process.env.CSP_DIRECTIVES || "")
    .split(";")
    .map((d) => d.trim().split(/\s+/))
    .filter(([name]) => name)
    .forEach(([name, ...values]) => {
      if (name.startsWith("-")) {
        directives[name.slice(1)] = null;
      } else {
        directives[name] = values;
      }
    });
  return directives;
};

/**
 * @summary Options for the cors middleware.
 * @returns {import("cors").CorsOptions}
 */
export const getCorsOptions = () => {
  const origins = grabList("CORS_ALLOWED_ORIGINS");
  const allowCredentials = grabBoolean("CORS_ALLOW_CREDENTIALS", false);

  const options = {
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  };

  if (origins.length === 0 || origins.includes("*")) {
    options.origin = "*";
    if (allowCredentials) {
      logger.warn(
        "CORS_ALLOW_CREDENTIALS is ignored because CORS_ALLOWED_ORIGINS allows any origin. Browsers don't allow credentials together with a wildcard origin."
      );
    }
    logger.debug("[CORS] Allowing requests from any origin");
  } else {
    options.origin = origins;
    if (allowCredentials) options.credentials = true;
    logger.info(
      "[CORS] Allowing requests from %o%s",
      origins,
      allowCredentials ? " (with credentials)" : ""
    );
  }

  return options;
};

/**
 * @summary Options for the Content-Security-Policy part of Helmet.
 * @returns {false | Object}
 */
const getCspOptions = () => {
  let mode = process.env.CSP_MODE?.trim().toLowerCase() || "off";
  if (!CSP_MODES.includes(mode)) {
    logger.warn(
      "Invalid CSP_MODE %o, expected one of %o. Falling back to %o.",
      mode,
      CSP_MODES,
      "off"
    );
    mode = "off";
  }

  const frameAncestors = grabList("CSP_FRAME_ANCESTORS");

  if (mode === "off") {
    if (frameAncestors.length === 0) {
      logger.debug("[CSP] Disabled");
      return false;
    }
    // No CSP besides the embedding restriction
    logger.info("[CSP] Only frame-ancestors is set: %o", frameAncestors);
    return {
      useDefaults: false,
      directives: {
        "default-src":
          helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc,
        "frame-ancestors": frameAncestors,
      },
    };
  }

  const directives = {
    // Helmet's default is 'self', which would stop other pages from
    // embedding our maps. Keep them embeddable unless told otherwise.
    "frame-ancestors": frameAncestors.length > 0 ? frameAncestors : ["*"],
    ...parseCspDirectives(),
  };
  logger.info(
    "[CSP] Mode %o, directives on top of Helmet's defaults: %o",
    mode,
    directives
  );
  return {
    useDefaults: true,
    directives,
    reportOnly: mode === "report-only",
  };
};

/**
 * @summary Options for the helmet middleware.
 * @returns {import("helmet").HelmetOptions}
 */
export const getHelmetOptions = () => {
  const options = {
    contentSecurityPolicy: getCspOptions(),
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
    // X-Frame-Options can't allow a list of sites, so we never send it.
    // Embedding is controlled with CSP_FRAME_ANCESTORS instead.
    frameguard: false,
  };

  if (!grabBoolean("HSTS_ENABLED", true)) {
    options.strictTransportSecurity = false;
    logger.info("[HSTS] Disabled");
  } else if (!grabBoolean("HSTS_INCLUDE_SUBDOMAINS", true)) {
    options.strictTransportSecurity = { includeSubDomains: false };
    logger.info("[HSTS] Not including subdomains");
  }

  return options;
};

import { rateLimit } from "express-rate-limit";

import log4js from "../utils/hajkLogger.js";

const logger = log4js.getLogger("hajk.ratelimit");

// Rate limiting is on by default. Admins can opt out by setting
// RATE_LIMIT_ENABLED=false (or 0) in .env.
const enabled = !["false", "0"].includes(
  process.env.RATE_LIMIT_ENABLED?.trim().toLowerCase()
);

/**
 * @summary Grab a positive integer from .env, with a fallback.
 * @param {string} name Name of the .env variable
 * @param {number} defaultValue Value to use if the variable is missing or invalid
 * @returns {number}
 */
const grabPositiveInt = (name, defaultValue) => {
  const value = Number.parseInt(process.env[name]);
  if (Number.isInteger(value) && value > 0) return value;
  if (process.env[name] !== undefined && process.env[name] !== "") {
    logger.warn(
      `Invalid value for ${name} in .env: "${process.env[name]}". Falling back to ${defaultValue}.`
    );
  }
  return defaultValue;
};

const windowMs = grabPositiveInt("RATE_LIMIT_WINDOW_MS", 60_000);

/**
 * @summary Create a rate limiter for one tier, or a no-op middleware if rate limiting is disabled.
 * @description Each tier keeps its own in-memory counter, keyed by req.ip. This means that
 * the 'trust proxy' setting (EXPRESS_TRUST_PROXY in .env) must be correct, or else all
 * users behind a reverse proxy will share one bucket.
 * @param {string} tier Name of the tier, used in logs
 * @param {string} envName Name of the .env variable that holds the limit for this tier
 * @param {number} defaultLimit Requests allowed per window and IP if nothing is set in .env
 * @returns {import("express").RequestHandler}
 */
const createLimiter = (tier, envName, defaultLimit) => {
  if (!enabled) return (req, res, next) => next();

  const limit = grabPositiveInt(envName, defaultLimit);
  logger.info(
    `Rate limiting tier "${tier}": ${limit} requests per ${windowMs} ms and IP.`
  );

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      logger.warn(
        `Rate limit exceeded in tier "${tier}" for ${req.ip}: ${req.method} ${req.originalUrl}`
      );
      res
        .status(options.statusCode)
        .json({ errors: [{ message: "Too many requests" }] });
    },
  });
};

if (enabled && !process.env.EXPRESS_TRUST_PROXY) {
  logger.warn(
    "Rate limiting is enabled but EXPRESS_TRUST_PROXY isn't set in .env. If Hajk runs behind a reverse proxy, all users will share one rate limit bucket."
  );
} else if (!enabled) {
  logger.info("RATE_LIMIT_ENABLED is set to false in .env. Not rate limiting.");
}

// Applies to all API routes (except proxies, which have their own tier)
export const globalLimiter = createLimiter(
  "global",
  "RATE_LIMIT_GLOBAL_MAX",
  600
);

// Applies to admin routes and other expensive endpoints, in addition to the global tier
export const adminLimiter = createLimiter("admin", "RATE_LIMIT_ADMIN_MAX", 100);

// Applies to the generic, FME and Sokigo proxies, which can carry a lot of map traffic
export const proxyLimiter = createLimiter(
  "proxy",
  "RATE_LIMIT_PROXY_MAX",
  3000
);

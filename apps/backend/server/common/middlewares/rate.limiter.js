import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import log4js from "../utils/hajkLogger.js";
import { grabPositiveInt } from "../utils/dotEnvHelpers.js";

const logger = log4js.getLogger("hajk.ratelimit");

// Rate limiting is on by default. Admins can opt out by setting
// RATE_LIMIT_ENABLED=false (or 0) in .env.
const enabled = !["false", "0"].includes(
  process.env.RATE_LIMIT_ENABLED?.trim().toLowerCase()
);

const defaultWindowMs = grabPositiveInt("RATE_LIMIT_WINDOW_MS", 60_000);

/**
 * @summary Create a rate limiter for one tier, or a no-op middleware if rate limiting is disabled.
 * @description Each tier keeps its own in-memory counter, keyed by req.ip. This means that
 * the 'trust proxy' setting (EXPRESS_TRUST_PROXY in .env) must be correct, or else all
 * users behind a reverse proxy will share one bucket.
 * @param {string} tier Name of the tier, used in logs
 * @param {string} envName Name of the .env variable that holds the limit for this tier
 * @param {number} defaultLimit Requests allowed per window and IP if nothing is set in .env
 * @param {object} [options]
 * @param {string} [options.windowEnvName] Name of the .env variable that holds this tier's own window length
 * @param {number} [options.defaultWindowMs] This tier's window length if nothing is set in .env
 * @param {import("express-rate-limit").ValueDeterminingMiddleware<string>} [options.keyGenerator] Custom key, default is the IP
 * @returns {import("express").RequestHandler}
 */
const createLimiter = (
  tier,
  envName,
  defaultLimit,
  { windowEnvName, defaultWindowMs: tierWindowMs, keyGenerator } = {}
) => {
  if (!enabled) return (req, res, next) => next();

  const limit = grabPositiveInt(envName, defaultLimit);
  const windowMs = windowEnvName
    ? grabPositiveInt(windowEnvName, tierWindowMs ?? defaultWindowMs)
    : defaultWindowMs;
  logger.info(
    `Rate limiting tier "${tier}": ${limit} requests per ${windowMs} ms and ${keyGenerator ? "user" : "IP"}.`
  );

  return rateLimit({
    windowMs,
    limit,
    ...(keyGenerator && { keyGenerator }),
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

// Applies to submissions of user feedback. Much stricter than the others, and counted
// per authenticated user if there is one (else per IP).
export const feedbackLimiter = createLimiter(
  "feedback",
  "RATE_LIMIT_FEEDBACK_MAX",
  10,
  {
    windowEnvName: "RATE_LIMIT_FEEDBACK_WINDOW_MS",
    defaultWindowMs: 3_600_000,
    keyGenerator: (req, res) =>
      res.locals.authUser
        ? `user:${res.locals.authUser}`
        : ipKeyGenerator(req.ip),
  }
);

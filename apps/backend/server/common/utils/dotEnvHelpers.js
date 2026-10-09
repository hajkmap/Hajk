import log4js from "./hajkLogger.js";

const logger = log4js.getLogger("hajk.dotenv");

// Small helpers for reading typed values from .env, with fallbacks.

/**
 * @summary Grab a boolean from .env, with a fallback. Like
 * ExpressServer.grabDotEnvBoolean, but an empty value also gives the fallback.
 * @param {string} name Name of the .env variable
 * @param {boolean} defaultValue Value to use if the variable isn't set
 * @returns {boolean}
 */
export const grabBoolean = (name, defaultValue) => {
  const value = process.env[name]?.trim();
  if (!value) return defaultValue;
  return value === "1" || value.toLowerCase() === "true";
};

/**
 * @summary Grab a positive integer from .env, with a fallback.
 * @param {string} name Name of the .env variable
 * @param {number} defaultValue Value to use if the variable is missing or invalid
 * @returns {number}
 */
export const grabPositiveInt = (name, defaultValue) => {
  const value = Number.parseInt(process.env[name]);
  if (Number.isInteger(value) && value > 0) return value;
  if (process.env[name] !== undefined && process.env[name] !== "") {
    logger.warn(
      `Invalid value for ${name} in .env: "${process.env[name]}". Falling back to ${defaultValue}.`
    );
  }
  return defaultValue;
};

/**
 * @summary Split a list from .env on commas and/or whitespace.
 * @param {string} name Name of the .env variable
 * @returns {string[]} Empty if the variable is missing
 */
export const grabList = (name) =>
  (process.env[name] || "").split(/[\s,]+/).filter((v) => v.length > 0);

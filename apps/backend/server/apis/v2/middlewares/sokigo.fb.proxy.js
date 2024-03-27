import { createProxyMiddleware } from "http-proxy-middleware";
import log4js from "log4js";

// Value of process.env.LOG_LEVEL will be one of the allowed
// log4js-values. We will customize HPM to use log4js too,
// but we needed to send a "logLevel" property which unfortunately
// allows only some of log4js's values. To make it work, we simply
// map the possible log4js values to one of the allowed HMP log level
// values.
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

// Grab a logger
const logger = log4js.getLogger("proxy.sokigo.v2");

export default function sokigoFBProxy(err, req, res, next) {
  return createProxyMiddleware({
    target: process.env.FB_SERVICE_BASE_URL,
    logLevel: "silent", // We don't care about logLevels[process.env.LOG_LEVEL] in this case as we log success and errors ourselves
    pathRewrite: (originalPath, req) => {
      // Remove the portion that shouldn't be there when we proxy the request
      // and split the remaining string on "?" to separate any query params
      let segments = originalPath.replace("/api/v2/fbproxy", "").split("?");

      // The path part is the first segment, prior "?"
      const path = segments[0];
      let query = `?Database=${process.env.FB_SERVICE_DB}&User=${process.env.FB_SERVICE_USER}&Password=${process.env.FB_SERVICE_PASS}`;

      // If there was another segment, it was the query string that we should preserve
      query = segments[1] ? query + "&" + segments[1] : query;

      logger.debug(`${req.method} ${originalPath} ~> ${path}${query}`);
      return path + query;
    },
    onError: (err, req, res) => {
      logger.error(err);
    },
  });
}

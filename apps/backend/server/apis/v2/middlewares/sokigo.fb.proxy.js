import { createProxyMiddleware } from "http-proxy-middleware";
import log4js from "log4js";

// Grab a logger
const logger = log4js.getLogger("proxy.sokigo.v2");

export default function sokigoFBProxy(_err, _req, _res, _next) {
  return createProxyMiddleware({
    target: process.env.FB_SERVICE_BASE_URL,
    logger: logger,
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
    on: {
      error: (err, _req, _res) => {
        logger.error(err);
      },
    },
  });
}

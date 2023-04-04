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
const logger = log4js.getLogger("proxy.fmeServer.v1");

export default function fmeServerProxy(err, req, res, next) {
  return createProxyMiddleware({
    target: process.env.FME_SERVER_BASE_URL,
    logLevel: logLevels[process.env.LOG_LEVEL],
    logProvider: () => logger,
    changeOrigin: true,
    secure: process.env.FME_SERVER_SECURE === "true", // should SSL certs be verified?
    onProxyReq: (proxyReq, req, res) => {
      // We have to add an authorization header to the request
      proxyReq.setHeader(
        "Authorization",
        `Basic ${Buffer.from(
          `${process.env.FME_SERVER_USER}:${process.env.FME_SERVER_PASSWORD}`
        ).toString("base64")}`
      );
    },
    pathRewrite: (originalPath, req) => {
      // Lets split on the proxy path so that we can remove that when forwarding
      const segments = originalPath.split("/api/v1/fmeproxy");

      // We want to forward everything that is after /api/v1/fmeproxy
      const path = segments[1];

      logger.debug(`${req.method} ${originalPath} ~> ${path}`);
      return path;
    },
    onError: (err, req, res) => {
      if (err) {
        logger.error(err);
        res.status(500).send("Request failed while proxying to FME-server.");
      }
    },
  });
}

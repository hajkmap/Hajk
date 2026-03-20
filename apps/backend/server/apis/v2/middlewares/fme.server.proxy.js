import { createProxyMiddleware } from "http-proxy-middleware";
import log4js from "log4js";

// Grab a logger
const logger = log4js.getLogger("proxy.fmeServer.v2");

export default function fmeServerProxy(_err, _req, _res, _next) {
  return createProxyMiddleware({
    target: process.env.FME_SERVER_BASE_URL,
    logger: logger,
    changeOrigin: true,
    secure: process.env.FME_SERVER_SECURE === "true", // should SSL certs be verified?
    on: {
      proxyReq: (proxyReq, _req, _res) => {
        // We have to add an authorization header to the request
        // There are 2 possibilities: with TOKEN or with USER/PASS.
        const value = process.env.FME_SERVER_TOKEN
          ? `fmetoken token=${process.env.FME_SERVER_TOKEN}`
          : `Basic ${Buffer.from(
              `${process.env.FME_SERVER_USER}:${process.env.FME_SERVER_PASSWORD}`
            ).toString("base64")}`;
        proxyReq.setHeader("Authorization", value);
      },
      error: (err, _req, res) => {
        if (err) {
          logger.error(err);
          res.status(500).send("Request failed while proxying to FME-server.");
        }
      },
    },
    pathRewrite: (originalPath, req) => {
      // Lets split on the proxy path so that we can remove that when forwarding
      const segments = originalPath.split("/api/v2/fmeproxy");

      // We want to forward everything that is after /api/v2/fmeproxy
      const path = segments[1];

      logger.debug(`${req.method} ${originalPath} ~> ${path}`);
      return path;
    },
  });
}

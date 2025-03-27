import log4js from "log4js";

const logger = log4js.getLogger("detailed.request.logger");

export default function detailedRequestLogger(req, res, next) {
  logger.trace("req.ip: %o", req.ip);
  logger.trace("req.ips: %o", req.ips);
  logger.trace(
    "req.connection.remoteAddress: %o",
    req.connection.remoteAddress
  );
  logger.trace("req.hostname: %o", req.hostname);
  logger.trace("AD_TRUSTED_PROXY_IPS: %o", process.env.AD_TRUSTED_PROXY_IPS);
  logger.trace(
    "EXPRESS_TRUST_PROXY: app.set('trust proxy', %o)",
    process.env.EXPRESS_TRUST_PROXY
  );
  next();
}

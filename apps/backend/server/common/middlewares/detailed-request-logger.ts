import log4js from "log4js";

const logger = log4js.getLogger("detailed.request.logger");

export default function detailedRequestLogger(req, res, next) {
  const col = (k) => (k + ":").padEnd(26);

  const allHeaders = Object.entries(req.headers);
  const xHeaders = allHeaders.filter(([k]) => k.startsWith("x-"));

  const lines = [
    ``,
    `┌─ ${req.method} ${req.originalUrl}`,
    `│`,
    `├─ Connection`,
    `│  ${col("ip")}${req.ip ?? "-"}`,
    `│  ${col("ips")}${JSON.stringify(req.ips)}`,
    `│  ${col("remote address")}${req.connection?.remoteAddress ?? "-"}`,
    `│  ${col("hostname")}${req.hostname ?? "-"}`,
    `│`,
    `├─ Proxy config`,
    `│  ${col("AD_TRUSTED_PROXY_IPS")}${process.env.AD_TRUSTED_PROXY_IPS ?? "(not set)"}`,
    `│  ${col("EXPRESS_TRUST_PROXY")}${process.env.EXPRESS_TRUST_PROXY ?? "(not set)"}`,
    `│`,
    `├─ X-* headers`,
    ...(xHeaders.length > 0
      ? xHeaders.map(([k, v]) => `│  ${col(k)}${v}`)
      : [`│  (none)`]),
    `│`,
    `└─ All headers`,
    ...allHeaders.map(([k, v]) => `   ${col(k)}${v}`),
    ``,
  ];

  logger.info(lines.join("\n"));
  next();
}

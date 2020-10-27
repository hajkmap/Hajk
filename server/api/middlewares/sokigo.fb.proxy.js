import { createProxyMiddleware } from "http-proxy-middleware";
import l from "../../common/logger";

export default function sokigoFBProxy(err, req, res, next) {
  return createProxyMiddleware({
    target: process.env.FB_SERVICE_BASE_URL,
    logLevel: "info",
    pathRewrite: (originalPath, req) => {
      l.info(req, "Request");
      l.info(originalPath, "Pre");
      // Remove the portion that shouldn't be there when we proxy the request
      // and split the remaining string on "?" to separate any query params
      let segments = originalPath.replace("/api/v1/proxy", "").split("?");

      // The path part is the first segment, prior "?"
      const path = segments[0];
      let query = `?Database=${process.env.FB_SERVICE_DB}&User=${process.env.FB_SERVICE_USER}&Password=${process.env.FB_SERVICE_PASS}`;

      // If there was another segment, it was the query string that we should preserve
      query = segments[1] ? query + "&" + segments[1] : query;

      l.info(path + query, "Post");
      return path + query;
    },
    onError: (err, req, res) => {
      l.error(err, req, res);
    },
  });
}

import { createProxyMiddleware } from "http-proxy-middleware";

export default function sokigoFBProxy(err, req, res, next) {
  return createProxyMiddleware({
    target: process.env.FB_SERVICE_BASE_URL,
    logLevel: "info",
    pathRewrite: (originalPath, req) => {
      // Remove the portion that shouldn't be there when we proxy the request
      // and split the remaining string on "?" to separate any query params
      let segments = originalPath.replace("/api/v1/proxy", "").split("?");

      // The path part is the first segment, prior "?"
      const path = segments[0];
      let query = `?Database=${process.env.FB_SERVICE_DB}&User=${process.env.FB_SERVICE_USER}&Password=${process.env.FB_SERVICE_PASS}`;

      // If there was another segment, it was the query string that we should preserve
      query = segments[1] ? query + "&" + segments[1] : query;

      console.info(
        "sokigo.fb.proxy.js - Rewrite:",
        `${originalPath} --> ${path}${query}`
      );
      return path + query;
    },
    onError: (err, req, res) => {
      console.error(err, req, res);
    },
  });
}

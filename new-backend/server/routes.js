// FIXME: This imports ignore the supported API versions and initiate all versions!
import v1Router from "./apis/v1/router";
import v2Router from "./apis/v2/router";

export default function routes(app) {
  app.use("/api/v1", v1Router);
  app.use("/api/v2", v2Router);
}

import "./common/env.js";
import Server from "./common/server.js";
import routes from "./routes.js";
import { preload } from "./apis/v2/services/informative/documentCache.js";

// router() is async (it awaits proxy + body-parser registration before mounting
// the API routers), so we start listening only once everything is wired up.
// When INFORMATIVE_CACHE_PRELOAD=true the App_Data cache is warmed before the
// server accepts any traffic; preload() never throws (bad files are logged
// and skipped), so a broken file can never block startup.
export default new Server().router(routes).then(async (server) => {
  if (process.env.INFORMATIVE_CACHE_PRELOAD === "true") {
    await preload();
  }
  return server.listen(process.env.PORT);
});

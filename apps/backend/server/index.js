import "./common/env.js";
import Server from "./common/server.js";
import routes from "./routes.js";

// router() is async (it awaits proxy + body-parser registration before mounting
// the API routers), so we start listening only once everything is wired up.
export default new Server()
  .router(routes)
  .then((server) => server.listen(process.env.PORT));

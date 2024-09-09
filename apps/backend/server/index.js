// env.js does not have any real export, so there's nothing to do
// with the imported variable. Let's disable the warning for this line:
// eslint-disable-next-line no-unused-vars
import Server from "./common/server.ts";
import routes from "./routes.js";

export default new Server().router(routes).listen(process.env.PORT);

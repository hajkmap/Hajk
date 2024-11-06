import * as express from "express";
import controller from "./controller.ts";

import passport from "passport";
import { isAuthenticated } from "../../../../common/auth/is-authenticated.middleware.ts";

export default express
  .Router()
  // Login and logout endpoints are public
  .post("/login/local", passport.authenticate("local"), controller.login)
  .post("/logout", controller.logout)
  // The remaining endpoints should only be accessible to authenticated users
  .use(isAuthenticated)
  .get("/user", controller.getUserInformation);

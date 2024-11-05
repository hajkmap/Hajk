import * as express from "express";
import controller from "./controller.ts";

import passport from "passport";
import { isAuthenticated } from "../../../../common/auth/is-authenticated.middleware.ts";

export default express
  .Router()
  .use("/login/local", passport.authenticate("local"), controller.login)
  .use("/user", isAuthenticated, controller.getUserInformation);

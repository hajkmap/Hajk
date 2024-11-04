import { Router } from "express";

import groupsRouter from "./controllers/groups/router.ts";
import layersRouter from "./controllers/layers/router.ts";
import mapsRouter from "./controllers/maps/router.ts";
import searchRouter from "./controllers/search/router.ts";
import servicesRouter from "./controllers/services/router.ts";
import toolsRouter from "./controllers/tools/router.ts";

import passport from "passport";
import { isAuthenticated } from "../../common/middlewares/auth.middleware.ts";

export default Router()
  .use("/groups", groupsRouter)
  .use("/layers", layersRouter)
  .use("/maps", mapsRouter)
  .use("/search", searchRouter)
  .use("/services", servicesRouter)
  .use("/tools", toolsRouter)
  .use("/login", passport.authenticate("local"), (req, res) => {
    res.json({
      status: "success",
      message: "You are successfully logged in.",
    });
  })
  .use("/user", isAuthenticated, (req, res) => {
    res.send({ user: req.user });
  });

import * as express from "express";

import configRouter from "./controllers/config/router.ts";

export default express.Router().use("/config", configRouter);

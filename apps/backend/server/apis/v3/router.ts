import * as express from "express";

import testRouter from "./controllers/test/router.ts";

export default express.Router().use("/test", testRouter);

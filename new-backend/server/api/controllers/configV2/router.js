import * as express from "express";
import controller from "./controller";

export default express.Router().get("/:map", controller.byMap); // Get specific map config

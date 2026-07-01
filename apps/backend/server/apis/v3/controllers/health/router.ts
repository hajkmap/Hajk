import * as express from "express";
import HealthController from "./controller.ts";

export default express.Router().get("/", HealthController.getHealth);

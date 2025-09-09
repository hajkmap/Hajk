import * as express from "express";
import WebsocketsController from "./controller.ts";

export default express.Router().get("/health", WebsocketsController.getHealth);

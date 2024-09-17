import * as express from "express";
import controller from "./controller.ts";

export default express.Router().post("/autocomplete", controller.autocomplete);

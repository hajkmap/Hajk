import * as express from "express";
import FilesController from "./controller.ts";

export default express.Router().get("/list", FilesController.list);

import * as express from "express";

import OgcController from "./controller.ts";

export default express
  .Router()
  .get("/wfst", OgcController.listWfstLayers)
  .get("/wfst/:id", OgcController.getWfstLayer);

import * as express from "express";
import controller from "./controller.ts";

export default express
  .Router()
  .get("/:variable", controller.test) // catch `/test/fooBar`
  .get("/", controller.test); // catch `/test`

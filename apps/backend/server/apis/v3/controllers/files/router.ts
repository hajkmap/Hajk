import { Router } from "express";
import controller from "./controller.ts";
import { asyncHandler } from "../../utils/async-handler.ts";

const router = Router();

router.get("/list", asyncHandler(controller.list.bind(controller)));

export default router;

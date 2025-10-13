import { Router } from "express";
import { DatabaseController } from "./controller.ts";
import { asyncHandler } from "../../utils/async-handler.ts";

const router = Router();
const controller = new DatabaseController();

router.post(
  "/export",
  asyncHandler(controller.exportDatabase.bind(controller))
);
router.post(
  "/import",
  asyncHandler(controller.importDatabase.bind(controller))
);
router.get("/status", asyncHandler(controller.getStatus.bind(controller)));
router.get("/tools", asyncHandler(controller.checkTools.bind(controller)));
router.get("/health", asyncHandler(controller.healthCheck.bind(controller)));

export default router;

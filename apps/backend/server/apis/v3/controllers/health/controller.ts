import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import type { Request, Response } from "express";

class HealthController {
  getHealth(_: Request, res: Response) {
    res.status(HttpStatusCodes.OK).json({ status: "ok" });
  }
}

export default new HealthController();

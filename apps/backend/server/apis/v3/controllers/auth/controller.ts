import type { Request, Response } from "express";

import HttpStatusCodes from "../../../../common/http-status-codes.ts";
// import { HajkError } from "../../../../common/classes.ts";
// import HajkStatusCodes from "../../../../common/hajk-status-codes.ts";

class AuthController {
  async login(req: Request, res: Response) {
    res.status(HttpStatusCodes.OK).json({
      status: "success",
      message: "You are successfully logged in.",
      user: req.user,
    });
  }

  async getUserInformation(req: Request, res: Response) {
    res.send({ user: req.user });
  }
}
export default new AuthController();

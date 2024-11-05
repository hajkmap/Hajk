import type { Request, Response, NextFunction } from "express";

import HttpStatusCodes from "../../../../common/http-status-codes.ts";
// import { HajkError } from "../../../../common/classes.ts";
// import HajkStatusCodes from "../../../../common/hajk-status-codes.ts";

class AuthController {
  async login(_req: Request, res: Response) {
    res.status(HttpStatusCodes.NO_CONTENT).end();
  }

  async getUserInformation(req: Request, res: Response) {
    res.status(HttpStatusCodes.OK).send({ user: req.user });
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      req.logout((err) => {
        if (err) {
          return next(err);
        }
        res.status(HttpStatusCodes.NO_CONTENT).end();
      });
    } catch (error) {
      next(error);
    }
  }
}
export default new AuthController();

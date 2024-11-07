import type { Request, Response } from "express";

import UsersService from "../../services/user.service.ts";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";

class UsersController {
  async getUsers(_: Request, res: Response) {
    const users = await UsersService.getUsers();
    return res.status(HttpStatusCodes.OK).json({ count: users.length, users });
  }
}
export default new UsersController();

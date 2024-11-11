import type { Request, Response } from "express";

import UsersService from "../../services/user.service.ts";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";

class UsersController {
  async getUsers(_: Request, res: Response) {
    const users = await UsersService.getUsers();
    return res.status(HttpStatusCodes.OK).json({ count: users.length, users });
  }

  async getUserById(req: Request, res: Response) {
    const user = await UsersService.getUserById(req.params.id);
    return res.status(HttpStatusCodes.OK).json(user);
  }

  async getRoles(_: Request, res: Response) {
    const roles = await UsersService.getRoles();
    return res.status(HttpStatusCodes.OK).json({ count: roles.length, roles });
  }

  async getRolesByUserId(req: Request, res: Response) {
    const roles = await UsersService.getRolesByUserId(req.params.id);
    return res.status(HttpStatusCodes.OK).json({ count: roles.length, roles });
  }
}
export default new UsersController();

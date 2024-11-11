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

  async createUserAndLocalAccount(req: Request, res: Response) {
    const user = await UsersService.createUserAndLocalAccount(req.body);
    return res.status(HttpStatusCodes.CREATED).json(user);
  }

  async createRole(req: Request, res: Response) {
    const role = await UsersService.createRole(req.body);
    return res.status(HttpStatusCodes.CREATED).json(role);
  }

  async updateUserAndLocalAccount(req: Request, res: Response) {
    const user = await UsersService.updateUserAndLocalAccount(
      req.params.id,
      req.body
    );
    return res.status(HttpStatusCodes.OK).json(user);
  }

  async updateRole(req: Request, res: Response) {
    const role = await UsersService.updateRole(req.params.id, req.body);
    return res.status(HttpStatusCodes.OK).json(role);
  }
}
export default new UsersController();

import type { Request, Response } from "express";

import UsersService from "../../services/user.service.ts";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import { asyncHandler } from "../../utils/async-handler.ts";

class UsersController {
  getUsers = asyncHandler(async (_: Request, res: Response) => {
    const users = await UsersService.getUsers();
    res.status(HttpStatusCodes.OK).json({ count: users.length, users });
  });

  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await UsersService.getUserById(req.params.id);
    res.status(HttpStatusCodes.OK).json(user);
  });

  getRoles = asyncHandler(async (_: Request, res: Response) => {
    const roles = await UsersService.getRoles();
    res.status(HttpStatusCodes.OK).json({ count: roles.length, roles });
  });

  getRolesByUserId = asyncHandler(async (req: Request, res: Response) => {
    const roles = await UsersService.getRolesByUserId(req.params.id);
    res.status(HttpStatusCodes.OK).json({ count: roles.length, roles });
  });

  createUserAndLocalAccount = asyncHandler(
    async (req: Request, res: Response) => {
      const user = await UsersService.createUserAndLocalAccount(req.body);
      res.status(HttpStatusCodes.CREATED).json(user);
    }
  );

  createRole = asyncHandler(async (req: Request, res: Response) => {
    const role = await UsersService.createRole(req.body);
    res.status(HttpStatusCodes.CREATED).json(role);
  });

  updateUserAndLocalAccount = asyncHandler(
    async (req: Request, res: Response) => {
      const user = await UsersService.updateUserAndLocalAccount(
        req.params.id,
        req.body
      );
      res.status(HttpStatusCodes.OK).json(user);
    }
  );

  updateRole = asyncHandler(async (req: Request, res: Response) => {
    const role = await UsersService.updateRole(req.params.id, req.body);
    res.status(HttpStatusCodes.OK).json(role);
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    await UsersService.deleteUser(req.params.id);
    res.status(HttpStatusCodes.NO_CONTENT).send();
  });
}
export default new UsersController();

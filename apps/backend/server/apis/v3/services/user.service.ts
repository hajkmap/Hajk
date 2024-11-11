import log4js from "log4js";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";

import prisma from "../../../common/prisma.ts";

const logger = log4js.getLogger("service.v3.layer");

class UserService {
  constructor() {
    logger.debug("Initiating User Service");
  }

  async getUsers() {
    return await prisma.user.findMany();
  }

  async getUserById(id: string) {
    return await prisma.user.findUnique({ where: { id } });
  }

  async getRoles() {
    return await prisma.role.findMany();
  }

  async getRolesByUserId(id: string) {
    return await prisma.roleOnUser.findMany({ where: { userId: id } });
  }

  async createUserAndLocalAccount(data: Prisma.LocalAccountCreateInput) {
    const p = await bcrypt.hash(data.password, 10);
    const localAccount = await prisma.localAccount.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        password: p,
        user: {
          create: {
            fullName: data.fullName,
            email: data.email,
            strategy: "LOCAL",
          },
        },
      },
      include: { user: true },
    });

    return localAccount.user;
  }

  async createRole(data: Prisma.RoleCreateInput) {
    const role = await prisma.role.create({ data });
    return role;
  }

  async updateUserAndLocalAccount(
    id: string,
    data: Prisma.LocalAccountUpdateInput
  ) {
    const { fullName, password } = data;

    if (typeof password === "string" && password.length < 5) {
      throw new Error(
        "Could not update password. Password must be at least 5 characters long."
      );
    }

    const p =
      typeof password === "string"
        ? await bcrypt.hash(password, 10)
        : undefined;

    await prisma.localAccount.update({
      where: { id: id },
      data: { fullName: fullName, password: p },
    });
    const user = await prisma.user.update({
      where: { id },
      data: { fullName },
    });
    return user;
  }

  async updateRole(id: string, data: Prisma.RoleUpdateInput) {
    const role = await prisma.role.update({
      where: { id },
      data: { ...data, id: undefined },
    });
    return role;
  }

  async deleteUser(id: string) {
    const user = await prisma.user.findFirstOrThrow({
      where: { id },
      select: { id: true, localAccount: { select: { id: true } } },
    });

    if (user.localAccount) {
      await prisma.localAccount.delete({ where: { id: user.localAccount.id } });
    }

    await prisma.user.delete({ where: { id: id } });
  }
}

export default new UserService();

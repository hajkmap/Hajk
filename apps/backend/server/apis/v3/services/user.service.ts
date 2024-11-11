import log4js from "log4js";

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
}

export default new UserService();

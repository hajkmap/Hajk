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
}

export default new UserService();

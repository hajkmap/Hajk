import { PrismaClient } from "@prisma/client";

// Prisma allows for a couple of different log levels, see:
// https://www.prisma.io/docs/orm/prisma-client/observability-and-logging/logging#the-log-option
const allowedLogLevels = ["query", "info", "warn", "error"];

// Let's see what sysadmin has configured in .env.
// Keep only those values that are allowed in Prisma.
const logLevels =
  process.env.PG_LOG_LEVELS?.split(",").filter((l) =>
    allowedLogLevels.includes(l)
  ) || [];

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient({ log: logLevels });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

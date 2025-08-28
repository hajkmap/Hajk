import path from "path";
import "dotenv/config";
import type { PrismaConfig } from "prisma/config";

export default {
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "node --env-file=.env prisma/seed.js",
  },
} satisfies PrismaConfig;

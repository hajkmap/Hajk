// eslint-disable-next-line
import * as express from "express";
import type { AuthStrategy } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: string;
      fullName: string;
      email: string;
      strategy: AuthStrategy;
    }
  }
}

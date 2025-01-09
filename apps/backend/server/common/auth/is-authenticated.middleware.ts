import type { NextFunction, Request, Response } from "express";
import HttpStatusCodes from "../http-status-codes.ts";
import { isAuthActive } from "./is-auth-active.ts";

/**
 * Middleware to check if authentication should take place, and
 * if yes, if user is authenticated.
 */
export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (isAuthActive === false || req.user) {
    return next();
  } else {
    res.status(HttpStatusCodes.UNAUTHORIZED).end();
  }
}

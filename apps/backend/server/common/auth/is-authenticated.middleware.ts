import type { NextFunction, Request, Response } from "express";
import HttpStatusCodes from "../http-status-codes.ts";

export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.user) {
    return next();
  } else {
    res.status(HttpStatusCodes.UNAUTHORIZED).end();
  }
}

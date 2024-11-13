import type { NextFunction, Request, Response } from "express";
import HttpStatusCodes from "../http-status-codes.ts";
import { getUserRoles } from "./get-user-roles.ts";

export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(HttpStatusCodes.UNAUTHORIZED).end();
  }

  const userRoles = await getUserRoles(req.user);

  if (userRoles.includes("ADMIN")) {
    return next();
  } else {
    return res
      .status(HttpStatusCodes.FORBIDDEN)
      .json({ message: "Forbidden: Only accessible for admin users." });
  }
}

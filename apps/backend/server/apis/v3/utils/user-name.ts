import type { Request, Response } from "express";

import ad from "../services/activedirectory.service.ts";

/** The login's name, else the AD account's display name, else the account. */
export async function userNameOf(
  req: Request,
  res: Response
): Promise<string | null> {
  if (req.user?.fullName) return req.user.fullName;
  const account = res.locals.authUser;
  if (typeof account !== "string" || account === "") return null;
  const adUser = await ad.findUser(account);
  return typeof adUser?.displayName === "string" && adUser.displayName !== ""
    ? adUser.displayName
    : account;
}

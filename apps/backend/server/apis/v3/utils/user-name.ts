import type { Request, Response } from "express";

import ad from "../services/activedirectory.service.ts";

/** The AD account the request runs as, when the AD lookup found one. */
export function adUserOf(res: Response): string | undefined {
  const account = res.locals.authUser;
  return typeof account === "string" && account !== "" ? account : undefined;
}

/** The login's name, else the AD account's display name, else the account. */
export async function userNameOf(
  req: Request,
  res: Response
): Promise<string | null> {
  if (req.user?.fullName) return req.user.fullName;
  const account = adUserOf(res);
  if (account === undefined) return null;
  const adUser = await ad.findUser(account);
  return typeof adUser?.displayName === "string" && adUser.displayName !== ""
    ? adUser.displayName
    : account;
}

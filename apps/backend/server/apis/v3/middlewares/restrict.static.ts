import log4js from "log4js";
import ad from "../services/activedirectory.service.ts";
import type { NextFunction, Request, Response } from "express";

const logger = log4js.getLogger("hajk.static.restrict.v3");

/**
 * Middleware to restrict access to static content based on user's AD group membership.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function.
 * @returns {Promise<void>} A promise that resolves when the middleware completes.
 *
 * @description
 * This middleware checks if the current user is a member of any of the required groups
 * to access a given path. It uses the req.baseUrl to find a corresponding setting in .env.
 * The setting for baseUrl "/foo-bar" should be named "EXPOSE_AND_RESTRICT_STATIC_FOO_BAR".
 * It splits the value of that key to an array and checks if the current user is a member
 * of any of those groups. Access is granted as soon as a match is found. If no match is found,
 * it means the user isn't a member of any required groups and lacks permission to access the requested path.
 *
 * @throws {403} Forbidden - If the user is not a member of any required groups.
 */
export default async function restrictStatic(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // If AD lookup isn't active, there's no way for us to find
  // out if access should be granted.
  if (process.env.AD_LOOKUP_ACTIVE !== "true") {
    logger.warn(
      "AD lookup disabled! Anyone will have access to all exposed static directories. Please be aware that this scenario is insecure."
    );
    return next();
  }

  // Grab dir name, required to find the correct .env variable
  const dir = req.baseUrl.replace(/\//g, "");

  // Get allowed groups from the .env variable, split string to array
  const restrictedToGroups =
    process.env[
      `EXPOSE_AND_RESTRICT_STATIC_${dir.toUpperCase().replace(/-/g, "_")}`
    ]?.split(",");

  // Save user name to eliminate multiple calls to the same method
  const user = ad.getUserFromRequestHeader(req);

  // Save user name so that it's available to following middleware
  res.locals.authUser = user;

  logger.trace(
    "Access to '%s' is limited to the following groups: '%s'. Checking if user '%s' is member in any of them.",
    req.baseUrl,
    restrictedToGroups,
    res.locals.authUser
  );

  if (restrictedToGroups) {
    for await (const group of restrictedToGroups) {
      // Check if current user is member of the admins AD group
      const allowed = await ad.isUserMemberOf(user, group);
      if (allowed === true) {
        logger.trace(
          "'%s' is member of '%s' which gives access to '%s'",
          user,
          group,
          req.baseUrl
        );

        // If access is granted there's no reason to continue the loop - just return.
        return next();
      }
    }
  }

  // If we got here, access is restricted. No next(), but don't forget to send the 403 as response!
  logger.warn(
    "'%s' is not member in any of the groups required to access %s.",
    user,
    req.baseUrl
  );
  res.sendStatus(403);
}

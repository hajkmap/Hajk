import log4js from "log4js";
import ad from "../services/activedirectory.service";

const logger = log4js.getLogger("hajk.static.restrict");
/**
 * @summary Determine if current user is member in any of the required groups in order to access a given path.
 *
 * @description Given the req.baseUrl, see if there's a corresponding setting in .env.
 * The setting for baseUrl "/foo-bar" should be named "EXPOSE_AND_RESTRICT_STATIC_FOO_BAR".
 * Split the value of that key to an array and check if the current user is member
 * in any of those groups. As soon as a match is found, grant access and quit the loop. If the loop
 * is done and no match could be found, it means that user isn't member in any
 * of the required groups and lacks permission to the requested path.
 *
 * @export
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
export default async function restrictStatic(req, res, next) {
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

  for await (let group of restrictedToGroups) {
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

  // If we got here, access is restricted. No next(), but don't forget to send the 403 as response!
  logger.warn(
    "'%s' is not member in any of the groups required to access %s.",
    user,
    req.baseUrl
  );
  res.sendStatus(403);
}

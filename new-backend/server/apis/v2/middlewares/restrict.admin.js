import log4js from "log4js";
import ad from "../services/activedirectory.service";

const logger = log4js.getLogger("router.v2");

export default async function restrictAdmin(req, res, next) {
  logger.trace("Attempt to access admin API methods");

  // If AD lookup isn't active, there's no way for us to find
  // out if access should be granted. Warn and allow access for everyone.
  if (process.env.AD_LOOKUP_ACTIVE !== "true") {
    logger.warn(
      "AD lookup disabled! Anyone will have access to all admin-only endpoints! Please be aware that this scenario is insecure."
    );
    return next();
  }

  // Looks like AD auth is active. But before we can see if current user
  // is authorized to do admin stuff, we must see which group is
  // specified as admin group - if none is set, we cannot continue!
  let adminGroups = process.env.RESTRICT_ADMIN_ACCESS_TO_AD_GROUPS;
  if (adminGroups === undefined || adminGroups.trim().length === 0) {
    logger.error(
      "Cannot verify admin access because no admin group is specified in config. Make sure that RESTRICT_ADMIN_ACCESS_TO_AD_GROUPS is set in .env."
    );
    return res.sendStatus(500);
  }

  // Save user name to eliminate multiple calls to the same method
  const user = ad.getUserFromRequestHeader(req);

  // Save user name so that it's available to following middleware
  res.locals.authUser = user;

  logger.trace(
    "Access to admin endpoints is limited to the following groups: '%s'. Checking if user '%s' is member in any of them.",
    adminGroups,
    user
  );

  // Convert comma-separated list of allowed groups to an array
  adminGroups = adminGroups.split(",");

  // Check if user is a member in at least one of the specified admins AD groups
  for await (let group of adminGroups) {
    const allowed = await ad.isUserMemberOf(user, group);
    if (allowed === true) {
      logger.trace(
        "'%s' is member of '%s' which gives access to '%s'. Access to admin granted.",
        user,
        group,
        req.baseUrl
      );

      // If access is granted there's no reason to continue the loop
      return next();
    }
  }

  // If we got out of the loop, it means that "return" wasn't called,
  // because user isn't member in any of the specified groups. Warn and exit.
  logger.warn(
    "Access to admin forbidden. %o is not member of %o.",
    user,
    adminGroups
  );

  // Access forbidden. NB: calling next() because we don't want any following middleware will run
  res.sendStatus(403);
}

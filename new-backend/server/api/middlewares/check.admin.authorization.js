import log4js from "log4js";
import ad from "../services/activedirectory.service";

const logger = log4js.getLogger("router");

export default async function (req, res, next) {
  logger.trace("Attempt to access admin methods");

  // If AD lookup isn't active, there's no way for us to find
  // out if access should be granted. However, webmaster has
  // specified EXPOSE_ADMIN, so we must respect it. Allow access for everyone.
  if (process.env.AD_LOOKUP_ACTIVE !== "true") {
    logger.warn(
      "AD lookup disabled! Anyone will have access to all admin-only methods! Please be aware that this scenario is insecure."
    );
    return next();
  }

  // Looks like AD auth is active. But before we can see if current user
  // is authorized to do admin stuff, we must see which group is
  // specified as admin group - if none is set, we cannot continue!
  const adminGroup = process.env.RESTRICT_ADMIN_ACCESS_TO_AD_GROUP;
  if (adminGroup === undefined || adminGroup.trim().length === 0) {
    logger.error(
      "Cannot verify admin access because no admin group is specified in config. Make sure that RESTRICT_ADMIN_ACCESS_TO_AD_GROUP is set in .env."
    );
    return res.status(500).end();
  }

  // Save user name to eliminate multiple calls to the same method
  const user = ad.getUserFromRequestHeader(req);

  // Save user name so that it's available to following middleware
  res.locals.authUser = user;

  // Check if current user is member of the admins AD group
  const allowed = await ad.isUserMemberOf(user, adminGroup);

  if (allowed) {
    logger.trace(
      "Access to admin granted. %o is member of %o.",
      user,
      adminGroup
    );
    // Access granted! Go on with the next middleware.
    return next();
  } else {
    logger.warn(
      "Access to admin forbidden. %o is not member of %o.",
      user,
      adminGroup
    );
    res.statusStatus(403);
    // Here we aren't calling next() so no following middlewares will run
  }
}

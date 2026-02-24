import ad from "../../apis/v2/services/activedirectory.service.js";
import { requestContext } from "../utils/requestContext.js";

export default function extractUserContext(req, res, next) {
  // If the requested path is in the AD_SKIP_LOOKUP_FOR_PATHS list, skip the lookup.
  // Useful to e.g. silence logs for health check endpoints or robots.txt (as
  // once we get into ad.getUserFromRequestHeader(), we'll see tons of logs in the TRACE level).
  if (process.env.AD_SKIP_LOOKUP_FOR_PATHS?.split(",").includes(req.path)) {
    return next();
  }

  // Call the real AD lookup function.
  const user = ad.getUserFromRequestHeader(req);

  // Save the user to res.locals. Used everywhere in Express middleware chain.
  res.locals.authUser = user;

  // Also, let's save the user object into the request context's Store.
  // This will give code that _doesn't_ have the access to
  // res.locals access to the authenticated user object. One way we'll use it
  // is in a logging middleware (see: hajkLogger.js).
  requestContext.run({ user }, () => next());
}

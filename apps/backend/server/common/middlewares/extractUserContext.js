import ad from "../../apis/v2/services/activedirectory.service.js";
import { requestContext } from "../utils/requestContext.js";

export default function extractUserContext(req, res, next) {
  // This was previously called all over the place whenever we needed user details
  const user = ad.getUserFromRequestHeader(req);

  // Save the user to res.locals. Used everywhere in Express, cheap and safe.
  res.locals.authUser = user;

  // The new thing is that we now also save the user object into the request
  // context's Store. This will give code that _doesn't_ have the access to
  // res.locals access to the authenticated user object. One way we'll use it
  // is in a logging middleware.
  requestContext.run({ user }, () => next());
}

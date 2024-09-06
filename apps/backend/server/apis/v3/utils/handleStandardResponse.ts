import type { Response } from "express";

/**
 * @summary Helper for handling "normal" responses from the APIs various services
 * @description We expect our service functions, which are Promises, to either resolve
 * to some data object or to reject. In case of rejection, we expect the property "error"
 * to be present on the returned data object. In that case, we send response status 500,
 * together with the error message. Else, we simply send the data as JSON-encoded body of the response.
 * @export
 */
export default function handleStandardResponse(
  res: Response,
  data: any,
  successStatus = 200
) {
  // If we encountered a error…
  if (data.error) {
    // Check if it's AccessError. If so, send a 403 Forbidden.
    // Otherwise, send a generic status 500.
    res
      .status(data.error.name === "AccessError" ? 403 : 500)
      .send(data.error.toString());
  }
  // If there's no error, send the response
  else {
    res.status(successStatus).json(data);
  }
}

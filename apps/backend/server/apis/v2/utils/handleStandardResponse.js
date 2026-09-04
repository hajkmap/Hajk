/**
 * @summary Helper for handling "normal" responses from the APIs various services
 * @description We expect our service functions, which are Promises, to either resolve
 * to some data object or to reject. In case of rejection, we expect the property "error"
 * to be present on the returned data object. In that case, we send response status 500,
 * together with the error message. Else, we simply send the data as JSON-encoded body of the response.
 * @export
 * @param {*} res The HTTP response object
 * @param {*} data The data Promise that our various services return
 */
export default function handleStandardResponse(res, data, successStatus = 200) {
  // If we encountered a error…
  if (data?.error) {
    const error = data.error;

    // 1. Determine Status Code
    // Priority: Explicit statusCode property -> Node.js ENOENT (404) -> Default (500)
    let status = error.statusCode || 500;
    if (error.code === "ENOENT") {
      status = 404;
    }

    // 2. Standardize Error Payload
    // Always return a JSON object with 'error' and optional 'details'
    const errorPayload = {
      error: error.message || error.toString(),
      ...(error.details && { details: error.details }),
      ...(error.configName && { config: error.configName }),
    };

    return res.status(status).json(errorPayload);
  }
  // If there's no error, send the response
  else {
    res.status(successStatus).json(data);
  }
}

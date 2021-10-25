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
  if (!data || data.error) res.status(500).send(data.error.toString());
  else res.status(successStatus).json(data);
}

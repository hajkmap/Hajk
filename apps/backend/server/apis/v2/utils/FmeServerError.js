/**
 * @summary Basic Error class with unique 'name' property to make it easy
 * to distinguish FME-server errors from others.
 *
 * @export
 * @class FmeServerError
 * @extends {Error}
 */
export default class FmeServerError extends Error {
  get name() {
    return "FmeServerError";
  }
}

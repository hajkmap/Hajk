/**
 * @summary Basic Error class with unique 'name' property to make it easy
 * to distinguish FME-server errors from others.
 *
 * @export
 * @class FmeServerError
 * @extends {Error}
 */
export default class FmeServerError extends Error {
  constructor(message, options) {
    super(message, options);
    this.statusCode = 502;
  }

  get name() {
    return "FmeServerError";
  }
}

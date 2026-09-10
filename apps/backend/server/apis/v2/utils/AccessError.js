/**
 * @summary Basic Error class with unique 'name' property to make it easy
 * to distinguish AccessError.
 *
 * @export
 * @class AccessError
 * @extends {Error}
 */

export class AccessError extends Error {
  constructor(message, options) {
    super(message, options);
    this.statusCode = 403;
  }

  get name() {
    return "AccessError";
  }
}

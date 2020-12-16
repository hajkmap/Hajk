/**
 * @summary Basic Error class with unique 'name' property to make it easy
 * to distinguish AD errors from others.
 *
 * @export
 * @class ActiveDirectoryError
 * @extends {Error}
 */
export default class ActiveDirectoryError extends Error {
  get name() {
    return "ActiveDirectoryError";
  }
}

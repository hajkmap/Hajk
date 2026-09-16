/**
 * @summary Basic Error class with unique 'name' property to make it easy
 * to distinguish AD errors from others.
 *
 * @export
 * @class ActiveDirectoryError
 * @extends {Error}
 */
export default class ActiveDirectoryError extends Error {
  public statusCode: number;

  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.statusCode = 500;
  }

  public override get name(): string {
    return "ActiveDirectoryError";
  }
}

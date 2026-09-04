/**
 * @summary Basic Error class with unique 'name' property to make it easy
 * to distinguish ConfigParseError, thrown when a config JSON file fails
 * to parse. Carries the name of the offending config file.
 *
 * @export
 * @class ConfigParseError
 * @extends {Error}
 */

export class ConfigParseError extends Error {
  constructor(message, configName, options) {
    super(message, options);
    this.configName = configName;
  }

  get name() {
    return "ConfigParseError";
  }
}

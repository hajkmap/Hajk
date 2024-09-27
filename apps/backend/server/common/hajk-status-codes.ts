/**
 * Hajk status codes.
 * A list of common Hajk-specific error codes and their description.
 *
 * The convention for error codes is:
 *   - DBxxx: Database errors (i.e. requested entities do not exist in the database)
 *   - CFxxx: Configuration errors (i.e. the system is somehow misconfigured, in broad terms)
 *   - (feel free to extend this list and conventions)
 */
enum HajkStatusCodes {
  /**
   * The requested tool type does not exist in the database.
   */
  UNKNOWN_TOOL_TYPE = "DB001",

  /**
   * The requested layer ID does not exist in the database.
   */
  UNKNOWN_LAYER_ID = "DB002",

  /**
   * The requested map name does not exist in the database.
   */
  UNKNOWN_MAP_NAME = "DB003",

  /**
   * The requested service ID does not exist in the database.
   */
  UNKNOWN_SERVICE_ID = "DB004",

  /**
   * The requested layer type is not one of the valid ones. Valid layer
   * types are defined by the enum LayerType.
   */
  UNKNOWN_LAYER_TYPE = "CF001",

  SEARCH_SERVICE_NOT_AVAILABLE = "CF002",

  /**
   * The request body is invalid, e.g. lacks some required fields.
   */
  INVALID_REQUEST_BODY = "RQ001",
}

export default HajkStatusCodes;

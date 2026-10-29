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
   * The requested group ID does not exist in the database.
   */
  UNKNOWN_GROUP_ID = "DB005",

  /**
   * A service with this URL and type already exists.
   */
  SERVICE_ALREADY_EXISTS = "DB006",

  /**
   * A map with this name already exists.
   */
  MAP_ALREADY_EXISTS = "DB013",
  /**
   * Service deletion is blocked because the service is still referenced.
   */
  SERVICE_DELETE_BLOCKED_BY_REFERENCES = "DB007",

  /**
   * Group deletion is blocked because the group is still used on one or more maps.
   */
  GROUP_DELETE_BLOCKED_BY_REFERENCES = "DB008",
  /**
   * The requested layer type is not one of the valid ones. Valid layer
   * types are defined by the enum LayerType.
   */
  UNKNOWN_LAYER_TYPE = "CF001",

  SEARCH_SERVICE_NOT_AVAILABLE = "CF002",

  /**
   * Selected layer names must exist on the remote service's GetCapabilities response.
   */
  INVALID_SELECTED_LAYERS = "CF003",

  /**
   * Remote GetCapabilities request failed or returned unusable data.
   */
  UPSTREAM_CAPABILITIES_FAILED = "CF004",

  /**
   * A Hajk layer for the same service + selectedLayers + layerKind already
   * exists. The client can override by retrying with `force: true`.
   */
  LAYER_ALREADY_PUBLISHED = "CF005",

  /**
   * The editing layer's url is empty, not http(s), or on a host that WFS_ALLOWED_HOSTS leaves out.
   */
  LAYER_URL_NOT_ALLOWED = "CF006",

  /**
   * The requested document name does not exist in the given map + folder.
   */
  UNKNOWN_DOCUMENT = "DB012",

  /**
   * A document with this name already exists in the given map + folder.
   */
  DOCUMENT_ALREADY_EXISTS = "DB009",

  /**
   * The requested folder name does not exist in the given map.
   */
  UNKNOWN_FOLDER = "DB010",

  /**
   * The requested theme does not exist in the given map.
   */
  UNKNOWN_THEME = "DB014",

  /**
   * The folder cannot be deleted because it still contains documents.
   */
  FOLDER_NOT_EMPTY = "DB011",

  /**
   * The request body is invalid, e.g. lacks some required fields.
   */
  INVALID_REQUEST_BODY = "RQ001",

  /**
   * The user is not authenticated.
   */
  USER_NOT_AUTHENTICATED = "RQ002",

  /**
   * The user is not authorized for this resource.
   */
  USER_NOT_AUTHORIZED = "RQ003",
}

export default HajkStatusCodes;

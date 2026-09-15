/**
 * Merges URL search/hash parameters into the map config object and sets
 * related fields on the AppModel instance (layersFromParams, etc.).
 *
 * @param {object} appModel - The AppModel instance
 * @param {object} mapConfig - The map config to mutate and return
 * @param {object} paramsAsPlainObject - URL params as a plain key/value object
 * @returns {object} The mutated mapConfig
 */
export function mergeConfigWithValuesFromParams(
  appModel,
  mapConfig,
  paramsAsPlainObject
) {
  // clean is used to strip the UI of all elements so we get a super clean viewport back, without any plugins
  const clean =
    Boolean(Object.hasOwn(paramsAsPlainObject, "clean")) &&
    paramsAsPlainObject.clean !== "false" &&
    paramsAsPlainObject.clean !== "0";

  // Merge query params to the map config from JSON
  let x = parseFloat(paramsAsPlainObject.x),
    y = parseFloat(paramsAsPlainObject.y),
    z = parseInt(paramsAsPlainObject.z, 10);

  if (typeof paramsAsPlainObject.l === "string") {
    appModel.layersFromParams = paramsAsPlainObject.l.split(",");
  }

  if (typeof paramsAsPlainObject.gl === "string") {
    try {
      appModel.groupLayersFromParams = JSON.parse(paramsAsPlainObject.gl);
    } catch (_error) {
      console.error(
        "Couldn't parse the group layers parameter. Attempted with this value:",
        paramsAsPlainObject.gl
      );
    }
  }

  if (Number.isNaN(x)) {
    x = mapConfig.map.center[0];
  }
  if (Number.isNaN(y)) {
    y = mapConfig.map.center[1];
  }
  if (Number.isNaN(z)) {
    z = mapConfig.map.zoom;
  }

  mapConfig.map.clean = clean;
  mapConfig.map.center[0] = x;
  mapConfig.map.center[1] = y;
  mapConfig.map.zoom = z;

  // f contains our CQL Filters
  const f = paramsAsPlainObject.f;
  if (f) {
    // Filters come as a URI encoded JSON object, so we must parse it first
    appModel.cqlFiltersFromParams = JSON.parse(decodeURIComponent(f));
  }

  // If the 'p' param exists, we want to modify which plugins are visible at start
  const pluginsToShow = paramsAsPlainObject?.p?.split(",");
  if (pluginsToShow) {
    // If the value of 'p' is an empty string, it means that no plugin should be shown at start
    if (pluginsToShow.length === 1 && pluginsToShow[0] === "") {
      mapConfig.tools.forEach((t) => {
        t.options.visibleAtStart = false;
      });
    }
    // If 'p' exists but is not an empty string, we have a list of plugins that should be
    // shown at start. All others should be hidden (no matter the setting in Admin).
    else {
      mapConfig.tools.forEach((t) => {
        t.options.visibleAtStart = pluginsToShow.includes(t.type.toLowerCase());
      });
    }
  }

  // If enableAppStateInHash exists in params, let's override
  // the corresponding setting from map config. This allows users
  // to activate live hash params (#1252).
  const enableAppStateInHash = Object.hasOwn(
    paramsAsPlainObject,
    "enableAppStateInHash"
  );
  if (enableAppStateInHash) {
    console.info("Activating live updating of query parameters");
    mapConfig.map.enableAppStateInHash = true;
  }

  return mapConfig;
}

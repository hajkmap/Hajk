/**
 * HOW TO USE THIS HELPER
 * Import this helper wherever you want to use the get/set methods.
 * This helper is initiated once, on export, and we set the key name
 * once (in index.js), so you don't have to worry about the details.
 * Just get/set whatever you want.
 *
 * Please note however that THERE IS A TWIST HERE TO THE  USUAL LOCAL STORAGE
 * behavior!
 *
 * A. This helper is map-specific. That means that ALL SETTINGS RELATED TO A
 * MAPCONFIG WILL BE HELD IN ONE KEY/VALUE PAIR IN LOCAL STORAGE.
 * B. Because we only have one value to play with for all the settings, and
 * LocalStorage stores values as string, we utilized JSON.stringify and JSON.parse.
 *
 * === Example for map config 'map_1' ===
 * We can use this helper as follows.
 *
 * === Storing map-specific data ===
 * LocalStorageHelper.set("foobar", [1,2,3]);
 *
 * This will create/modify the following in browser's LocalStorage:
 * map_options_map_1: "{\"foobar\":[1,2,3]}"
 * If there were any other keys (except "foobar") THEY WON'T BE TOUCHED!
 *
 * === Retrieving map-specific data ===
 * LocalStorageHelper.get("foobar", "default value")
 *
 * This can do one of two things:
 * - if there was a key named "foobar" for current entry, we'll get the JSON.parsed results
 * - if there was no entry named "foobar", we'll get "default value" back
 */
class LocalStorageHelper {
  mapName = "map_options_unknown_map";
  /**
   * @summary We want each map to have its own settings in LS, so we use mapConfig's name
   * as a key for the LS property.
   * @description This will normally be called once, when the map is initiated. All subsequent
   * use (getting and setting values) will read this key's value.
   *
   * @param {string} [mapName="unknown_map"]
   * @memberof LocalStorageHelper
   */
  setKeyName(mapName = "unknown_map") {
    this.mapName = `map_options_${mapName}`;
  }

  // Helper that "translates" the dot notation into a getter from a nested object.
  getValueFromPath = (obj, path) =>
    path.split(".").reduce((r, k) => r?.[k], obj);

  /**
   * @summary Get map-specific settings from LocalStorage for the given key, fallback to supplied default
   * if parsing not possible.
   *
   * @param {*} key
   * @param {*} [defaults={}]
   * @returns
   * @memberof
   */
  get(key, defaults = {}, useGlobal = false) {
    try {
      const mapName = useGlobal ? "global_options" : this.mapName;

      // Return a shallow merged objects with
      return {
        ...defaults, // …supplied defaults, that can be overwritten by…
        ...JSON.parse(window.localStorage.getItem(mapName))[
          key // …whatever exists in local storage for the specified key
        ],
      };
    } catch (error) {
      // If parsing failed, return defaults
      return defaults;
    }
  }

  /**
   * @summary Use the key as a path to transverse the map settings object
   * and retrieve the desired key.
   * @example LocalStorageHelper._experimentalGet("sketch.drawStyleSettings.fillColor", "#efefef")
   * @param {*} key The path used to get the value
   * @param {*} [defaults={}]
   * @param {boolean} [useGlobal=false]
   * @return {*}
   * @memberof LocalStorageHelper
   */
  _experimentalGet(key, defaults = {}, useGlobal = false) {
    try {
      const mapName = useGlobal ? "global_options" : this.mapName;

      const mapSettings = JSON.parse(window.localStorage.getItem(mapName));
      return this.getValueFromPath(mapSettings, key) || defaults;
    } catch (error) {
      // If parsing failed, return defaults
      return defaults;
    }
  }

  // _setExperimental(key, value, useGlobal = false) {
  //   const mapName = useGlobal ? "global_options" : this.mapName;
  //   const s = key.split(".").reverse();
  //   console.log("s: ", s, value);
  // }

  /**
   * @summary Save any JSON-able value to a specified key in a local storage object specific to current map
   *
   * @param {*} key Name of the key inside the JSON object
   * @param {*} value Value that the key will be set to
   * @memberof
   */
  set(key, value, useGlobal = false) {
    const mapName = useGlobal ? "global_options" : this.mapName;
    window.localStorage.setItem(
      mapName, // Use a map-specific name as key for LocalStorage setting
      JSON.stringify({
        ...JSON.parse(window.localStorage.getItem(mapName)),
        [key]: value,
      })
    );
  }
}

// Export singleton instance
/* eslint import/no-anonymous-default-export: [2, {"allowNew": true}] */
export default new LocalStorageHelper();

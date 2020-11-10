import fs from "fs";
import path from "path";

class ConfigService {
  constructor() {
    // TODO: As reading files is expansive, we can read all
    // JSON files on init and keep then in-memory. Subsequent
    // reads will be served from this in-memory store.
    // We should also implement an update-store method, perhaps
    // have a global bus (using EventEmitter?), so we can trigger
    // re-reads from FS into our in-memory store.
  }

  /**
   * @summary Get contents of a map configuration as JSON object
   *
   * @param {*} map Name of the map configuration
   * @returns Map config contents in JSON
   * @memberof ConfigService
   */
  async getMapConfig(map) {
    try {
      const pathToFile = path.join(process.cwd(), "App_Data", `${map}.json`);
      const text = await fs.promises.readFile(pathToFile, "utf-8");
      const json = await JSON.parse(text);
      return json;
    } catch (error) {
      return { error };
    }
  }

  /**
   * @summary Export baselayers, groups, and layers from a map configuration
   * to the specified format (currently only JSON is supported, future options
   * could include e.g. XLSX).
   *
   * @param {string} [map="layers"] Name of the map to be explained
   * @param {string} [format="json"] Desired output format
   * @param {*} next Callback, contain error object
   * @returns Human-friendly description of layers used in the specified map
   * @memberof ConfigService
   */
  async exportMapConfig(map = "layers", format = "json", next) {
    // Obtain layers definition as JSON. It will be needed
    // both if we want to grab all available layers or
    // describe a specific map config.
    const layersConfig = await this.getMapConfig("layers");

    // Create a Map, indexed with each map's ID to allow
    // fast lookup later on
    const layersById = new Map();

    // Populate the Map so we'll have {layerId: layerCaption}
    for (const type in layersConfig) {
      layersConfig[type].map((layer) =>
        layersById.set(layer.id, {
          name: layer.caption,
          ...(layer.layers &&
            layer.layers.length > 1 && { subLayers: layer.layers }),
        })
      );
    }

    // If a list of all available layers was requested, we're
    // done here and can return the Map.
    if (map === "layers") return Object.fromEntries(layersById); // TODO: Perhaps sort on layer name?

    // If we got this far, we now need to grab the contents of
    // the requested map config.
    const mapConfig = await this.getMapConfig(map);

    // Some clumsy error handling
    if (mapConfig.error) {
      next(mapConfig.error);
      return;
    }

    // Grab LayerSwitcher's setup
    const { groups, baselayers } = mapConfig.tools.find(
      (tool) => tool.type === "layerswitcher"
    ).options;

    // Define a recursive function that will grab contents
    // of a group (and possibly all groups beneath).
    const decodeGroup = (group) => {
      const g = {};
      // First grab current group's name
      if (group.name) g.name = group.name;

      // Next assign names to all layers
      if (Array.isArray(group.layers))
        g.layers = group.layers.map((l) => layersById.get(l.id));

      // Finally, go recursive if there are subgroups
      if (group.groups && group.groups.length !== 0) {
        g.groups = group.groups.map((gg) => decodeGroup(gg));
      }

      return g;
    };

    // Prepare the object that will be returned
    const output = {
      baselayers: [],
      groups: [],
    };

    // Grab names for base layers and put into output
    baselayers.map((l) => output.baselayers.push(layersById.get(l.id)));

    // Take all groups and call our decode method on them
    output.groups = groups.map((group) => decodeGroup(group));

    if (format === "json") return output;

    // Throw error if output is not yet implemented
    next(Error(`Output format ${format} is not implemented.`));
  }

  /**
   * @summary List all available map configurations files
   *
   * @returns
   * @memberof ConfigService
   */
  async getAvailableMaps() {
    try {
      const dir = path.join(process.cwd(), "App_Data");
      // List dir contents, the second parameter will ensure we get Dirent objects
      const dirContents = await fs.promises.readdir(dir, {
        withFileTypes: true,
      });
      const availableMaps = dirContents
        .filter(
          (entry) =>
            // Filter out only files (we're not interessted in directories).
            entry.isFile() &&
            // Filter out the special case, layers.json file.
            entry.name !== "layers.json" &&
            // Only JSON files
            entry.name.endsWith(".json")
        )
        // Create an array using name of each Dirent object, remove file extension
        .map((entry) => entry.name.replace(".json", ""));
      return availableMaps;
    } catch (error) {
      return { error };
    }
  }

  /**
   * @summary Duplicate a specified map
   *
   * @param {*} src Map to be duplicated
   * @param {*} dest Name of the new map, the duplicate
   * @returns
   * @memberof ConfigService
   */
  async duplicateMap(src, dest) {
    try {
      let srcPath = null;

      if (src.endsWith(".template")) {
        // If src ends with ".template", don't add the .json file extension,
        // and look inside /templates directory.
        srcPath = path.join(process.cwd(), "App_Data", "templates", src);
      } else {
        // Else it's a regular JSON file, add the extension and look in App_Data only
        srcPath = path.join(process.cwd(), "App_Data", src + ".json");
      }

      // Destination will always need the extension added
      const destPath = path.join(process.cwd(), "App_Data", dest + ".json");

      // Copy!
      await fs.promises.copyFile(srcPath, destPath);
      // Sending a valid object will turn it into JSON which in turn will return
      // status 200 and that empty object. I know it's not the best way and we
      // should be more explicit about successful returns than just an empty object…
      return {};
    } catch (error) {
      return { error };
    }
  }

  /**
   * @summary Create a new map, using supplied name, but duplicating the default map template
   *
   * @param {*} name Name given to the new map
   * @memberof ConfigService
   */
  async createNewMap(name) {
    return this.duplicateMap("map.template", name);
  }

  /**
   * @summary Delete a map configuration
   *
   * @param {*} name Map configuration to be deleted
   * @memberof ConfigService
   */
  async deleteMap(name) {
    try {
      // Prepare path
      const filePath = path.join(process.cwd(), "App_Data", name + ".json");
      await fs.promises.unlink(filePath);
      return {};
    } catch (error) {
      return { error };
    }
  }
}

export default new ConfigService();

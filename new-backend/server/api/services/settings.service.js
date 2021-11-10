import fs from "fs";
import path from "path";
import ConfigService from "./config.service";

class SettingsService {
  /**
   * @summary Helper that returns a unique ID, used e.g. to
   * generate an ID when new layers are created.
   *
   * @returns {string} uniqueId
   * @memberof SettingsService
   */
  async generateId() {
    // Prepare the recursive part. It takes an array of existing layers
    // as argument and returns a random string if it doesn't exist in
    // the array yet.
    const seedAndReturnIfUnique = (existingIds) => {
      // The IDs is generated as follows: Math.random() returns a 0-13 characters number, usually around 12 characters.
      // Calling toString with radix 36 will return a Base36 number (see https://en.wikipedia.org/wiki/Base36).
      // The returned number is between 0 and 1, hence it starts with "0.". We remove the leading zero and
      // limit the length to 6 using slice.
      //
      // The string return will have 36^6 possible combinations, which should do for a while.
      const proposedId = Math.random().toString(36).slice(2, 8); // Create a new string, something like '3mu2zq'
      return existingIds.has(proposedId) // If the newly created string exists in the array already…
        ? seedAndReturnIfUnique(existingIds) // …try seeding a new one. Else…
        : proposedId; // …just return generated string.
    };

    // Start with reading the store
    const layersStore = await this.readFileAsJson("layers.json");

    // Extract all IDs to a flat array
    const existingIds = Object.values(layersStore)
      .flat()
      .map((l) => l.id);

    // Invoke the recursive part, supply a Set of existing IDs, for comparison.
    return seedAndReturnIfUnique(new Set(existingIds));
  }

  getFullPathToFile(file) {
    return path.join(process.cwd(), "App_Data", file);
  }

  async readFileAsJson(file) {
    // Open file containing our store
    const text = await fs.promises.readFile(
      this.getFullPathToFile(file),
      "utf-8"
    );
    // Parse the file content so we get an object
    const json = await JSON.parse(text);
    return json;
  }

  async createOrUpdateLayer(type, newLayer) {
    try {
      // Will hold HTTP status (201 for created, 200 for updated layers),
      // see https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.6
      let status = null;

      // Another legacy bug: layer types are in pluralis in layers.json,
      // but the incoming request to PUT is in singular. We must fix it below:
      type = type + "s";

      // Parse the file content so we get an object
      const layersStore = await this.readFileAsJson("layers.json");

      // Store contains multiple layer types (wmslayers, wfslayers, etc).
      // We're only interested in one type.
      const layersType = layersStore[type];
      if (layersType === undefined) {
        throw new Error(`Layer type "${type}" not found in layers database.`);
      }

      // This method is called both on PUT (update existing) and
      // POST (create new). In the second case, ID will be missing
      // and we need to generate it.
      let layersTypeWithChanges = undefined;

      // If updating an existing layer…
      if (newLayer.id !== null) {
        // …find the object with current ID and remove it from array
        // (so we don't end up with duplicates)
        layersTypeWithChanges = layersType.filter((x) => x.id !== newLayer.id);
        status = 200;
      } else {
        // If ID was null, generate a new ID.
        //
        // IMPORTANT: Ignore the warning saying that "await has no effect on this type of expression".
        // It does, as without it, we return a pending Promise, instead of its resolved value.
        // eslint-disable-next-line
        newLayer.id = await this.generateId();
        layersTypeWithChanges = layersType; // No need to clean up existing data, just use as is
        status = 201;
      }

      // Push the new layer object (from request body) into our existing array of layers
      layersTypeWithChanges.push(newLayer);

      // Put the new array of layers into right place in our store
      layersStore[type] = layersTypeWithChanges;

      // Stringify using 2 spaces as indentation and write to file
      await fs.promises.writeFile(
        this.getFullPathToFile("layers.json"),
        JSON.stringify(layersStore, null, 2)
      );
      return {
        status,
        newLayer,
      };
    } catch (error) {
      return { error };
    }
  }

  async deleteLayer(type, layerId) {
    try {
      // Deleting a layer is a two-step operation:
      // 1) check in all map configs if specified ID was used, and remove entry if found
      // 2) remove the specified layer (by ID) from layers store (layers.json)

      // Step 1: get all map config files
      const mapConfigs = await ConfigService.getAvailableMaps();

      // Loop all existing map config files…
      for (const file of mapConfigs) {
        // …and invoke the remove layer function
        await this.removeLayerIdFromFile(layerId, file);
      }

      // Step 2: remove entry from layers store
      // FIXME: Buggy Admin UI legacy: layer types are in pluralis in layers.json,
      // but the incoming request is singular. We must fix it below:
      type = type + "s";

      // Parse the file content so we get an object
      const layersStore = await this.readFileAsJson("layers.json");

      // Store contains multiple layer types (wmslayers, wfslayers, etc).
      // We're only interested in one type.
      const layersType = layersStore[type];
      if (layersType === undefined) {
        throw new Error(`Layer type "${type}" not found in layers database`);
      }

      const id = layersType.findIndex((l) => l.id === layerId);
      if (id !== -1) {
        layersType.splice(id, 1); // Remove one element, starting at the found ID. Will modify existing array

        // Put back our modified array of objects to the layers store
        layersStore[type] = layersType;

        // Stringify using 2 spaces of indentation and write to file
        await fs.promises.writeFile(
          this.getFullPathToFile("layers.json"),
          JSON.stringify(layersStore, null, 2)
        );

        // On success, return the new contents of the store (without the deleted layer)
        return layersType;
      } else {
        throw new Error(
          `Layer with id ${layerId} not found in ${type} in global layers store`
        );
      }
    } catch (error) {
      return { error };
    }
  }

  async removeLayerIdFromFile(layerId, file) {
    // Helper function: will be used with .map() to recursively traverse our groups/layers tree.
    // Please note that spliceByLayerId makes use of the "modified" flag, defined outside it.
    const spliceByLayerId = (group) => {
      // First see if we find the ID we're looking for in layers array of current group
      const index =
        group.layers && group.layers.findIndex((l) => l.id === layerId);

      // If group.layers doesn't exist, index will be undefined.
      // If layerId wasn't found, index will be -1.
      if (index !== undefined && index !== -1) {
        // If we got this far, remove the entry at specified index from the layers array
        group.layers.splice(index, 1);

        // Set modified flag, so we really do save the file later on
        modified = true;
      }

      if (group.groups) {
        group.groups = group.groups.map(spliceByLayerId);
      }

      return group;
    };

    // Helper function, used to remove references to a layer from Search tool's options
    const removeLayerIdFromSearchSources = (searchSources) => {
      const index = searchSources.findIndex((l) => l === layerId);
      // If layerId was found in searchSources…
      if (index !== -1) {
        // …remove it…
        searchSources.splice(index, 1);

        // … and set the modified flag in order to save the file later on.
        modified = true;
      }

      // Either way, return the array
      return searchSources;
    };

    // This flag will be set spliceByLayerId only if changes have been made to the
    // current file. This way we only write to filesystem if it's necessary.
    let modified = false;

    // Read file contents into JSON
    const json = await this.readFileAsJson(file + ".json");

    // Find index of LayerSwitcher in map's tools
    const layerSwitcherToolIndex = json.tools.findIndex(
      (t) => t.type === "layerswitcher"
    );

    // Put options to an object - this will be the main object we'll work on here
    const lsOptions = json.tools[layerSwitcherToolIndex].options;

    // Check in groups, recursively
    lsOptions.groups = lsOptions.groups.map(spliceByLayerId);

    // Check in baselayers, a bit of a special case as options.baselayers already
    // contains the elements (without neither .layers nor .groups properties, as
    // expected by spliceByLayerId). Hence we wrap .baselayers in a temporary .layers property.
    lsOptions.baselayers = spliceByLayerId({
      layers: lsOptions.baselayers,
    }).layers;

    // If current map config has the Search plugin active, we must
    // check if current layer's ID is found in the "searchSources" array
    // of Search's options. If found, let's remove the ID from there.
    const searchToolIndex = json.tools.findIndex((t) => t.type === "search");
    const searchOptions = json.tools[searchToolIndex]?.options;
    if (
      searchOptions !== undefined &&
      Array.isArray(searchOptions.selectedSources)
    ) {
      searchOptions.selectedSources = removeLayerIdFromSearchSources(
        searchOptions.selectedSources
      );
    }

    // If any of the above resulted in modified file, write the changes
    if (modified === true) {
      // Use the found index of LayerSwitcher to entirely replace
      // the "options" property on that object
      json.tools[layerSwitcherToolIndex].options = lsOptions;

      // Do the same for the options of Search tool
      json.tools[searchToolIndex].options = searchOptions;

      // Write changes to file
      await fs.promises.writeFile(
        "App_Data/" + file + ".json",
        JSON.stringify(json, null, 2)
      );
    }
  }

  async updateMapFile(mapFile, incomingConfig, reqUrl) {
    try {
      // Determine which part of map file should be written
      // by matching everything between "/" and "?". For example:
      // reqUrl = "/toolsettings?mapFile=default.json", will give us
      // validUrl[0] => toolsettings.
      const validUrl = /(?<=\/)(.*?)(?=\?)/.exec(reqUrl);
      if (!Array.isArray(validUrl))
        throw new Error(`Invalid URL request: ${reqUrl}`);
      const portion = validUrl[0];

      // Parse the file content so we get an object
      const mapConfig = await this.readFileAsJson(mapFile);

      // START: Fix because of buggy Admin, we want "true" -> true and "false" -> false.
      const lsString = await JSON.stringify(incomingConfig)
        .replace(/"true"/gi, true)
        .replace(/"false"/gi, false);
      const lscObject = await JSON.parse(lsString);
      // END: Fix.

      // Find the relevant portion in our map config (using the "portion"
      // variable) and replace with the object we got in request body.
      switch (portion) {
        case "layermenu":
          mapConfig.tools.find(
            (tool) => tool.type === "layerswitcher"
          ).options = lscObject;
          break;
        case "mapsettings":
          mapConfig.map = lscObject;
          break;
        case "toolsettings":
          mapConfig.tools = lscObject;
          break;
        default:
          break;
      }

      // Write, format with 2 spaces indentation
      await fs.promises.writeFile(
        this.getFullPathToFile(mapFile),
        JSON.stringify(mapConfig, null, 2)
      );

      return { mapConfig };
    } catch (error) {
      return { error };
    }
  }
}

export default new SettingsService();

import fs from "fs";
import path from "path";
import ConfigService from "./config.service";
const crypto = require("crypto");

class SettingsService {
  generateId() {
    return crypto.randomBytes(16).toString("hex");
  }

  async readFileAsJson(file) {
    // Open file containing our store
    const pathToFile = path.join(process.cwd(), "App_Data", file);
    const text = await fs.promises.readFile(pathToFile, "utf-8");
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

      // Open file containing our store
      const pathToFile = path.join(process.cwd(), "App_Data", "layers.json");
      const text = await fs.promises.readFile(pathToFile, "utf-8");

      // Parse the file content so we get an object
      const layersStore = await JSON.parse(text);

      // Store contains multiple layer types (wmslayers, wfslayers, etc).
      // We're only interested in one type.
      const layersType = layersStore[type];
      if (layersType === undefined) {
        throw `Layer type "${type}" not found in layers database.`;
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
        // ID was null, generate a new ID
        newLayer.id = this.generateId();
        layersTypeWithChanges = layersType; // No need to clean up existing data, just use as is
        status = 201;
      }

      // Push the new layer object (from request body) into our existing array of layers
      layersTypeWithChanges.push(newLayer);

      // Put the new array of layers into right place in our store
      layersStore[type] = layersTypeWithChanges;

      // Stringify using 2 spaces as indentation and write to file
      fs.writeFileSync(pathToFile, JSON.stringify(layersStore, null, 2));
      return {
        status,
        newLayer,
      };
    } catch (error) {
      return error;
    }
  }

  async deleteLayer(type, layerId) {
    const mapConfigs = await ConfigService.getAvailableMaps();

    for (const file of mapConfigs) {
      await this.removeLayerIdFromFile(type, layerId, file);
    }

    // Open layers JSON
    // Remove type.layerId
    // List contents of directory
    // for
    return "ok";
  }

  async removeLayerIdFromFile(type, layerId, file) {
    const json = await this.readFileAsJson(file + ".json");
    let options = json.tools.find((t) => t.type === "layerswitcher").options;

    // Flag, will be set to true if we .pop anything from the array anywhere
    let modified = false;

    // TODO: Recursive loop options.baselayers and options.groups for o=>o.id===layerId, .pop if found

    // Write changes if needed
    if (modified) {
      // fs.writeFileSync("App_Data/"+file+".json", JSON.stringify(json, null, 2));
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
      // Open file containing our store
      const pathToFile = path.join(process.cwd(), "App_Data", mapFile);
      const mapConfigFile = await fs.promises.readFile(pathToFile, "utf-8");

      // Parse the file content so we get an object
      const mapConfig = await JSON.parse(mapConfigFile);

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
      fs.writeFileSync(pathToFile, JSON.stringify(mapConfig, null, 2));

      return { mapConfig };
    } catch (error) {
      return error;
    }
  }
}

export default new SettingsService();

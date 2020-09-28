import fs from "fs";
import path from "path";

class SettingsService {
  async createOrUpdateLayer(type, newLayer) {
    try {
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

      // If object with current id already exist, remove it from array
      let cleanedUp = layersType.filter((x) => x.id !== newLayer.id);

      // Push the new object (from request body) into our array of layers
      cleanedUp.push(newLayer);

      // Put the new array of layers into right place in our store
      layersStore[type] = cleanedUp;

      // Stringify using 2 spaces as indentation and write to file
      fs.writeFileSync(pathToFile, JSON.stringify(layersStore, null, 2));
      return {
        newLayer,
      };
    } catch (error) {
      return error;
    }
  }

  async updateLayerSwitcher(mapFile, layerSwitcherConfig) {
    try {
      // Open file containing our store
      const pathToFile = path.join(process.cwd(), "App_Data", mapFile);
      const mapConfigFile = await fs.promises.readFile(pathToFile, "utf-8");

      // Parse the file content so we get an object
      const mapConfig = await JSON.parse(mapConfigFile);

      // START: Fix because of buggy Admin, we want "true" -> true and "false" -> false.
      const lsString = await JSON.stringify(layerSwitcherConfig)
        .replace(/"true"/gi, true)
        .replace(/"false"/gi, false);
      const lscObject = await JSON.parse(lsString);
      // END: Fix.

      // Find the relevant portion in our map config file and
      // replace with the object we got in request body.
      mapConfig.tools.find(
        (tool) => tool.type === "layerswitcher"
      ).options = lscObject;

      // Write, format with 2 spaces indentation
      fs.writeFileSync(pathToFile, JSON.stringify(mapConfig, null, 2));

      return { lscObject };
    } catch (error) {
      return error;
    }
  }
}

export default new SettingsService();

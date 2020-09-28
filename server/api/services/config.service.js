import l from "../../common/logger";
import fs from "fs";
import path from "path";

class ConfigService {
  constructor() {
    l.info("Initiating ConfigService");
    // TODO: As reading files is expansive, we can read all
    // JSON files on init and keep then in-memory. Subsequent
    // reads will be served from this in-memory store.
    // We should also implement an update-store method, perhaps
    // have a global bus (using EventEmitter?), so we can trigger
    // re-reads from FS into our in-memory store.
  }
  async getMapConfig(map) {
    l.info(`${this.constructor.name}.getMapConfig(${map})`);
    try {
      const pathToFile = path.join(process.cwd(), "App_Data", `${map}.json`);
      const text = await fs.promises.readFile(pathToFile, "utf-8");
      const json = await JSON.parse(text);
      return json;
    } catch (error) {
      return error;
    }
  }

  async getAvailableMaps() {
    l.info(`${this.constructor.name}.getAvailableMaps()`);
    const dir = path.join(process.cwd(), "App_Data");
    // List dir contents, the second parameter will ensure we get Dirent objects
    const dirContents = await fs.promises.readdir(dir, { withFileTypes: true });
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
  }
}

export default new ConfigService();

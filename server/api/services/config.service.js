import l from "../../common/logger";
import fs from "fs";
import path from "path";

class ConfigService {
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
    const dirContents = await fs.promises.readdir(dir, { withFileTypes: true });
    const availableMaps = dirContents
      .filter((entry) => entry.isFile() && entry.name !== "layers.json")
      .map((entry) => entry.name);
    return [...availableMaps];
  }
}

export default new ConfigService();

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
}

export default new ConfigService();

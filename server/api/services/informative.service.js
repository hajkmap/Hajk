import fs from "fs";
import path from "path";

class InformativeService {
  async getByName(file) {
    try {
      file += ".json";
      // Open file containing our store
      const pathToFile = path.join(process.cwd(), "App_Data/documents", file);
      const text = await fs.promises.readFile(pathToFile, "utf-8");
      // Parse the file content so we get an object
      const json = await JSON.parse(text);
      return json;
    } catch (error) {
      return error;
    }
  }
}

export default new InformativeService();

import fs from "fs";
import path from "path";

class InformativeService {
  /**
   * @summary Lists contents of a document as JSON
   *
   * @param {*} file
   * @returns {object} JSON representation of document
   * @memberof InformativeService
   */
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
      return { error };
    }
  }

  /**
   * @summary Lists all available documents
   *
   * @returns {array} Names of files as array of strings
   * @memberof InformativeService
   */
  async getAvailableDocuments() {
    try {
      const dir = path.join(process.cwd(), "App_Data", "documents");
      // List dir contents, the second parameter will ensure we get Dirent objects
      const dirContents = await fs.promises.readdir(dir, {
        withFileTypes: true,
      });
      const availableDocuments = dirContents
        .filter(
          (entry) =>
            // Filter out only files (we're not interested in directories).
            entry.isFile() &&
            // Only JSON files
            entry.name.endsWith(".json")
        )
        // Create an array using name of each Dirent object, remove file extension
        .map((entry) => entry.name.replace(".json", ""));
      return availableDocuments;
    } catch (error) {
      return { error };
    }
  }
}

export default new InformativeService();

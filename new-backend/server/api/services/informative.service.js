import fs from "fs";
import path from "path";
import log4js from "log4js";
const logger = log4js.getLogger("service.informative");

class InformativeService {
  constructor() {
    logger.trace("Initiating InformativeService");
  }

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
      logger.warn(
        `Error while opening informative document "${file}". Sent 404 Not Found as response. Original error below.`
      );
      logger.warn(error);
      return { error };
    }
  }

  /**
   * @summary Create a new, empty documents file, link it to specified map config.
   *
   * @param {*} documentName File name to be created
   * @param {*} mapName Name of map config that this document file will be linked to
   * @returns
   * @memberof InformativeService
   */
  async create(documentName, mapName) {
    try {
      // Add desired file extension to our file's name…
      documentName += ".json";

      // …and create a new path to that file.
      const pathToFile = path.join(
        process.cwd(),
        "App_Data/documents",
        documentName
      );

      // Prepare the contents of our new documents file
      const json = {
        chapters: [], // No chapters
        map: mapName, // Link this document to the desired map config
      };

      // Transform JSON object to string using 2 spaces indentation
      const jsonString = JSON.stringify(json, null, 2);

      // Write to file
      await fs.promises.writeFile(pathToFile, jsonString);

      return json;
    } catch (error) {
      return { error };
    }
  }

  /**
   * @summary Replace contents of the specified documents file with the incoming body.
   *
   * @param {*} file Name of the document to be replaced (without file extension)
   * @param {*} body Content that will entirely replace the existing content of file
   * @returns
   * @memberof InformativeService
   */
  async saveByName(file, body) {
    try {
      file += ".json";
      // Prepare the path to our file
      const pathToFile = path.join(process.cwd(), "App_Data/documents", file);

      // Simple way to verify we've got valid JSON: try parsing it.
      const json = JSON.parse(body);

      // If parsing was successful, convert back to string,
      // using 2 spaces as indentation
      const jsonString = JSON.stringify(json, null, 2);

      // Write to file
      await fs.promises.writeFile(pathToFile, jsonString);

      // Return the parsed JSON object
      return jsonString;
    } catch (error) {
      return { error };
    }
  }

  async deleteByName(file) {
    try {
      file += ".json";
      // Prepare the path to our file
      const pathToFile = path.join(process.cwd(), "App_Data/documents", file);

      // Just drop the specified file…
      await fs.promises.unlink(pathToFile);

      // Return an empty JSON object
      return {};
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

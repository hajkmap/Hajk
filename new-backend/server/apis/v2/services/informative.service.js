import fs from "fs";
import path from "path";
import log4js from "log4js";
const logger = log4js.getLogger("service.informative.v2");

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

  /**
   * @summary Lists uploaded files depending on the extension
   *
   * @returns {array} Names of files as array of strings
   * @memberof InformativeService
   */
  async getUploadedFiles(type = "") {
    try {
      // Helper that allows us to safely extract custom extensions from .env
      const extractCustomExtensions = (str) => {
        // If not a string, bail out
        if (typeof str !== "string") return null;

        str = str.trim();

        // If too short to be an extension, bail out
        if (str.length === 0) return null;

        // Now that we have a string, attempt to split it
        // on commas. Note that we might end up with just
        // one element in the array and that's perfectly
        // valid too: perhaps user wants to only include one
        // file type.
        const arr = str.split(",");
        return arr;
      };

      // Prepare an array that will hold file extensions valid for
      // the given type of files
      const extensions = [];
      let customExt = null;

      // Depending on the type of files we're interested in, we
      // must specify some file extensions. The defaults are by
      // no means well thought-out and the only reason why they've
      // been chosen is to achieve the exactly same behavior as in the
      // original .NET edition of this API.
      switch (type) {
        case "image":
          customExt = extractCustomExtensions(
            process.env.INFORMATIVE_CUSTOM_IMAGE_EXTENSIONS
          );

          customExt !== null
            ? extensions.push(...customExt)
            : extensions.push(".png", ".jpg", ".jpeg");
          break;
        case "audio":
          customExt = extractCustomExtensions(
            process.env.INFORMATIVE_CUSTOM_AUDIO_EXTENSIONS
          );

          customExt !== null
            ? extensions.push(...customExt)
            : extensions.push(".mp3", ".wav", ".ogg");
          break;
        case "video":
          customExt = extractCustomExtensions(
            process.env.INFORMATIVE_CUSTOM_VIDEO_EXTENSIONS
          );

          customExt !== null
            ? extensions.push(...customExt)
            : extensions.push(".mp4", ".mov", ".ogg");
          break;

        default:
          break;
      }

      // Let's prepare another array of the same extensions,
      // only this time in upper case
      const extensionsUpperCase = extensions.map((e) => e.toUpperCase());

      let uploadDirPath = "";
      if (
        path.isAbsolute(
          process.env.INFORMATIVE_CUSTOM_UPLOAD_DIR_ABSOLUTE_PATH || "" // isAbsolut requires a string as param
        )
      ) {
        uploadDirPath = process.env.INFORMATIVE_CUSTOM_UPLOAD_DIR_ABSOLUTE_PATH;
      } else {
        // Read the dir where files are supposed to be
        uploadDirPath = path.join(process.cwd(), "App_Data", "Upload");
      }

      logger.trace(
        `[getUploadedFiles] Attempting to read contents of "${uploadDirPath}".\nLooking for ${type} files.\nValid extensions are: ${[
          ...extensions,
          ...extensionsUpperCase,
        ]
          .map((e) => `"${e}"`)
          .join()}.`
      );

      // List dir contents, the second parameter will ensure we get Dirent objects
      const dirContents = await fs.promises.readdir(uploadDirPath, {
        withFileTypes: true,
      });

      // Prepare the return files array by…
      const files = dirContents
        // …filtering the directory's contents.
        .filter(
          (dirent) =>
            // Keep only real files…
            dirent.isFile() &&
            // …and only those with an extension matching our choice.
            (extensions.includes(path.extname(dirent.name)) ||
              extensionsUpperCase.includes(path.extname(dirent.name)))
        )
        // Finally, transform the Array of Dirent objects into a flat
        // array of strings
        .map((dirent) => dirent.name);
      return files;
    } catch (error) {
      logger.error("[getUploadedFiles] " + error.toString());
      return { error };
    }
  }
}

export default new InformativeService();

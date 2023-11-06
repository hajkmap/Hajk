import fs from "fs";
import path from "path";
import log4js from "log4js";
const logger = log4js.getLogger("service.survey.v2");

class SurveyService {
  constructor() {
    logger.trace("Initiating SurveyService V2");
  }

  /**
   * @summary Lists all available surveys
   *
   * @returns {array} Names of files as array of strings
   * @memberof SurveyService
   */
  async getAvailableSurveys() {
    try {
      const dir = path.join(process.cwd(), "App_Data", "surveys");
      // List dir contents, the second parameter will ensure we get Dirent objects
      const dirContents = await fs.promises.readdir(dir, {
        withFileTypes: true,
      });
      const availableSurveys = dirContents
        .filter(
          (entry) =>
            // Filter out only files (we're not interested in directories).
            entry.isFile() &&
            // Only JSON files
            entry.name.endsWith(".json")
        )
        // Create an array using name of each Dirent object, remove file extension
        .map((entry) => entry.name.replace(".json", ""));
      return availableSurveys;
    } catch (error) {
      return { error };
    }
  }

  /**
   * @summary Lists contents of a survey as JSON
   *
   * @param {*} file
   * @returns {object} JSON representation of surveys
   * @memberof SurveyService
   */
  async getByNameSurvey(file) {
    try {
      file += ".json";
      // Open file containing our store
      const pathToFile = path.join(process.cwd(), "App_Data", "surveys", file);
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
   * @summary Lists contents of a survey as JSON
   *
   * @param {*} file
   * @returns {object} JSON representation of surveys
   * @memberof SurveyService
   */
  async getByNameSurveyLoad(file) {
    try {
      file += ".json";
      // Open file containing our store
      const pathToFile = path.join(
        process.cwd(),
        "App_Data",
        "surveys",
        "surveyanswers",
        file
      );
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
   * @summary
   * @returns
   * @memberof SurveyService
   */
  async saveByNameSurvey(file, body) {
    try {
      file += "Answer.json";
      const pathToFile = path.join(
        process.cwd(),
        "App_Data",
        "surveys",
        "surveyanswers",
        file
      );

      let fileData;

      try {
        // Try to read the existing file
        const rawData = await fs.promises.readFile(pathToFile, "utf8");
        fileData = JSON.parse(rawData);

        // If the file's content is not an array, initialize it as an empty array
        if (!Array.isArray(fileData)) {
          fileData = [];
        }
      } catch (readOrParseError) {
        // If reading or parsing fails, assume the file does not exist or is not valid JSON
        fileData = [];
      }

      // Add the new data to our array
      fileData.push(body);

      // Stringify the updated array
      const jsonString = JSON.stringify(fileData, null, 2);

      // Write the updated content back to the file
      await fs.promises.writeFile(pathToFile, jsonString);

      // Return a success message
      return { message: "Survey data added to file" };
    } catch (writeError) {
      console.error("Error in saveByNameSurvey:", writeError);
      return { error: writeError.message };
    }
  }
}

export default new SurveyService();

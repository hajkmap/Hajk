import fs from "fs";
import path from "path";
import log4js from "log4js";
import nodemailer from "nodemailer";
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
   * @summary Lists all available mailtemplates
   *
   * @returns {array} Names of files as array of strings
   * @memberof SurveyService
   */
  async getAvailableMailTemplates() {
    try {
      const dir = path.join(
        process.cwd(),
        "App_Data",
        "surveys",
        "mailtemplate"
      );
      // List dir contents, the second parameter will ensure we get Dirent objects
      const dirContents = await fs.promises.readdir(dir, {
        withFileTypes: true,
      });
      const availableMailTemplates = dirContents
        .filter(
          (entry) =>
            // Filter out only files (we're not interested in directories).
            entry.isFile() &&
            // Only HTML-files
            entry.name.endsWith(".html")
        )
        // Create an array using name of each Dirent object, remove file extension
        .map((entry) => entry.name.replace(".html", ""));
      return availableMailTemplates;
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
  async saveByNameSurveyAnswer(file, body) {
    try {
      file += "Answers.json";
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

      if (process.env.CITIZEN_DIALOGUE_MAIL_ENABLED === "true") {
        await this.sendSurveyEmail(body);
      }

      return { message: "Survey data added to file" };
    } catch (writeError) {
      console.error("Error in saveByNameSurvey:", writeError);
      return { error: writeError.message };
    }
  }

  /**
   * @summary
   * @returns
   * @memberof SurveyService
   */
  async sendSurveyEmail(body) {
    let subject = "";

    // Get the mail template file name from 'body', if provided
    let mailTemplateFile = body.mailTemplate + ".html";

    let templateContent = "";

    if (mailTemplateFile) {
      // Validate the template file name to prevent path traversal attacks
      mailTemplateFile = path.basename(mailTemplateFile);

      // Build the path to the template file
      const templatePath = path.join(
        process.cwd(),
        "App_Data",
        "surveys",
        "mailtemplate",
        mailTemplateFile
      );

      try {
        // Try to read the email template file
        templateContent = await fs.promises.readFile(templatePath, "utf8");
      } catch (error) {
        console.error("Error reading the email template:", error);
        // If there's an error, set templateContent to an empty string
        templateContent = "";
      }
    }

    // Initialize the dynamic content
    let dynamicContent = "";

    // Add the survey response heading
    dynamicContent += "<h1>Svar från undersökningen</h1>";

    // Build the email content from the survey response
    for (const key in body) {
      const item = body[key];

      if (key === "surveyId") {
        subject = item;
        dynamicContent += `<br><b>${key}</b>: ${item}`;
      } else if (
        key === "surveyAnswerId" ||
        key === "surveyAnswerDate" ||
        key === "featureData"
      ) {
        let valueDisplay = Array.isArray(item) ? item.join(", ") : item;
        dynamicContent += `<br><b>${key}</b>: ${valueDisplay}`;
      } else if (key === "surveyResults" && Array.isArray(item)) {
        for (const result of item) {
          if (result.title && result.value) {
            let valueDisplay = Array.isArray(result.value)
              ? result.value.join(", ")
              : result.value;
            dynamicContent += `<br><b>${result.title}</b>: ${valueDisplay}`;
          }
        }
      } else if (item.title && item.value) {
        let valueDisplay = Array.isArray(item.value)
          ? item.value.join(", ")
          : item.value;
        dynamicContent += `<br><b>${item.title}</b>: ${valueDisplay}`;
      }
    }

    let bodyHtml = "";

    if (templateContent) {
      // If template content is available, replace the placeholder
      bodyHtml = templateContent.replace("{{content}}", dynamicContent);
    } else {
      // If no template is used, wrap dynamic content in basic HTML structure
      bodyHtml = `<html><body>${dynamicContent}</body></html>`;
    }

    // Extract the email address from the survey results
    const email = body.surveyResults.find(
      (item) => item.name === "email"
    )?.value;
    let emailAddress = email;

    // Validate the email address
    if (!(await this.isValidEmail(emailAddress))) {
      console.error("Invalid email address: ", emailAddress);
      emailAddress = "";
    }

    // Send the email using your mailing function
    await this.mailNodemailer(emailAddress, bodyHtml, subject);
  }

  /**
   * @summary
   * @returns
   * @memberof SurveyService
   */
  async saveByNameSurvey(file, body) {
    try {
      file += ".json";
      const pathToFile = path.join(process.cwd(), "App_Data", "surveys", file);

      let json;
      if (typeof body === "string") {
        json = JSON.parse(body);
      } else {
        json = body;
        logger.info("Received body is already an object, no need to parse it.");
      }

      const jsonString = JSON.stringify(json, null, 2);

      await fs.promises.writeFile(pathToFile, jsonString);

      return jsonString;
    } catch (error) {
      logger.error(`Error saving file "${file}": ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * @summary
   * @returns
   * @memberof SurveyService
   */
  async mailNodemailer(emailAddress, body, subject) {
    try {
      let transporterOptions = {
        host: process.env.CITIZEN_DIALOGUE_MAIL_HOST,
        port: process.env.CITIZEN_DIALOGUE_MAIL_PORT,
        secure: process.env.CITIZEN_DIALOGUE_MAIL_SECURE === "true",
        tls: {
          rejectUnauthorized: false,
        },
      };

      // Check user and pass
      if (
        process.env.CITIZEN_DIALOGUE_MAIL_USER &&
        process.env.CITIZEN_DIALOGUE_MAIL_PASSWORD
      ) {
        transporterOptions.auth = {
          user: process.env.CITIZEN_DIALOGUE_MAIL_USER,
          pass: process.env.CITIZEN_DIALOGUE_MAIL_PASSWORD,
        };
      }

      // Create transport
      const transporter = nodemailer.createTransport(transporterOptions);

      let recipients;
      if (emailAddress) {
        recipients = `${emailAddress}, ${process.env.CITIZEN_DIALOGUE_MAIL_TO}`;
      } else {
        recipients = process.env.CITIZEN_DIALOGUE_MAIL_TO;
      }

      const emailSubject = process.env.CITIZEN_DIALOGUE_MAIL_SUBJECT || subject;

      const options = {
        from: process.env.CITIZEN_DIALOGUE_MAIL_FROM,
        to: recipients,
        subject: emailSubject,
        html: body,
      };

      await transporter.sendMail(options);
    } catch (error) {
      console.error("Error in mailNodemailer:", error);
      throw error;
    }
  }

  async isValidEmail(email) {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
  }
}

export default new SurveyService();

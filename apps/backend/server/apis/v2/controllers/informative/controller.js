import InformativeService from "../../services/informative.service.js";
import handleStandardResponse from "../../utils/handleStandardResponse.js";
import log4js from "log4js";

// Create a logger for admin events, those will be saved in a separate log file.
const ael = log4js.getLogger("adminEvent.v2");

/**
 * @summary Parse a JSON request body that arrives as a string.
 * @returns {object} The parsed body, or { error } with statusCode 400 if parsing fails.
 */
function parseJsonBody(body) {
  try {
    return typeof body === "string" ? JSON.parse(body) : body || {};
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    return { error };
  }
}

export class Controller {
  create(req, res) {
    const body = parseJsonBody(req.body);
    if (body.error) return handleStandardResponse(res, body);

    const { documentName, mapName, folderName } = body;
    InformativeService.create(documentName, mapName, folderName).then((r) => {
      if (r.error) return handleStandardResponse(res, r);

      handleStandardResponse(res, { message: "Document created" });
      ael.info(
        `created a new document ${
          folderName && `${folderName}/`
        }${documentName}.json, and connected it to map ${mapName}.json.`
      );
    });
  }

  createFolder(req, res) {
    const body = parseJsonBody(req.body);
    if (body.error) return handleStandardResponse(res, body);

    const { folderName } = body;
    InformativeService.createFolder(folderName).then((r) => {
      if (r.error) return handleStandardResponse(res, r);

      handleStandardResponse(res, { message: "Folder created" });
      ael.info(`created a new folder, ${folderName}`);
    });
  }

  getByName(req, res) {
    const { folder, name } = req.params;
    InformativeService.getByName(folder, name).then((r) => {
      // Don't expose the absolute file system path from the ENOENT message.
      if (r?.error?.code === "ENOENT") {
        return handleStandardResponse(res, {
          error: {
            statusCode: 404,
            message: `Document "${folder ? `${folder}/` : ""}${name}" not found.`,
          },
        });
      }
      handleStandardResponse(res, r);
    });
  }

  loadAll(req, res) {
    InformativeService.getAllDocumentsForMapConfig(req.params.map)
      .then((r) => {
        handleStandardResponse(res, r);
      })
      .catch((err) => handleStandardResponse(res, { error: err }));
  }

  saveByName(req, res) {
    const { folder, name } = req.params;
    InformativeService.saveByName(folder, name, req.body).then((r) => {
      if (r.error) return handleStandardResponse(res, r);

      handleStandardResponse(res, { message: "File saved" });
      ael.info(`saved document ${folder && `${folder}/`}${name}.json`);
    });
  }

  deleteByName(req, res) {
    const { folder, name } = req.params;
    InformativeService.deleteByName(folder, name).then((r) => {
      if (r.error) return handleStandardResponse(res, r);

      handleStandardResponse(res, { message: "File deleted" });
      ael.info(`deleted document ${folder && `${folder}/`}${name}.json`);
    });
  }

  list(req, res) {
    InformativeService.getAvailableDocuments(req.params.folder).then((r) =>
      handleStandardResponse(res, r)
    );
  }

  folderlist(req, res) {
    InformativeService.getAvailableFolders().then((r) =>
      handleStandardResponse(res, r)
    );
  }
}
export default new Controller();

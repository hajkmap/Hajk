import InformativeService from "../../services/informative.service.js";
import log4js from "log4js";

// Create a logger for admin events, those will be saved in a separate log file.
const ael = log4js.getLogger("adminEvent.v2");

export class Controller {
  create(req, res) {
    const { documentName, mapName, folderName } = JSON.parse(req.body);
    InformativeService.create(documentName, mapName, folderName).then((r) => {
      // FIXME: The buggy admin expects 200 and this string on success,
      // but I think that we'd do better with a meaningful JSON response.
      if (r && !r.error) {
        res.status(200).send("Document created");
        ael.info(
          `${res.locals.authUser} created a new document, ${documentName}.json, and connected it to map ${mapName}.json and ${folderName}`
        );
      } else res.status(500).send(r.error.message);
    });
  }

  createFolder(req, res) {
    const { folderName } = JSON.parse(req.body);
    InformativeService.createFolder(folderName).then((r) => {
      if (r && !r.error) {
        res.status(200).send("Folder created");
        ael.info(`${res.locals.authUser} created a new folder, ${folderName}`);
      } else res.status(500).send(r.error.message);
    });
  }

  getByName(req, res) {
    const DEFAULT_FOLDER_NAME = "";

    const folderName = req.params.folder || DEFAULT_FOLDER_NAME;

    InformativeService.getByName(folderName, req.params.name).then((r) => {
      if (r && !r.error) {
        res.json(r);
      } else {
        const errorMessage = `Document "${req.params.name}" could not be found`;
        res.status(404).send(errorMessage);
      }
    });
  }

  saveByName(req, res) {
    const DEFAULT_FOLDER_NAME = "";

    const folderName = req.params.folder || DEFAULT_FOLDER_NAME;

    InformativeService.saveByName(folderName, req.params.name, req.body).then(
      (r) => {
        if (r && !r.error) {
          res.status(200).send("File saved");
          ael.info(
            `${res.locals.authUser} saved document ${req.params.name}.json`
          );
        } else {
          res.status(500).send(r.error.message);
        }
      }
    );
  }

  deleteByName(req, res) {
    const DEFAULT_FOLDER_NAME = "";

    const folderName = req.params.folder || DEFAULT_FOLDER_NAME;

    InformativeService.deleteByName(folderName, req.params.name).then((r) => {
      if (r && !r.error) {
        res.status(200).send("File deleted");
        ael.info(
          `${res.locals.authUser} deleted document ${req.params.name}.json`
        );
      } else {
        res.status(500).send(r.error.message);
      }
    });
  }

  list(req, res) {
    InformativeService.getAvailableDocuments().then((r) => {
      if (r && !r.error) res.json(r);
      else res.status(500).send(r.error.message);
    });
  }

  folderlist(req, res) {
    InformativeService.getAvailableFolders().then((r) => {
      if (r && !r.error) res.json(r);
      else res.status(500).send(r.error.message);
    });
  }
}
export default new Controller();

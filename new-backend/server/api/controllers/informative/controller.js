import InformativeService from "../../services/informative.service";
import log4js from "log4js";

// Create a logger for admin events, those will be saved in a separate log file.
const ael = log4js.getLogger("adminEvent");

export class Controller {
  create(req, res) {
    const { documentName, mapName, folderName } = JSON.parse(req.body);
    InformativeService.create(documentName, mapName, folderName).then((r) => {
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
    if (req.params.folder) {
      InformativeService.getByName(req.params.folder, req.params.name).then(
        (r) => {
          if (r && !r.error) res.json(r);
          else {
            res
              .status(404)
              .send(`Document "${req.params.name}" could not be found`);
          }
        }
      );
    } else {
      InformativeService.getByName("", req.params.name).then((r) => {
        if (r && !r.error) res.json(r);
        else {
          res
            .status(404)
            .send(`Document "${req.params.name}" could not be found`);
        }
      });
    }
  }

  saveByName(req, res) {
    if (req.params.folder) {
      InformativeService.saveByName(
        req.params.folder,
        req.params.name,
        req.body
      ).then((r) => {
        if (r && !r.error) {
          res.status(200).send("File saved");
          ael.info(
            `${res.locals.authUser} saved document ${req.params.name}.json`
          );
        } else res.status(500).send(r.error.message);
      });
    } else {
      InformativeService.saveByName("", req.params.name, req.body).then((r) => {
        if (r && !r.error) {
          res.status(200).send("File saved");
          ael.info(
            `${res.locals.authUser} saved document ${req.params.name}.json`
          );
        } else res.status(500).send(r.error.message);
      });
    }
  }

  deleteByName(req, res) {
    if (req.params.folder) {
      InformativeService.deleteByName(req.params.folder, req.params.name).then(
        (r) => {
          if (r && !r.error) {
            res.status(200).send("File saved");
            ael.info(
              `${res.locals.authUser} deleted document ${req.params.name}.json`
            );
          } else res.status(500).send(r.error.message);
        }
      );
    } else {
      InformativeService.deleteByName("", req.params.name).then((r) => {
        if (r && !r.error) {
          res.status(200).send("File saved");
          ael.info(
            `${res.locals.authUser} deleted document ${req.params.name}.json`
          );
        } else res.status(500).send(r.error.message);
      });
    }
  }

  list(req, res) {
    InformativeService.getAvailableDocuments(req.params.folder).then((r) => {
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

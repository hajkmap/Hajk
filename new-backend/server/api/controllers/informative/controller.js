import InformativeService from "../../services/informative.service";
import log4js from "log4js";

// Create a logger for admin events, those will be saved in a separate log file.
const ael = log4js.getLogger("adminEvent");

export class Controller {
  create(req, res) {
    const { documentName, mapName } = JSON.parse(req.body);
    InformativeService.create(documentName, mapName).then((r) => {
      // FIXME: The buggy admin expects 200 and this string on success,
      // but I think that we'd do better with a meaningful JSON response.
      if (r && !r.error) {
        res.status(200).send("Document created");
        ael.info(
          `${res.locals.authUser} created a new document, ${documentName}.json, and connected it to map ${mapName}.json`
        );
      } else res.status(500).send(r.error.message);
    });
  }

  getByName(req, res) {
    InformativeService.getByName(req.params.name).then((r) => {
      if (r && !r.error) res.json(r);
      else res.status(500).send(r.error.message);
    });
  }

  saveByName(req, res) {
    InformativeService.saveByName(req.params.name, req.body).then((r) => {
      if (r && !r.error) {
        res.status(200).send("File saved");
        ael.info(
          `${res.locals.authUser} saved document ${req.params.name}.json`
        );
      } else res.status(500).send(r.error.message);
    });
  }

  deleteByName(req, res) {
    InformativeService.deleteByName(req.params.name).then((r) => {
      if (r && !r.error) {
        res.status(200).send("File saved");
        ael.info(
          `${res.locals.authUser} deleted document ${req.params.name}.json`
        );
      } else res.status(500).send(r.error.message);
    });
  }

  list(req, res) {
    InformativeService.getAvailableDocuments().then((r) => {
      if (r && !r.error) res.json(r);
      else res.status(500).send(r.error.message);
    });
  }
}
export default new Controller();

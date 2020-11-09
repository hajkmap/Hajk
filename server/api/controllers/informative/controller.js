import InformativeService from "../../services/informative.service";

export class Controller {
  create(req, res) {
    const { documentName, mapName } = JSON.parse(req.body);
    InformativeService.create(documentName, mapName).then((r) => {
      // FIXME: The buggy admin expects 200 and this string on success,
      // but I think that we'd do better with a meaningful JSON response.
      if (r && !r.error) res.status(200).send("Document created");
      else res.status(500).send(r.error.message);
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
      if (r && !r.error) res.status(200).send("File saved");
      else res.status(500).send(r.error.message);
    });
  }

  deleteByName(req, res) {
    InformativeService.deleteByName(req.params.name).then((r) => {
      if (r && !r.error) res.status(200).send("File saved");
      else res.status(500).send(r.error.message);
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

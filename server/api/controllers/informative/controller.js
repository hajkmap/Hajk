// import ExamplesService from "../../services/examples.service";
import InformativeService from "../../services/informative.service";

export class Controller {
  getByName(req, res) {
    InformativeService.getByName(req.params.name).then((r) => {
      if (r && !r.error) res.json(r);
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

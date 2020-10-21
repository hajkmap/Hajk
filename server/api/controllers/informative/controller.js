// import ExamplesService from "../../services/examples.service";
import InformativeService from "../../services/informative.service";

export class Controller {
  getByName(req, res) {
    InformativeService.getByName(req.params.name).then((r) => {
      if (r) res.json(r);
      else res.status(404).end();
    });
  }
}
export default new Controller();

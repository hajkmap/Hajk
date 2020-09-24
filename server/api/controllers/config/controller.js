import ConfigService from "../../services/config.service";
import l from "../../../common/logger";

export class Controller {
  byMap(req, res) {
    ConfigService.getMapConfig(req.params.map).then((r) => {
      if (r) res.json(r);
      else res.status(404).end();
    });
  }

  layers(req, res) {
    // Special case, essentially the same as above,
    // but uses hard-coded file name: "layers"
    ConfigService.getMapConfig("layers").then((r) => {
      if (r) res.json(r);
      else res.status(404).end();
    });
  }
}
export default new Controller();

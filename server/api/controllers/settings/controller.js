// import ExamplesService from "../../services/examples.service";
import l from "../../../common/logger";
import SettingsService from "../../services/settings.service";

export class Controller {
  // all(req, res) {
  //   ExamplesService.all().then((r) => res.json(r));
  // }

  // byId(req, res) {
  //   ExamplesService.byId(req.params.id).then((r) => {
  //     if (r) res.json(r);
  //     else res.status(404).end();
  //   });
  // }

  // getLayer(req, res) {
  //   l.info("Get " + req.params.layer);
  //   res.json(req.params.layer);
  // }

  putLayerSwitcherSettings(req, res) {
    SettingsService.updateLayerSwitcher(req.query.mapFile, req.body).then(
      (r) => {
        res.json(r);
      }
    );
  }

  putLayerOfType(req, res) {
    SettingsService.createOrUpdateLayer(req.params.type, req.body).then((r) => {
      res.json(r);
    });
  }
}
export default new Controller();

import ConfigService from "../../services/config.service";
// import l from "../../../common/logger";

export class Controller {
  /**
   * @summary Get a specific map config using the supplied
   * request parameter "map" as map's name.
   *
   * @param {*} req
   * @param {*} res
   * @memberof Controller
   */
  byMap(req, res) {
    ConfigService.getMapConfig(req.params.map).then((r) => {
      if (r.error) res.status(500).send(r.error.message);
      else res.json(r);
    });
  }

  exportMapConfig(req, res, next) {
    ConfigService.exportMapConfig(
      req.params.map,
      req.params.format,
      next
    ).then((r) => res.send(r));
  }

  /**
   * @summary Get the contents of the layers database
   *
   * @param {*} req
   * @param {*} res
   * @memberof Controller
   */
  layers(req, res) {
    // Special case, essentially the same as above,
    // but uses hard-coded file name: "layers"
    ConfigService.getMapConfig("layers").then((r) => {
      if (r.error) res.status(500).send(r.error.message);
      else res.json(r);
    });
  }

  /**
   * @summary List all available map configs
   *
   * @param {*} req
   * @param {*} res
   * @memberof Controller
   */
  list(req, res) {
    ConfigService.getAvailableMaps().then((r) => {
      if (r.error) res.status(500).send(r.error.message);
      else res.json(r);
    });
  }

  // FIXME: Make a real implementation that actually respects
  // each map's setting. This mock only lists all maps in dir.
  userSpecificMaps(req, res) {
    ConfigService.getAvailableMaps().then((r) => {
      if (r && !r.error) {
        let rr = [];
        for (let entry of r) {
          rr.push({
            mapConfigurationName: entry,
            mapConfigurationTitle: entry,
          });
        }
        res.json(rr);
      } else res.status(500).send(r.error.message);
    });
  }

  createNewMap(req, res) {
    res.status(501).end();
  }
}
export default new Controller();

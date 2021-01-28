import ConfigService from "../../services/config.service";
import ad from "../../services/activedirectory.service";
import handleStandardResponse from "../../utils/handleStandardResponse";

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
    ConfigService.getMapConfig(
      req.params.map,
      ad.getUserFromRequestHeader(req)
    ).then((data) => handleStandardResponse(res, data));
  }

  /**
   * @summary Get the contents of the layers database
   *
   * @param {*} req
   * @param {*} res
   * @memberof Controller
   */
  layers(req, res) {
    ConfigService.getLayersStore(
      ad.getUserFromRequestHeader(req)
    ).then((data) => handleStandardResponse(res, data));
  }

  userSpecificMaps(req, res) {
    ConfigService.getUserSpecificMaps(
      ad.getUserFromRequestHeader(req)
    ).then((data) => handleStandardResponse(res, data));
  }
}
export default new Controller();

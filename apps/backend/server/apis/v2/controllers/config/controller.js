import ConfigService from "../../services/config.service.js";
import ad from "../../services/activedirectory.service.js";
import handleStandardResponse from "../../utils/handleStandardResponse.js";

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
    ConfigService.getMapWithLayers(
      req.params.map,
      ad.getUserFromRequestHeader(req)
    ).then((data) => handleStandardResponse(res, data));
  }
}
export default new Controller();

import ConfigServiceV2 from "../../services/config.service.v2.js";
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
    ConfigServiceV2.getMapWithLayers(
      req.params.map,
      ad.getUserFromRequestHeader(req)
    ).then((data) => handleStandardResponse(res, data));
  }
}
export default new Controller();

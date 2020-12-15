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
   * @summary Returns a list of all available layers in specified (often human-readable) format.
   *
   * @description Sometimes it's useful for admins to get a list of a map's contents and make it
   * available for users in some format (be it JSON, XML, Excel). This endpoint can be used as-is
   * or by implementing a feature in the client UI, so users themselves can request a description
   * of a map's contents from e.g. LayerSwitcher.
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @memberof Controller
   */
  exportMapConfig(req, res, next) {
    ConfigService.exportMapConfig(
      req.params.map,
      req.params.format,
      ad.getUserFromRequestHeader(req),
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
    ConfigService.getLayersStore(
      ad.getUserFromRequestHeader(req)
    ).then((data) => handleStandardResponse(res, data));
  }

  /**
   * @summary List all available map configs - used in admin
   *
   * @param {*} req
   * @param {*} res
   * @memberof Controller
   */
  list(req, res) {
    ConfigService.getAvailableMaps().then((data) =>
      handleStandardResponse(res, data)
    );
  }

  userSpecificMaps(req, res) {
    ConfigService.getUserSpecificMaps(
      ad.getUserFromRequestHeader(req)
    ).then((data) => handleStandardResponse(res, data));
  }

  availableADGroups(req, res) {
    ConfigService.getAvailableADGroups().then((data) =>
      handleStandardResponse(res, data)
    );
  }

  findCommonGroupsForUsers(req, res) {
    ConfigService.findCommonGroupsForUsers(req.query.users).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  createNewMap(req, res) {
    ConfigService.createNewMap(req.params.name).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  duplicateMap(req, res) {
    ConfigService.duplicateMap(
      req.params.nameFrom,
      req.params.nameTo
    ).then((data) => handleStandardResponse(res, data));
  }

  deleteMap(req, res) {
    ConfigService.deleteMap(req.params.name).then((data) =>
      handleStandardResponse(res, data)
    );
  }
}
export default new Controller();

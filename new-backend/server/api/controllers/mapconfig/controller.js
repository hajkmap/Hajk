import ConfigService from "../../services/config.service";
import ad from "../../services/activedirectory.service";
import handleStandardResponse from "../../utils/handleStandardResponse";
import log4js from "log4js";

// Create a logger for admin events, those will be saved in a separate log file.
const ael = log4js.getLogger("adminEvent");

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
      ad.getUserFromRequestHeader(req),
      false // 'false' here means that the map config won't be "washed" - this is exactly what we need for this admin request
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
   * @memberof Controller
   */
  exportMapConfig(req, res) {
    ConfigService.exportMapConfig(
      req.params.map,
      req.params.format,
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
      ad.getUserFromRequestHeader(req),
      false // won't "wash" content, which is what we need for admin UI to list the entire layer's store
    ).then((data) => handleStandardResponse(res, data));
  }

  layersVerify(req, res) {
    ConfigService.verifyLayers(ad.getUserFromRequestHeader(req)).then((data) =>
      handleStandardResponse(res, data)
    );
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

  // FIXME: implement a real solution
  listimage(req, res) {
    // Return an empty array as a mockup
    handleStandardResponse(res, []);
  }

  listvideo(req, res) {
    // Return an empty array as a mockup
    handleStandardResponse(res, []);
  }

  listaudio(req, res) {
    // Return an empty array as a mockup
    handleStandardResponse(res, []);
  }

  createNewMap(req, res) {
    ConfigService.createNewMap(req.params.name).then((data) => {
      handleStandardResponse(res, data);
      !data.error &&
        ael.info(
          `${res.locals.authUser} created a new map config: ${req.params.name}.json`
        );
    });
  }

  duplicateMap(req, res) {
    ConfigService.duplicateMap(req.params.nameFrom, req.params.nameTo).then(
      (data) => {
        handleStandardResponse(res, data);
        !data.error &&
          ael.info(
            `${res.locals.authUser} created a new map config, ${req.params.nameTo}.json, by duplicating ${req.params.nameFrom}.json`
          );
      }
    );
  }

  deleteMap(req, res) {
    ConfigService.deleteMap(req.params.name).then((data) => {
      handleStandardResponse(res, data);
      !data.error &&
        ael.info(
          `${res.locals.authUser} deleted map config ${req.params.name}.json`
        );
    });
  }
}
export default new Controller();

import SearchService from "../../services/search.service.js";
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
  autocomplete(req, res) {
    SearchService.autocomplete(req.body, ad.getUserFromRequestHeader(req)).then(
      (data) => handleStandardResponse(res, data)
    );
  }
}
export default new Controller();

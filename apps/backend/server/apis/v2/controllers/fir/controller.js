import FirService from "../../services/fir.service.js";
import handleStandardResponse from "../../utils/handleStandardResponse.js";
import log4js from "log4js";

// Create a logger for FIR calls.
const logger = log4js.getLogger("fir.v2");
export class Controller {
  getRealestateOwnerList(req, res) {
    FirService.getRealestateOwnerList(req, res)
      .then((result) => {
        handleStandardResponse(res, { url: result.url });
      })
      .catch((err) => {
        logger.error(err);
        handleStandardResponse(res, { error: err });
      });
  }

  getResidentList(req, res) {
    FirService.getResidentList(req, res)
      .then((result) => {
        handleStandardResponse(res, { url: result.url });
      })
      .catch((err) => {
        logger.error(err);
        handleStandardResponse(res, { error: err });
      });
  }
}

export default new Controller();

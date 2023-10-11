import FirService from "../../services/fir.service.js";
import log4js from "log4js";

// Create a logger for FIR calls.
const logger = log4js.getLogger("fir.v2");
export class Controller {
  getRealestateOwnerList(req, res) {
    FirService.getRealestateOwnerList(req, res)
      .then((result) => {
        res.status(200).send(result.url);
      })
      .catch((err) => {
        logger.error(err);
        res.status(500).send(err.toString());
      });
  }

  getResidentList(req, res) {
    FirService.getResidentList(req, res)
      .then((result) => {
        res.status(200).send(result.url);
      })
      .catch((err) => {
        logger.error(err);
        res.status(500).send(err.toString());
      });
  }
}

export default new Controller();

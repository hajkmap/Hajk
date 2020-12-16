import ActiveDirectoryService from "../../services/activedirectory.service";
import handleStandardResponse from "../../utils/handleStandardResponse";

export class Controller {
  getStore(req, res) {
    ActiveDirectoryService.getStore(req.route.path.substring(1)).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  flushStores(req, res) {
    ActiveDirectoryService.flushStores().then((data) =>
      handleStandardResponse(res, data)
    );
  }
}

export default new Controller();

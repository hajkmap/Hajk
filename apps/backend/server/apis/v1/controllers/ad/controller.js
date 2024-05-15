import ActiveDirectoryService from "../../services/activedirectory.service.js";
import handleStandardResponse from "../../utils/handleStandardResponse.js";
import log4js from "log4js";

// Create a logger for admin events, those will be saved in a separate log file.
const ael = log4js.getLogger("adminEvent");

export class Controller {
  availableADGroups(req, res) {
    ActiveDirectoryService.getAvailableADGroups().then((data) =>
      handleStandardResponse(res, data)
    );
  }

  findCommonADGroupsForUsers(req, res) {
    ActiveDirectoryService.findCommonADGroupsForUsers(req.query.users).then(
      (data) => handleStandardResponse(res, data)
    );
  }

  getStore(req, res) {
    // Extract the store name from request's path
    const store = req.route.path.substring(1);
    ActiveDirectoryService.getStore(store).then((data) => {
      handleStandardResponse(res, data);
      // If data doesn't contain the error property, we're good - print event to admin log
      !data.error &&
        ael.info(
          `${res.locals.authUser} viewed contents of AD store "${store}"`
        );
    });
  }

  flushStores(req, res) {
    ActiveDirectoryService.flushStores().then((data) => {
      handleStandardResponse(res, data);
      // If data doesn't contain the error property, we're good - print event to admin log
      !data.error && ael.info(`${res.locals.authUser} flushed all AD stores`);
    });
  }
}

export default new Controller();

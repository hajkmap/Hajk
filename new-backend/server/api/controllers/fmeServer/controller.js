import FmeServerService from "../../services/fmeServer.service";
import handleStandardResponse from "../../utils/handleStandardResponse";

export class Controller {
  getRepositories(req, res) {
    FmeServerService.getRepositories().then((data) => {
      handleStandardResponse(res, data);
    });
  }

  getRepositoryDetails(req, res) {
    FmeServerService.getRepositories().then((data) => {
      handleStandardResponse(res, data);
    });
  }

  getWorkspaceParameters(req, res) {
    FmeServerService.getRepositories().then((data) => {
      handleStandardResponse(res, data);
    });
  }

  runWorkspace(req, res) {
    FmeServerService.getRepositories().then((data) => {
      handleStandardResponse(res, data);
    });
  }

  checkWorkspaceStatus(req, res) {
    FmeServerService.getRepositories().then((data) => {
      handleStandardResponse(res, data);
    });
  }
}
export default new Controller();

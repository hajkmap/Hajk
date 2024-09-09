import ToolService from "../../services/tool.service.ts";
import handleStandardResponse from "../../utils/handleStandardResponse.ts";

export class Controller {
  getTools(req, res) {
    ToolService.getTools().then((data) => handleStandardResponse(res, data));
  }

  getMapsWithTool(req, res) {
    ToolService.getMapsWithTool(req.params.toolName).then((data) =>
      handleStandardResponse(res, data)
    );
  }
}
export default new Controller();

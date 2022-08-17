import PrismaService from "../../../services/prisma.service";
import handleStandardResponse from "../../../utils/handleStandardResponse";

export class Controller {
  getTools(req, res) {
    PrismaService.getTools().then((data) => handleStandardResponse(res, data));
  }

  getMapsWithTool(req, res) {
    PrismaService.getMapsWithTool(req.params.toolName).then((data) =>
      handleStandardResponse(res, data)
    );
  }
}
export default new Controller();

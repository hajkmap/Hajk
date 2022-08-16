import PrismaService from "../../../services/prisma.service";
import handleStandardResponse from "../../../utils/handleStandardResponse";

export class Controller {
  getMap(req, res) {
    PrismaService.getMap(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  getMapsWithTool(req, res) {
    PrismaService.getMapsWithTool(req.params.toolName).then((data) =>
      handleStandardResponse(res, data)
    );
  }
}
export default new Controller();

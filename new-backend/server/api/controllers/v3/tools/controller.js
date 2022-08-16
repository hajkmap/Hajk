import PrismaService from "../../../services/prisma.service";
import handleStandardResponse from "../../../utils/handleStandardResponse";

export class Controller {
  getToolsForMap(req, res) {
    PrismaService.getToolsForMap(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }
}
export default new Controller();

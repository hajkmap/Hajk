import PrismaService from "../../../services/prisma.service";
import handleStandardResponse from "../../../utils/handleStandardResponse";

export class Controller {
  getMaps(req, res) {
    PrismaService.getMaps().then((data) => handleStandardResponse(res, data));
  }

  getMapByName(req, res) {
    PrismaService.getMapByName(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  getToolsForMap(req, res) {
    PrismaService.getToolsForMap(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  getLayersForMap(req, res) {
    PrismaService.getLayersForMap(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  // TODO: Move me to seed.js
  populateMap(req, res) {
    PrismaService.populateMap(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  // TODO: Move me to seed.js
  populateAllMaps(req, res) {
    PrismaService.populateAllMaps().then((data) =>
      handleStandardResponse(res, data)
    );
  }
}
export default new Controller();

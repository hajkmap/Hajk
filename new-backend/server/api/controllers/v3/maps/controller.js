import MapService from "../../../services/v3/map.service";
import handleStandardResponse from "../../../utils/handleStandardResponse";

export class Controller {
  getMaps(req, res) {
    MapService.getMaps().then((data) => handleStandardResponse(res, data));
  }

  getMapByName(req, res) {
    MapService.getMapByName(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  getGroupsForMap(req, res) {
    MapService.getGroupsForMap(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  getLayersForMap(req, res) {
    MapService.getLayersForMap(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  getProjectionsForMap(req, res) {
    MapService.getProjectionsForMap(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  getToolsForMap(req, res) {
    MapService.getToolsForMap(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }
}
export default new Controller();

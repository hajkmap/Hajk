import LayerService from "../../services/layer.service.js";
import handleStandardResponse from "../../utils/handleStandardResponse.js";

export class Controller {
  getLayers(req, res) {
    LayerService.getLayers().then((data) => handleStandardResponse(res, data));
  }

  getLayerById(req, res) {
    LayerService.getLayerById(req.params.id).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  getLayerTypes(req, res) {
    LayerService.getLayerTypes().then((data) =>
      handleStandardResponse(res, data)
    );
  }

  getLayersByType(req, res) {
    LayerService.getLayersByType(req.params.type).then((data) =>
      handleStandardResponse(res, data)
    );
  }
}
export default new Controller();

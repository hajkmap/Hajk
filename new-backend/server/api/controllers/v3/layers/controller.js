import LayerService from "../../../services/v3/layer.service";
import handleStandardResponse from "../../../utils/handleStandardResponse";

export class Controller {
  getLayers(req, res) {
    LayerService.getLayers().then((data) => handleStandardResponse(res, data));
  }

  getLayerById(req, res) {
    LayerService.getLayerById(req.params.id).then((data) =>
      handleStandardResponse(res, data)
    );
  }

  getLayerByType(req, res) {
    LayerService.getLayersByType(req.params.type).then((data) =>
      handleStandardResponse(res, data)
    );
  }
}
export default new Controller();

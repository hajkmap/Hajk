import LayerService from "../../../services/v3/layer.service";
import handleStandardResponse from "../../../utils/handleStandardResponse";

export class Controller {
  getLayers(req, res) {
    LayerService.getLayers(req.params.mapName).then((data) =>
      handleStandardResponse(res, data)
    );
  }
}
export default new Controller();

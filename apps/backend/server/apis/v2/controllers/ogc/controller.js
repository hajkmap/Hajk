import * as svc from "../../services/ogc.service.js";
import handleStandardResponse from "../../utils/handleStandardResponse.js";
import log4js from "log4js";

const log = log4js.getLogger("ogc.v2");

function handleError(e, res) {
  const statusCode = e?.statusCode || 500;
  if (statusCode < 500) return handleStandardResponse(res, { error: e });

  // Server-side errors may carry internal details, so only send the message.
  log.error(e);
  return handleStandardResponse(res, {
    error: { statusCode, message: String(e?.message || e) },
  });
}

export class Controller {
  // GET /api/v2/ogc/wfst
  async listWFSTLayers(req, res) {
    try {
      const user = res.locals.authUser;
      const layers = await svc.listWFSTLayers({
        fields: req.query.fields,
        user,
      });
      handleStandardResponse(res, { count: layers.length, layers });
    } catch (e) {
      handleError(e, res);
    }
  }

  // GET /api/v2/ogc/wfst/:id
  async getWFSTLayer(req, res) {
    try {
      const user = res.locals.authUser;
      const layer = await svc.getWFSTLayer({
        id: req.params.id,
        fields: req.query.fields,
        user,
      });
      handleStandardResponse(res, layer);
    } catch (e) {
      handleError(e, res);
    }
  }
}

export default new Controller();

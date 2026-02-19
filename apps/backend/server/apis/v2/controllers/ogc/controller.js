import * as svc from "../../services/ogc.service.js";
import ad from "../../services/activedirectory.service.js";
import log4js from "log4js";

const log = log4js.getLogger("ogc.v2");

function handleError(e, res) {
  if (e.name === "ValidationError")
    return res.status(400).json({ error: e.message, details: e.details });
  if (e.name === "NotFoundError")
    return res.status(404).json({ error: e.message, details: e.details });
  if (e.name === "UpstreamError")
    return res.status(e.status || 502).json({ error: e.message });

  log.error(e);
  return res.status(500).json({ error: String(e?.message || e) });
}

export class Controller {
  // GET /api/v2/ogc/wfst
  async listWFSTLayers(req, res) {
    try {
      const user = ad.getUserFromRequestHeader(req);
      const layers = await svc.listWFSTLayers({
        fields: req.query.fields,
        user,
      });
      res.json({ count: layers.length, layers });
    } catch (e) {
      handleError(e, res);
    }
  }

  // GET /api/v2/ogc/wfst/:id
  async getWFSTLayer(req, res) {
    try {
      const user = ad.getUserFromRequestHeader(req);
      const layer = await svc.getWFSTLayer({
        id: req.params.id,
        fields: req.query.fields,
        user,
        washContent: req.query.washContent,
      });
      return res.json(layer);
    } catch (e) {
      handleError(e, res);
    }
  }

}

export default new Controller();

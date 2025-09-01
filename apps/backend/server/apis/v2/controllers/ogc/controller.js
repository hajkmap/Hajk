import * as svc from "../../services/ogc.service.js";
import log4js from "log4js";
const log = log4js.getLogger("ogc.v2");

export class Controller {
  async listWFSTLayers(req, res) {
    try {
      const layers = await svc.listWFSTLayers({ fields: req.query.fields });
      res.json({ count: layers.length, layers });
    } catch (e) {
      log.error(e);
      res.status(500).json({ error: String(e?.message || e) });
    }
  }

  async getWFSTFeatures(req, res) {
    try {
      const fc = await svc.getWFSTFeatures({
        id: req.params.id,
        version: req.query.version || "1.1.0",
        typeName: req.query.typeName,
        srsName: req.query.srsName,
        bbox: req.query.bbox,
        limit: req.query.limit || req.query.maxFeatures,
        offset: req.query.offset || req.query.startIndex,
        filter: req.query.filter,
      });
      res.json(fc);
    } catch (e) {
      if (e.name === "NotFoundError")
        return res.status(404).json({ error: e.message });
      if (e.name === "UpstreamError")
        return res.status(e.status || 502).json({ error: e.message });
      log.error(e);
      res.status(500).json({ error: String(e?.message || e) });
    }
  }
}
export default new Controller();

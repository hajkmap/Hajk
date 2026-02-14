import * as svc from "../../services/ogc.service.js";
import ad from "../../services/activedirectory.service.js";
import { Validator } from "../../services/ogc/validator.js";
import { CONSTANTS } from "../../services/ogc/constants.js";
import log4js from "log4js";

const log = log4js.getLogger("ogc.v2");

// Shared error handler to keep individual methods clean
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

  // GET /api/v2/ogc/wfst/:id/features
  async getWFSTFeatures(req, res) {
    try {
      const user = ad.getUserFromRequestHeader(req);

      // Parameter validation
      const rawLimit = Number.parseInt(
        req.query.limit ?? req.query.maxFeatures ?? String(CONSTANTS.DEFAULT_LIMIT),
        10
      );
      if (!Number.isFinite(rawLimit) || rawLimit < 1) {
        return res.status(400).json({ error: "Invalid limit" });
      }
      if (rawLimit > CONSTANTS.MAX_LIMIT) {
        return res.status(400).json({ error: `Limit too high (max ${CONSTANTS.MAX_LIMIT})` });
      }

      const rawOffset = Number.parseInt(
        req.query.offset ?? req.query.startIndex ?? "0",
        10
      );
      if (!Number.isFinite(rawOffset) || rawOffset < 0) {
        return res.status(400).json({ error: "Invalid offset" });
      }
      if (rawOffset > 1_000_000) {
        return res
          .status(400)
          .json({ error: "Offset too large (max 1000000)" });
      }

      if (req.query.bbox && !Validator.isValidBbox(req.query.bbox)) {
        return res.status(400).json({ error: "Invalid bbox format" });
      }

      // Fetch and proxy the raw WFS response
      const result = await svc.getWFSTFeatures({
        id: req.params.id,
        user,
        version: req.query.version || "1.1.0",
        typeName: req.query.typeName,
        srsName: req.query.srsName,
        bbox: req.query.bbox,
        limit: rawLimit,
        offset: rawOffset,
        filter: req.query.filter,
        cqlFilter: req.query.cqlFilter,
      });

      // Allow caching for normal requests but bypass when client sends
      // cache-busting params (e.g. after a WFS-T commit + reload).
      if (req.query._nocache || req.query._bust || req.query._reload) {
        res.set({
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        });
      } else {
        const ttl = Number(process.env.OGC_CACHE_SECONDS || 300);
        res.set({
          "Cache-Control": `public, max-age=${ttl}`,
          Vary: "Accept-Encoding",
        });
      }

      return res.json(result);
    } catch (e) {
      handleError(e, res);
    }
  }

  // POST /api/v2/ogc/wfst/:id/transaction
  async commitWFSTTransaction(req, res) {
    try {
      const user = ad.getUserFromRequestHeader(req);
      const { transactionXml } = req.body;

      if (!transactionXml) {
        return res
          .status(400)
          .json({ error: "Transaction XML is required (transactionXml)" });
      }

      const result = await svc.commitWFSTTransaction({
        id: req.params.id,
        user,
        transactionXml,
      });

      return res.json(result);
    } catch (e) {
      handleError(e, res);
    }
  }
}

export default new Controller();

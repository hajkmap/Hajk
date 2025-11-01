import * as svc from "../../services/ogc.service.js";
import log4js from "log4js";

const log = log4js.getLogger("ogc.v2");

// Base URL to the backend so the service can call /api/v2/mapconfig/layers
const getBaseUrl = (req) =>
  process.env.HAJK_BASE_URL || `${req.protocol}://${req.get("host")}`;

// Simple bbox validation: "minx,miny,maxx,maxy" (optional with ,EPSG:XXXX at the end)
function isValidBbox(bbox) {
  if (typeof bbox !== "string") return false;
  const parts = bbox.split(",");
  if (parts.length < 4) return false;
  const nums = parts.slice(0, 4).map((p) => Number.parseFloat(p));
  return nums.every((n) => Number.isFinite(n));
}

export class Controller {
  // GET /api/v2/ogc/wfst/:id?fields=...
  async getWFSTLayer(req, res) {
    try {
      const { id } = req.params;
      const { fields, washContent } = req.query;
      const user = req.user ?? null; // om du har auth

      const layer = await svc.getWFSTLayer({ id, fields, user, washContent });
      // välj svarformat: för single returnerar vi bara objektet
      return res.json(layer);
    } catch (e) {
      if (e.name === "ValidationError")
        return res.status(400).json({ error: e.message, details: e.details });
      if (e.name === "NotFoundError")
        return res.status(404).json({ error: e.message, details: e.details });

      log.error(e);
      return res.status(500).json({ error: String(e?.message || e) });
    }
  }

  // GET /api/v2/ogc/wfst?fields=...
  async listWFSTLayers(req, res) {
    try {
      const baseUrl = getBaseUrl(req);
      const layers = await svc.listWFSTLayers({
        fields: req.query.fields,
        baseUrl,
      });
      res.json({ count: layers.length, layers });
    } catch (e) {
      log.error(e);
      res.status(500).json({ error: String(e?.message || e) });
    }
  }

  // GET /api/v2/ogc/wfst/:id/features?bbox=...&limit=...&offset=...&typeName=...&srsName=...&version=...&filter=...&cqlFilter=...
  async getWFSTFeatures(req, res) {
    try {
      const baseUrl = getBaseUrl(req);

      // ---- Parameter validation ----
      const rawLimit = Number.parseInt(
        req.query.limit ?? req.query.maxFeatures ?? "1000",
        10
      );
      if (!Number.isFinite(rawLimit) || rawLimit < 1) {
        return res.status(400).json({ error: "Invalid limit" });
      }
      if (rawLimit > 10000) {
        return res.status(400).json({ error: "Limit too high (max 10000)" });
      }

      const rawOffsetStr = req.query.offset ?? req.query.startIndex ?? "0";
      const rawOffset = Number.parseInt(rawOffsetStr, 10);
      if (!Number.isFinite(rawOffset) || rawOffset < 0) {
        return res.status(400).json({ error: "Invalid offset" });
      }
      if (rawOffset > 1_000_000) {
        return res
          .status(400)
          .json({ error: "Offset too large (max 1000000)" });
      }

      if (req.query.bbox && !isValidBbox(req.query.bbox)) {
        return res.status(400).json({ error: "Invalid bbox format" });
      }

      // ---- Call the service ----
      const fc = await svc.getWFSTFeatures({
        id: req.params.id,
        version: req.query.version || "1.1.0",
        typeName: req.query.typeName,
        srsName: req.query.srsName,
        bbox: req.query.bbox,
        limit: rawLimit,
        offset: rawOffset,
        filter: req.query.filter, // OGC Filter (XML, URL-encoded)
        cqlFilter: req.query.cqlFilter, // GeoServer CQL filter (optional)
        baseUrl,
      });

      // ---- Cache headers (short TTL) ----
      const ttl = Number(process.env.OGC_CACHE_SECONDS || 300);
      res.set({
        "Cache-Control": `public, max-age=${ttl}`,
        Vary: "Accept-Encoding",
      });

      return res.json(fc);
    } catch (e) {
      if (e.name === "NotFoundError") {
        return res.status(404).json({ error: e.message });
      }
      if (e.name === "UpstreamError") {
        return res.status(e.status || 502).json({ error: e.message });
      }
      log.error(e);
      return res.status(500).json({ error: String(e?.message || e) });
    }
  }

  async commitWFSTTransaction(req, res) {
    try {
      const { id } = req.params;
      const { inserts = [], updates = [], deletes = [], srsName } = req.body;
      const user = req.user ?? null;

      // Validate that transaction contains at least one operation
      if (!inserts.length && !updates.length && !deletes.length) {
        return res.status(400).json({
          error: "Transaction must contain at least one operation",
        });
      }

      const result = await svc.commitWFSTTransaction({
        id,
        user,
        inserts,
        updates,
        deletes,
        srsName, // Pass srsName from frontend to service
      });

      return res.json(result);
    } catch (e) {
      if (e.name === "ValidationError")
        return res.status(400).json({ error: e.message, details: e.details });
      if (e.name === "NotFoundError")
        return res.status(404).json({ error: e.message, details: e.details });
      if (e.name === "UpstreamError")
        return res.status(e.status || 502).json({ error: e.message });

      log.error(e);
      return res.status(500).json({ error: String(e?.message || e) });
    }
  }
}

export default new Controller();

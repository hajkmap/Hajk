import { promises as fs } from "fs";
import path from "path";
import ConfigService from "./config.service.js";
import { logger } from "./ogc/logger.js";
import { Validator } from "./ogc/validator.js";
import { CONSTANTS } from "./ogc/constants.js";
import { pick } from "./ogc/utils/object.js";
import {
  fetchWithRetry,
  fetchWithTimeout,
  readTextWithLimit,
} from "./ogc/utils/http.js";
import {
  buildWfsGetFeatureUrl,
  rewriteOutputFormat,
} from "./ogc/wfs/url-builder.js";
import {
  ServiceError,
  NotFoundError,
  UpstreamError,
  ValidationError,
} from "./ogc/errors.js";

const normalizeEpsg = (name) => {
  if (!name) return undefined;
  const m = String(name).match(/EPSG[:/]*[:]*([0-9]+)/i);
  return m ? `EPSG:${m[1]}` : undefined;
};

const resolveTypeName = (layer, overrideTypeName) => {
  const tn =
    overrideTypeName ||
    (Array.isArray(layer.layers) && layer.layers.length > 0
      ? layer.layers[0]
      : layer.layers);
  if (!tn) {
    throw new ValidationError("Missing typeName for layer", {
      layerId: layer.id,
      availableLayers: layer.layers,
    });
  }
  return tn;
};

const _layersCache = { mtime: 0, data: null };
const LAYERS_PATH = path.join(process.cwd(), "App_Data", "layers.json");

async function getCachedLayersStore() {
  try {
    const stat = await fs.stat(LAYERS_PATH);
    const mtime = stat.mtimeMs;
    if (_layersCache.data && mtime === _layersCache.mtime) {
      return _layersCache.data;
    }
    const text = await fs.readFile(LAYERS_PATH, "utf-8");
    const json = JSON.parse(text);
    _layersCache.mtime = mtime;
    _layersCache.data = json;
    logger.debug("Layers config reloaded from disk", { mtime });
    return json;
  } catch (error) {
    logger.error("Failed to read layers.json", error);
    // Fall through to ConfigService as fallback
    return null;
  }
}

/**
 * Read the WFST layer store, filtered by AD group membership.
 * Uses in-memory cache with mtime invalidation to avoid disk I/O per request.
 * Falls back to ConfigService when AD filtering is needed (AD checks user groups).
 * Returns { list, byId } where byId is a Map keyed by layer id.
 */
async function getWFSTStore({ user = null, washContent = true } = {}) {
  let store;

  if (process.env.AD_LOOKUP_ACTIVE === "true") {
    store = await ConfigService.getLayersStore(user, washContent);
  } else {
    store = await getCachedLayersStore();
    if (!store) {
      // Cache failed — fall back to ConfigService
      store = await ConfigService.getLayersStore(user, washContent);
    }
  }

  if (store?.error) {
    throw new ServiceError("Failed to read layers store", 500, {
      originalError: store.error?.message || String(store.error),
    });
  }
  const list = store?.wfstlayers || [];
  const byId = new Map(list.map((l) => [String(l.id), l]));
  return { list, byId };
}

/**
 * Look up a single WFST layer by id (with AD filtering).
 * Throws NotFoundError if the layer doesn't exist or the user lacks access.
 */
async function requireLayer(id, { user, washContent } = {}) {
  if (!Validator.isValidId(id)) {
    throw new ValidationError("Invalid layer ID format", { id });
  }
  const { byId } = await getWFSTStore({ user, washContent });
  const layer = byId.get(String(id));
  if (!layer) {
    throw new NotFoundError("WFST layer not found", { layerId: id });
  }
  if (!Validator.isValidUrl(layer.url)) {
    throw new UpstreamError("Invalid layer URL configuration", 500);
  }
  return layer;
}

/** List all WFST layers visible to the current user. */
export async function listWFSTLayers({ fields, user, washContent } = {}) {
  try {
    const { list: layers } = await getWFSTStore({ user, washContent });
    if (!fields) return layers;

    const pickFields = fields
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return pickFields.length ? layers.map((l) => pick(l, pickFields)) : layers;
  } catch (error) {
    logger.error("Failed to list WFST layers", error);
    throw new ServiceError("Failed to retrieve layers", 500, {
      originalError: error.message,
    });
  }
}

/** Get metadata for a single WFST layer. */
export async function getWFSTLayer({ id, fields, user, washContent } = {}) {
  const layer = await requireLayer(id, { user, washContent });
  if (!fields) return layer;

  const pickFields = fields
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return pickFields.length ? pick(layer, pickFields) : layer;
}

/**
 * Fetch features from the upstream WFS server and return the raw response.
 *
 * The backend acts as a transparent proxy:
 *  1. Tries GeoJSON first (most efficient, widely supported).
 *  2. Falls back to GML if the server doesn't support JSON.
 *
 * The response includes a `format` field ("json" or "xml") so the client
 * knows how to parse it. GML parsing is done client-side with OpenLayers.
 */
export async function getWFSTFeatures(params) {
  const {
    user,
    washContent,
    id,
    version,
    typeName,
    srsName,
    bbox,
    limit,
    offset,
    filter,
    cqlFilter,
  } = params;

  if (bbox && !Validator.isValidBbox(bbox)) {
    throw new ValidationError("Invalid bbox format", { bbox });
  }

  const validatedLimit = Validator.validateLimit(limit);
  const validatedOffset = Validator.validateOffset(offset);

  try {
    const layer = await requireLayer(id, { user, washContent });
    const tn = resolveTypeName(layer, typeName);
    const crs = srsName || layer.projection || "EPSG:3006";

    // Build base URL requesting JSON (most servers support this)
    const jsonUrl = buildWfsGetFeatureUrl({
      baseUrl: layer.url,
      version,
      typeName: tn,
      srsName: crs,
      bbox,
      limit: validatedLimit,
      offset: validatedOffset,
      outputFormat: "application/json",
      filter,
      cqlFilter,
    });

    // 1) Try JSON — most efficient, no client-side parsing needed
    let res = await fetchWithRetry(jsonUrl, {
      headers: { Accept: "application/json, application/geo+json" },
    });

    if (res.ok) {
      const ctype = res.headers.get("content-type") || "";
      const text = await readTextWithLimit(res);
      const looksLikeJson = /json/i.test(ctype) || text.trim().startsWith("{");

      if (looksLikeJson) {
        try {
          return {
            format: "json",
            data: JSON.parse(text),
            srsName: normalizeEpsg(crs) || "EPSG:3006",
            layerProjection: layer.projection || "EPSG:3006",
          };
        } catch {
          logger.warn("Response looked like JSON but failed to parse");
        }
      }

      // Server returned OK but with XML/GML instead of JSON (common with
      // QGIS Server which ignores unsupported outputFormat). Reuse this
      // response directly — no need for a second request.
      if (text.trim().startsWith("<")) {
        return {
          format: "xml",
          data: text,
          srsName: normalizeEpsg(crs) || "EPSG:3006",
          layerProjection: layer.projection || "EPSG:3006",
        };
      }
    }

    // 2) Fallback — first request failed or returned unexpected content
    const gmlUrl = rewriteOutputFormat(
      jsonUrl,
      "application/gml+xml; version=3.2"
    );
    res = await fetchWithRetry(gmlUrl, {
      headers: { Accept: "application/xml, text/xml, application/gml+xml" },
    });

    if (!res.ok) {
      const snippet = (await readTextWithLimit(res)).substring(0, 500);
      throw new UpstreamError(`WFS server error: ${snippet}`, res.status);
    }

    return {
      format: "xml",
      data: await readTextWithLimit(res),
      srsName: normalizeEpsg(crs) || "EPSG:3006",
      layerProjection: layer.projection || "EPSG:3006",
    };
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    logger.error("Unexpected error in getWFSTFeatures", error);
    throw new ServiceError("Internal server error", 500, {
      originalError: error.message,
    });
  }
}

/**
 * Forward a WFS-T transaction to the upstream server.
 *
 * The client builds the WFS-T XML using OpenLayers; the backend validates
 * access (AD) and proxies the request to the correct WFS endpoint.
 */
export async function commitWFSTTransaction(params) {
  const { id, user, washContent, transactionXml } = params;

  if (!transactionXml) {
    throw new ValidationError("Transaction XML is required");
  }

  // Guard against oversized payloads (catches both bulk ops and complex geometries)
  if (transactionXml.length > CONSTANTS.MAX_TRANSACTION_XML_BYTES) {
    throw new ValidationError(
      `Transaction XML too large (${(transactionXml.length / 1024 / 1024).toFixed(1)} MB, max ${CONSTANTS.MAX_TRANSACTION_XML_BYTES / 1024 / 1024} MB)`
    );
  }

  const layer = await requireLayer(id, { user, washContent });

  logger.debug("Forwarding WFS-T transaction", {
    url: layer.url,
    xmlLength: transactionXml.length,
  });

  // Use longer timeout for transactions (spatial triggers, indexing)
  const response = await fetchWithTimeout(
    layer.url,
    {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        Accept: "application/xml, text/xml",
      },
      body: transactionXml,
    },
    CONSTANTS.TRANSACTION_TIMEOUT
  );

  const wfsResponse = await readTextWithLimit(response);

  if (!response.ok) {
    logger.error("WFS-T transaction failed", {
      status: response.status,
      response: wfsResponse.substring(0, 500),
    });
    throw new UpstreamError(
      `WFS-T transaction failed: ${response.status}`,
      response.status
    );
  }

  return { wfsResponse };
}

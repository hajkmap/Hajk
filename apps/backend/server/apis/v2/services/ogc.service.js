import { promises as fs } from "fs";
import path from "path";
import ConfigService from "./config.service.js";
import { logger } from "./ogc/logger.js";
import { Validator } from "./ogc/validator.js";
import { pick } from "./ogc/utils/object.js";
import {
  ServiceError,
  NotFoundError,
  UpstreamError,
  ValidationError,
} from "./ogc/errors.js";

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
  // Relative URLs (e.g. /api/v2/proxy/qgis/...) are internal proxy routes
  // and don't need SSRF validation. Only validate absolute URLs.
  const isRelative = layer.url && layer.url.startsWith("/");
  if (!isRelative && !Validator.isValidUrl(layer.url)) {
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


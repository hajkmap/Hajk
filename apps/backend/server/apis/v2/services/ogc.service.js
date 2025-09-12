import SettingsService from "./settings.service.js";
import { XMLParser } from "fast-xml-parser";

const CONSTANTS = {
  DEFAULT_BASE:
    process.env.HAJK_BASE_URL || `http://localhost:${process.env.PORT || 3002}`,
  UPSTREAM_TIMEOUT: Number(process.env.OGC_UPSTREAM_TIMEOUT_MS || 20000),
  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 2000, 4000], // Exponential backoff, in milliseconds
  MAX_LIMIT: 10000,
  CACHE_TTL: 60000,
  MAX_RESPONSE_BYTES: 100 * 1024 * 1024,

  NAMESPACES: {
    GML: "gml:",
    WFS: "wfs:",
  },

  GEOMETRY_TYPES: [
    "Point",
    "LineString",
    "Polygon",
    "MultiPoint",
    "MultiLineString",
    "MultiPolygon",
    "MultiSurface",
    "MultiGeometry",
    "GeometryCollection",
  ],

  WFS_VERSIONS: {
    V1: "1.1.0",
    V2: "2.0.0",
  },

  // Whitelist of domains for SSRF protection (configurable via environment variable)
  ALLOWED_HOSTS: process.env.WFS_ALLOWED_HOSTS
    ? process.env.WFS_ALLOWED_HOSTS.split(",").map((h) => h.trim())
    : null, // null = allow all (backward compatibility)
};

// ========== ERROR HANDLING CLASSES ==========
export class ServiceError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export class NotFoundError extends ServiceError {
  constructor(message, details) {
    super(message, 404, details);
  }
}

export class UpstreamError extends ServiceError {
  constructor(message, status, details) {
    super(message, status, details);
    this.status = status;
  }
}

export class ValidationError extends ServiceError {
  constructor(message, details) {
    super(message, 400, details);
  }
}

// ========== LOGGER ==========
class Logger {
  static log(level, message, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };
    console[level](JSON.stringify(logEntry));
  }

  static error(message, error, context = {}) {
    this.log("error", message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
  }

  static warn(message, context = {}) {
    this.log("warn", message, context);
  }

  static info(message, context = {}) {
    this.log("info", message, context);
  }
}

// ========== VALIDATOR ==========
class Validator {
  static isValidId(id) {
    if (!id) return false;
    return /^[a-zA-Z0-9_-]+$/.test(String(id));
  }

  static isValidUrl(urlString, checkSSRF = true) {
    try {
      const u = new URL(urlString);
      if (!["http:", "https:"].includes(u.protocol)) return false;

      if (checkSSRF && CONSTANTS.ALLOWED_HOSTS) {
        // Whitelist hosts if configured
        const isAllowed = CONSTANTS.ALLOWED_HOSTS.some((allowed) => {
          if (allowed.startsWith("*.")) {
            // Wildcard subdomain (e.g. *.orebro.se)
            const domain = allowed.substring(2);
            return u.hostname === domain || u.hostname.endsWith("." + domain);
          }
          return u.hostname === allowed;
        });

        if (!isAllowed) {
          Logger.warn("URL blocked by SSRF protection", { url: urlString });
          return false;
        }
      }

      // Always block private addresses (IPv4, IPv6 loopback/link-local/ULA)
      const hostname = u.hostname;
      const privateV4 = [
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[01])\./,
        /^192\.168\./,
        /^169\.254\./,
        /^0\.0\.0\.0$/,
      ];
      if (privateV4.some((re) => re.test(hostname))) {
        Logger.warn("Private IPv4 address blocked", { url: urlString });
        return false;
      }
      const hnLower = hostname.toLowerCase();
      if (
        hnLower === "localhost" ||
        hnLower.startsWith("::1") || // loopback
        hnLower.startsWith("fe80:") || // link-local
        hnLower.startsWith("fc") || // ULA (fc00::/7)
        hnLower.startsWith("fd") // ULA (fd00::/7)
      ) {
        Logger.warn("Private IPv6 address blocked", { url: urlString });
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  static isValidBbox(bbox) {
    if (!bbox) return false;
    const parts = String(bbox).split(",");
    if (parts.length < 4) return false;

    const [xmin, ymin, xmax, ymax] = parts.slice(0, 4).map(Number);

    // Check that all values are finite numbers (not Infinity or NaN)
    if (![xmin, ymin, xmax, ymax].every(Number.isFinite)) return false;

    // Check sort
    return xmax > xmin && ymax > ymin;
  }

  static validateLimit(limit) {
    if (limit == null) return null;
    const num = parseInt(limit, 10);
    if (isNaN(num) || num < 0) return null;
    return Math.min(num, CONSTANTS.MAX_LIMIT);
  }

  static validateOffset(offset) {
    if (offset == null) return null;
    const num = parseInt(offset, 10);
    return isNaN(num) || num < 0 ? null : num;
  }

  static sanitizeString(str) {
    if (!str) return "";
    // NOTE: do not use this against OGC-XML (can destroy filter). For UI/logging OK.
    return String(str).replace(/[<>]/g, "");
  }
}

// ========== CACHE ==========
class SimpleCache {
  constructor(ttl = CONSTANTS.CACHE_TTL) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  clear() {
    this.cache.clear();
  }
}

const layerCache = new SimpleCache();

// ========== HELPER FUNCTIONS ==========
function pick(obj, fields) {
  if (!fields?.length) return { ...obj }; // Return copy to avoid mutation
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => fields.includes(k))
  );
}

async function fetchWithTimeout(
  url,
  options = {},
  timeout = CONSTANTS.UPSTREAM_TIMEOUT
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error?.name === "AbortError") {
      throw new UpstreamError("Request timeout", 504);
    }
    throw error;
  }
}

async function fetchWithRetry(url, options = {}, retryCount = 0) {
  try {
    const response = await fetchWithTimeout(url, options);

    // On server errors (502, 503, 504) and we have retries left
    if (
      [502, 503, 504].includes(response.status) &&
      retryCount < CONSTANTS.MAX_RETRIES
    ) {
      const delay = CONSTANTS.RETRY_DELAYS[retryCount] || 5000;
      Logger.warn("Retrying after server error", {
        url,
        status: response.status,
        retryCount,
        delay,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retryCount + 1);
    }

    return response;
  } catch (error) {
    // Also retry on network errors / timeouts
    if (retryCount < CONSTANTS.MAX_RETRIES) {
      const delay = CONSTANTS.RETRY_DELAYS[retryCount] || 5000;
      Logger.warn("Retrying after network/timeout error", {
        url,
        retryCount,
        delay,
        err: error?.message,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retryCount + 1);
    }
    throw error;
  }
}

function ensureNotTooLarge(res) {
  const contentLength = res.headers.get("content-length");
  if (
    contentLength &&
    parseInt(contentLength, 10) > CONSTANTS.MAX_RESPONSE_BYTES
  ) {
    throw new UpstreamError("Response too large", 413);
  }
}

// ========== CONFIG ==========
async function getWFSTStore({
  baseUrl = CONSTANTS.DEFAULT_BASE,
  prefer = "api",
} = {}) {
  const cacheKey = `layers_${baseUrl}_${prefer}`;
  const cached = layerCache.get(cacheKey);
  if (cached) return cached;

  let layers = [];

  if (prefer === "api") {
    try {
      const url = new URL("/api/v2/mapconfig/layers", baseUrl);
      const response = await fetchWithTimeout(
        url.toString(),
        {
          headers: { Accept: "application/json" },
        },
        5000 // Short timeout for API
      );

      if (response.ok) {
        ensureNotTooLarge(response);
        const data = await response.json();
        if (Array.isArray(data?.wfstlayers)) {
          layers = data.wfstlayers;
        }
      }
    } catch (error) {
      Logger.warn("Failed to fetch layers from API, falling back to file", {
        error: error.message,
        baseUrl,
      });
    }
  }

  // Fall back to file if API failed
  if (!layers.length) {
    try {
      const store = await SettingsService.readFileAsJson("layers.json");
      layers = store?.wfstlayers || [];
    } catch (error) {
      Logger.error("Failed to read layers from file", error);
      layers = [];
    }
  }

  layerCache.set(cacheKey, layers);
  return layers;
}

// ========== WFS URL BUILDER ==========
function buildWfsGetFeatureUrl(options) {
  const {
    baseUrl,
    version = CONSTANTS.WFS_VERSIONS.V1,
    typeName,
    srsName,
    bbox,
    limit,
    offset,
    outputFormat = "application/json",
    filter,
    cqlFilter,
  } = options;

  if (!Validator.isValidUrl(baseUrl)) {
    throw new ValidationError("Invalid base URL");
  }

  const url = new URL(baseUrl);
  const isV2 = version.startsWith("2.");

  // Basic WFS parameters
  url.searchParams.set("SERVICE", "WFS");
  url.searchParams.set("REQUEST", "GetFeature");
  url.searchParams.set("VERSION", version);
  if (srsName) url.searchParams.set("SRSNAME", srsName);

  // Set outputformat in all possible ways for compatibility
  url.searchParams.set("OUTPUTFORMAT", outputFormat);
  url.searchParams.set("outputFormat", outputFormat);
  url.searchParams.set("outputformat", outputFormat);

  // Version-specific parameters
  if (isV2) {
    url.searchParams.set("TYPENAMES", typeName);
    if (limit != null) url.searchParams.set("COUNT", String(limit));
    if (offset != null) url.searchParams.set("startIndex", String(offset));
  } else {
    url.searchParams.set("TYPENAME", typeName);
    if (limit != null) url.searchParams.set("MAXFEATURES", String(limit));
    if (offset != null) url.searchParams.set("STARTINDEX", String(offset));
  }

  // Compatibility mode
  if (process.env.OGC_WFS_PARAM_COMPAT === "both") {
    url.searchParams.set("TYPENAME", typeName);
    url.searchParams.set("TYPENAMES", typeName);
    if (limit != null) {
      url.searchParams.set("MAXFEATURES", String(limit));
      url.searchParams.set("COUNT", String(limit));
    }
    if (offset != null) {
      url.searchParams.set("STARTINDEX", String(offset));
      url.searchParams.set("startIndex", String(offset));
    }
  }

  // Optional parameters
  if (bbox) {
    const bboxValue = bbox.includes(",EPSG") ? bbox : `${bbox},${srsName}`;
    url.searchParams.set("BBOX", bboxValue);
  }
  if (filter) url.searchParams.set("FILTER", filter);
  if (cqlFilter) url.searchParams.set("CQL_FILTER", cqlFilter);

  return url.toString();
}

function rewriteOutputFormat(urlStr, fmt) {
  const u = new URL(urlStr);
  u.searchParams.set("OUTPUTFORMAT", fmt);
  u.searchParams.set("outputFormat", fmt);
  u.searchParams.set("outputformat", fmt);
  return u.toString();
}

// ========== GML PARSER ==========
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const notNs = (k) => !k.startsWith("gml:") && !k.startsWith("wfs:");
const asText = (v) => (isObj(v) ? (v["#text"] ?? "") : (v ?? ""));
const nums = (s) =>
  s
    .trim()
    .split(/[ ,\n\r\t]+/)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
const posToCoord = (s) => {
  const n = nums(s);
  return [n[0], n[1]];
};
const posListToCoords = (s) => {
  const n = nums(s);
  const out = [];
  for (let i = 0; i < n.length - 1; i += 2) out.push([n[i], n[i + 1]]);
  return out;
};
const coordsElToCoords = (s) =>
  s
    .trim()
    .split(/\s+/)
    .map((p) => p.split(",").map(Number));

// Return only the key that actually exists in the object
const keyOf = (obj, localName) =>
  Object.keys(obj || {}).find(
    (k) => k === localName || k.endsWith(`:${localName}`)
  );

const keyOfAny = (obj, names) =>
  (names || [])
    .map((n) => keyOf(obj, n))
    .find((k) => k && obj?.[k] !== undefined);

function getProp(obj, localNames) {
  if (!obj) return undefined;
  for (const name of localNames) {
    const pref = keyOf(obj, name);
    if (pref && obj[pref] !== undefined) return obj[pref];
  }
  return undefined;
}

function ensureClosed(ring) {
  if (!Array.isArray(ring) || ring.length === 0) return ring || [];
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  return fx === lx && fy === ly ? ring : [...ring, ring[0]];
}

function parseRing(linearRingObj) {
  if (!linearRingObj || typeof linearRingObj !== "object") return [];

  const posList = getProp(linearRingObj, ["posList"]);
  if (posList) return posListToCoords(asText(posList));

  const coordsEl = getProp(linearRingObj, ["coordinates"]);
  if (coordsEl) return coordsElToCoords(asText(coordsEl));

  const pos = getProp(linearRingObj, ["pos"]);
  if (pos) {
    const arr = Array.isArray(pos) ? pos : [pos];
    return arr.map((p) => posToCoord(asText(p)));
  }

  return [];
}

// Recursive geometry search
function findGeometryEntry(featureObj) {
  const hasGeom = (o) =>
    CONSTANTS.GEOMETRY_TYPES.some((n) => {
      const k = keyOf(o, n);
      return k && o[k] !== undefined;
    });

  function dfs(obj, depth = 0) {
    if (depth > 10) return null; // Avoid infinite loop
    for (const [k, v] of Object.entries(obj || {})) {
      if (!isObj(v)) continue;
      if (hasGeom(v)) return [k, v]; // direct hit
      const nested = dfs(v, depth + 1); // search deeper
      if (nested) return nested;
    }
    return null;
  }

  return dfs(featureObj) || [null, null];
}

function gmlGeomToGeoJSON(g) {
  if (!g || !isObj(g)) return null;

  // Point
  const pointKey = keyOf(g, "Point");
  if (pointKey && g[pointKey]) {
    const p = g[pointKey];
    const pos = getProp(p, ["pos"]);
    const coordsEl = getProp(p, ["coordinates"]);
    const coord = pos
      ? posToCoord(asText(pos))
      : coordsEl
        ? coordsElToCoords(asText(coordsEl))[0]
        : null;
    return coord ? { type: "Point", coordinates: coord } : null;
  }

  // LineString
  const lineKey = keyOf(g, "LineString");
  if (lineKey && g[lineKey]) {
    const ls = g[lineKey];
    const posList = getProp(ls, ["posList"]);
    const coordsEl = getProp(ls, ["coordinates"]);
    const coordinates = posList
      ? posListToCoords(asText(posList))
      : coordsEl
        ? coordsElToCoords(asText(coordsEl))
        : [];
    return { type: "LineString", coordinates };
  }

  // Polygon
  const polyKey = keyOf(g, "Polygon");
  if (polyKey && g[polyKey]) {
    const poly = g[polyKey];
    const exteriorKey = keyOfAny(poly, ["exterior", "outerBoundaryIs"]);
    const exteriorObj = exteriorKey ? poly[exteriorKey] : null;
    const lrExteriorKey = exteriorObj ? keyOf(exteriorObj, "LinearRing") : null;
    const exteriorRing = lrExteriorKey
      ? parseRing(exteriorObj[lrExteriorKey])
      : [];
    const exterior = ensureClosed(exteriorRing);

    const interiorKey = keyOfAny(poly, ["interior", "innerBoundaryIs"]);
    const interiorsRaw = interiorKey ? poly[interiorKey] : undefined;
    const interiorsArr = Array.isArray(interiorsRaw)
      ? interiorsRaw
      : interiorsRaw
        ? [interiorsRaw]
        : [];
    const holes = interiorsArr
      .map((i) => {
        const lrk = keyOf(i, "LinearRing");
        const ring = lrk ? parseRing(i[lrk]) : [];
        return ensureClosed(ring);
      })
      .filter((r) => r.length);

    return { type: "Polygon", coordinates: [exterior, ...holes] };
  }

  // MultiPoint - support singular/plural
  const mpKey = keyOf(g, "MultiPoint");
  if (mpKey && g[mpKey]) {
    const mp = g[mpKey];
    const memberK = keyOfAny(mp, ["pointMember", "pointMembers"]);
    const members = Array.isArray(mp[memberK])
      ? mp[memberK]
      : mp[memberK]
        ? [mp[memberK]]
        : [];
    const coords = members
      .map((m) => {
        const pk = keyOf(m, "Point");
        return pk ? gmlGeomToGeoJSON({ [pk]: m[pk] })?.coordinates : null;
      })
      .filter(Boolean);
    return { type: "MultiPoint", coordinates: coords };
  }

  // MultiLineString - support singular/plural
  const mlsKey = keyOf(g, "MultiLineString");
  if (mlsKey && g[mlsKey]) {
    const ml = g[mlsKey];
    const memberK = keyOfAny(ml, ["lineStringMember", "lineStringMembers"]);
    const members = Array.isArray(ml[memberK])
      ? ml[memberK]
      : ml[memberK]
        ? [ml[memberK]]
        : [];
    const coords = members
      .map((m) => {
        const lk = keyOf(m, "LineString");
        return lk ? gmlGeomToGeoJSON({ [lk]: m[lk] })?.coordinates : null;
      })
      .filter(Boolean);
    return { type: "MultiLineString", coordinates: coords };
  }

  // MultiPolygon & MultiSurface - support singular/plural
  const mpolyKey = keyOf(g, "MultiPolygon");
  const msurfKey = keyOf(g, "MultiSurface");
  if ((mpolyKey && g[mpolyKey]) || (msurfKey && g[msurfKey])) {
    const cont = g[mpolyKey || msurfKey];
    const memberK = keyOfAny(cont, [
      "polygonMember",
      "polygonMembers",
      "surfaceMember",
      "surfaceMembers",
    ]);
    const members = Array.isArray(cont[memberK])
      ? cont[memberK]
      : cont[memberK]
        ? [cont[memberK]]
        : [];
    const polys = members
      .map((m) => {
        const pk = keyOf(m, "Polygon");
        const polyGeom = pk ? gmlGeomToGeoJSON({ [pk]: m[pk] }) : null;
        return polyGeom ? polyGeom.coordinates : null;
      })
      .filter(Boolean);
    return { type: "MultiPolygon", coordinates: polys };
  }

  // MultiGeometry / GeometryCollection
  const mgKey = keyOf(g, "MultiGeometry") || keyOf(g, "GeometryCollection");
  if (mgKey && g[mgKey]) {
    const mg = g[mgKey];
    const memberK = keyOfAny(mg, ["geometryMember", "geometryMembers"]);
    const members = Array.isArray(mg[memberK])
      ? mg[memberK]
      : mg[memberK]
        ? [mg[memberK]]
        : [];
    const geometries = members
      .map((m) => gmlGeomToGeoJSON(m)) // m is normally an object with an underlying geometry key
      .filter(Boolean);
    return { type: "GeometryCollection", geometries };
  }

  return null;
}

function removeNamespacePrefix(key) {
  const parts = key.split(":");
  return parts.length > 1 ? parts[parts.length - 1] : key;
}

function memberToFeature(member) {
  let featureNode = null;
  let featureName = null;

  if (isObj(member)) {
    for (const k of Object.keys(member)) {
      if (notNs(k) && isObj(member[k])) {
        featureName = k;
        featureNode = member[k];
        break;
      }
    }

    if (
      !featureNode &&
      Object.keys(member).length &&
      notNs(Object.keys(member)[0])
    ) {
      featureName = Object.keys(member)[0];
      featureNode = member[featureName];
    }
  }

  if (!featureNode) return null;

  const [geomKey, geomVal] = findGeometryEntry(featureNode);
  const geometry = geomKey ? gmlGeomToGeoJSON(geomVal) : null;

  const properties = {};
  for (const [k, v] of Object.entries(featureNode)) {
    if (k === geomKey) continue;
    if (k.startsWith("gml:")) continue;
    if (isObj(v) && Object.keys(v).some((kk) => kk.startsWith("gml:")))
      continue;

    // Remove namespace prefix from property keys and resolve simple conflicts (keep first)
    const cleanKey = removeNamespacePrefix(k);
    const value = isObj(v) && "#text" in v ? v["#text"] : v;
    if (!(cleanKey in properties)) properties[cleanKey] = value;
  }

  const id =
    featureNode?.["@_gml:id"] || featureNode?.["@_fid"] || properties?.id;

  return {
    type: "Feature",
    id,
    geometry,
    properties,
  };
}

function gmlToFeatureCollection(xmlText) {
  try {
    const doc = xmlParser.parse(xmlText);
    const root =
      doc["wfs:FeatureCollection"] || doc["FeatureCollection"] || doc;

    const numberMatched =
      root?.["@_numberMatched"] !== undefined
        ? Number(root["@_numberMatched"])
        : undefined;
    const numberReturned =
      root?.["@_numberReturned"] !== undefined
        ? Number(root["@_numberReturned"])
        : undefined;
    const timeStamp = root?.["@_timeStamp"];

    let members = [];
    if (Array.isArray(root?.["wfs:member"])) members = root["wfs:member"];
    else if (root?.["wfs:member"]) members = [root["wfs:member"]];
    else if (Array.isArray(root?.["gml:featureMember"]))
      members = root["gml:featureMember"];
    else if (root?.["gml:featureMember"]) members = [root["gml:featureMember"]];
    else if (root?.["gml:featureMembers"]) {
      members = Object.values(root["gml:featureMembers"]).flatMap((v) =>
        Array.isArray(v) ? v : [v]
      );
    } else {
      members = Object.values(root).filter(
        (v) => isObj(v) && Object.keys(v).some(notNs)
      );
    }

    const features = members.map((m) => memberToFeature(m)).filter(Boolean);

    const fc = { type: "FeatureCollection", features };
    if (Number.isFinite(numberMatched)) fc.numberMatched = numberMatched;
    if (Number.isFinite(numberReturned)) fc.numberReturned = numberReturned;
    if (timeStamp) fc.timeStamp = timeStamp;

    return fc;
  } catch (error) {
    Logger.error("Failed to parse GML", error);
    throw new UpstreamError("Failed to parse GML response", 502);
  }
}

// ========== PUBLIC API FUNCTIONS ==========
export async function listWFSTLayers({ fields, baseUrl } = {}) {
  try {
    const layers = await getWFSTStore({ baseUrl, prefer: "api" });

    if (!fields) return layers;

    const pickFields = fields
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!pickFields.length) return layers;

    return layers.map((layer) => pick(layer, pickFields));
  } catch (error) {
    Logger.error("Failed to list WFST layers", error);
    throw new ServiceError("Failed to retrieve layers", 500, {
      originalError: error.message,
    });
  }
}

export async function getWFSTFeatures(params) {
  const {
    id,
    version,
    typeName,
    srsName,
    bbox,
    limit,
    offset,
    filter,
    cqlFilter,
    baseUrl,
  } = params;

  if (!Validator.isValidId(id)) {
    throw new ValidationError("Invalid layer ID format", { id });
  }

  if (bbox && !Validator.isValidBbox(bbox)) {
    throw new ValidationError(
      "Invalid bbox format (must be: xmin,ymin,xmax,ymax)",
      { bbox }
    );
  }

  const validatedLimit = Validator.validateLimit(limit);
  const validatedOffset = Validator.validateOffset(offset);

  try {
    const layers = await getWFSTStore({ baseUrl, prefer: "api" });
    const layer = layers.find((l) => String(l.id) === String(id));

    if (!layer) {
      throw new NotFoundError("WFST layer not found", { layerId: id });
    }

    if (!Validator.isValidUrl(layer.url)) {
      throw new UpstreamError("Invalid layer URL configuration", 500);
    }

    const tn =
      typeName ||
      (Array.isArray(layer.layers) ? layer.layers[0] : layer.layers);
    if (!tn) {
      throw new ValidationError("Missing typeName for layer");
    }

    const crs = srsName || layer.projection || "EPSG:4326";

    // 1) Try JSON
    const urlJson = buildWfsGetFeatureUrl({
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

    let res = await fetchWithRetry(urlJson, {
      headers: {
        Accept:
          "application/json, application/geo+json, application/vnd.geo+json",
      },
    });

    ensureNotTooLarge(res);
    let ctype = res.headers.get("content-type") || "";
    let text = await res.text();

    // 4xx handling: abort directly for "hard" client errors, but let format errors fall through to GML
    if (!res.ok && res.status >= 400 && res.status < 500) {
      const snippet = text.substring(0, 500);
      const maybeFormatIssue =
        res.status === 406 ||
        res.status === 415 ||
        /output|format|json|geo\s*\+?\s*json/i.test(snippet);

      if (!maybeFormatIssue) {
        Logger.warn("Client error from WFS server (no fallback)", {
          status: res.status,
          url: layer.url,
          error: snippet,
        });
        throw new UpstreamError(`WFS server error: ${snippet}`, res.status);
      }
    }

    const isJsonCtype = /application\/(vnd\.geo\+json|geo\+json|json)/i.test(
      ctype
    );

    if (res.ok && (isJsonCtype || text.trim().startsWith("{"))) {
      try {
        const fc = JSON.parse(text);

        // Normalize various WFS implementations
        if (typeof fc.totalFeatures === "number") {
          fc.numberMatched = fc.totalFeatures;
        }
        if (
          Array.isArray(fc.features) &&
          typeof fc.numberReturned !== "number"
        ) {
          fc.numberReturned = fc.features.length;
        }

        return fc;
      } catch (parseError) {
        Logger.warn("Failed to parse JSON response, trying GML", {
          error: parseError.message,
        });
        // Fall through to GML
      }
    }

    // 2) Fallback to GML3
    const urlGml3 = rewriteOutputFormat(
      urlJson,
      "application/gml+xml; version=3.2"
    );
    res = await fetchWithRetry(urlGml3, {
      headers: { Accept: "application/xml, text/xml, application/gml+xml" },
    });

    ensureNotTooLarge(res);
    text = await res.text();

    if (res.ok && text.trim().startsWith("<")) {
      return gmlToFeatureCollection(text);
    }

    // 3) Last try with GML2
    const urlGml2 = rewriteOutputFormat(urlJson, "GML2");
    res = await fetchWithRetry(urlGml2, {
      headers: { Accept: "application/xml, text/xml" },
    });

    ensureNotTooLarge(res);
    text = await res.text();

    if (res.ok && text.trim().startsWith("<")) {
      return gmlToFeatureCollection(text);
    }

    // No format worked
    throw new UpstreamError(
      "Upstream server did not return valid GeoJSON or GML",
      res.status || 502
    );
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error;
    }

    Logger.error("Unexpected error in getWFSTFeatures", error);
    throw new ServiceError("Internal server error", 500, {
      originalError: error.message,
    });
  }
}

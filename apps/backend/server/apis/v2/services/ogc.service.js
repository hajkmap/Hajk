import SettingsService from "./settings.service.js";
import { XMLParser } from "fast-xml-parser";

const DEFAULT_BASE =
  process.env.HAJK_BASE_URL || `http://localhost:${process.env.PORT || 3002}`;
const UPSTREAM_TIMEOUT = Number(process.env.OGC_UPSTREAM_TIMEOUT_MS || 20000);

export class NotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.name = "NotFoundError";
  }
}

export class UpstreamError extends Error {
  constructor(msg, status) {
    super(msg);
    this.name = "UpstreamError";
    this.status = status;
  }
}

// ---------- config ----------
async function getWFSTStore({ baseUrl = DEFAULT_BASE, prefer = "api" } = {}) {
  // 1) Try via existing API
  if (prefer === "api") {
    try {
      const r = await fetch(`${baseUrl}/api/v2/mapconfig/layers`, {
        headers: { Accept: "application/json" },
      });
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j?.wfstlayers)) return j.wfstlayers;
      }
    } catch (_) {
      // Ignore and fall back to file
    }
  }

  // 2) Fallback: read from layers.json via SettingsService
  const store = await SettingsService.readFileAsJson("layers.json");
  return store?.wfstlayers || [];
}

function isValidUrl(urlString) {
  try {
    const u = new URL(urlString);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}

function isValidBbox(bbox) {
  const parts = String(bbox).split(",");
  return (
    parts.length >= 4 &&
    parts.slice(0, 4).every((p) => !Number.isNaN(parseFloat(p)))
  );
}

async function fetchWithTimeout(url, options = {}, timeout = UPSTREAM_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    if (err?.name === "AbortError") {
      throw new UpstreamError("Request timeout", 504);
    }
    throw err;
  }
}

function pick(obj, fields) {
  if (!fields?.length) return obj;
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => fields.includes(k))
  );
}

// ---------- WFS URL-helper (1.1.0 & 2.0.0) ----------
function buildWfsGetFeatureUrl({
  baseUrl,
  version,
  typeName,
  srsName,
  bbox,
  limit,
  offset,
  outputFormat,
  filter,
  cqlFilter,
}) {
  const v = String(version || "1.1.0");
  const is20 = v.startsWith("2.");

  const params = {
    SERVICE: "WFS",
    REQUEST: "GetFeature",
    VERSION: v,
    SRSNAME: srsName,
    OUTPUTFORMAT: outputFormat || "application/json",
  };

  if (is20) {
    params.TYPENAMES = typeName;
    if (limit != null) params.COUNT = String(limit);
    if (offset != null) params.startIndex = String(offset); // 0-based
  } else {
    params.TYPENAME = typeName;
    if (limit != null) params.MAXFEATURES = String(limit);
    if (offset != null) params.STARTINDEX = String(offset);
  }

  // Duplicate parameters for compatibility
  if (process.env.OGC_WFS_PARAM_COMPAT === "both") {
    params.TYPENAME = typeName;
    params.TYPENAMES = typeName;
    if (limit != null) {
      params.MAXFEATURES = String(limit);
      params.COUNT = String(limit);
    }
    if (offset != null) {
      params.STARTINDEX = String(offset);
      params.startIndex = String(offset);
    }
  }

  if (bbox) params.BBOX = bbox.includes(",EPSG") ? bbox : `${bbox},${srsName}`;
  if (filter) params.FILTER = filter; // OGC Filter (XML)
  if (cqlFilter) params.CQL_FILTER = cqlFilter; // GeoServer

  const qs = new URLSearchParams(params).toString();
  return baseUrl + (baseUrl.includes("?") ? "&" : "?") + qs;
}

function rewriteOutputFormat(urlStr, fmt) {
  const u = new URL(urlStr, "http://dummy");
  u.searchParams.set("OUTPUTFORMAT", fmt);
  u.searchParams.set("outputFormat", fmt);
  return u.toString().replace("http://dummy", "");
}

// ---------- GML -> GeoJSON ----------
const xp = new XMLParser({
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

const keyOf = (obj, localName) =>
  Object.keys(obj || {}).find((k) => k.endsWith(`:${localName}`));
const keyOfAny = (obj, names) =>
  (names || []).map((n) => keyOf(obj, n)).find(Boolean);
function getProp(obj, localNames) {
  if (!obj) return undefined;
  for (const name of localNames) {
    const pref = keyOf(obj, name);
    if (pref && obj[pref] !== undefined) return obj[pref];
    if (obj[name] !== undefined) return obj[name];
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
  let pos = getProp(linearRingObj, ["pos"]);
  if (pos) {
    const arr = Array.isArray(pos) ? pos : [pos];
    return arr.map((p) => posToCoord(asText(p)));
  }
  return [];
}

function gmlGeomToGeoJSON(g) {
  if (!g || !isObj(g)) return null;

  // Point
  const pointKey = keyOf(g, "Point");
  if (pointKey) {
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
  if (lineKey) {
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

  // Polygon (GML3: exterior/interior, GML2: outerBoundaryIs/innerBoundaryIs)
  const polyKey = keyOf(g, "Polygon");
  if (polyKey) {
    const poly = g[polyKey];

    const exteriorKey = keyOfAny(poly, ["exterior", "outerBoundaryIs"]);
    const exteriorObj = exteriorKey ? poly[exteriorKey] : null;
    const lrExteriorKey = exteriorObj
      ? keyOfAny(exteriorObj, ["LinearRing"])
      : null;
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
        const lrk = keyOfAny(i, ["LinearRing"]);
        const ring = lrk ? parseRing(i[lrk]) : [];
        return ensureClosed(ring);
      })
      .filter((r) => r.length);

    return { type: "Polygon", coordinates: [exterior, ...holes] };
  }

  // MultiPoint
  const mpKey = keyOf(g, "MultiPoint");
  if (mpKey) {
    const mp = g[mpKey];
    const memberK = keyOfAny(mp, ["pointMember"]);
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

  // MultiLineString
  const mlsKey = keyOf(g, "MultiLineString");
  if (mlsKey) {
    const ml = g[mlsKey];
    const memberK = keyOfAny(ml, ["lineStringMember"]);
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

  // MultiPolygon & MultiSurface
  const mpolyKey = keyOf(g, "MultiPolygon");
  const msurfKey = keyOf(g, "MultiSurface");
  if (mpolyKey || msurfKey) {
    const cont = g[mpolyKey || msurfKey];
    const memberK = keyOfAny(cont, [
      mpolyKey ? "polygonMember" : "surfaceMember",
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

  return null;
}

function findGeometryEntry(featureObj) {
  const hasGeom = (o) =>
    [
      "Point",
      "LineString",
      "Polygon",
      "MultiPoint",
      "MultiLineString",
      "MultiPolygon",
      "MultiSurface",
    ].some((n) => !!keyOf(o, n));

  for (const [k, v] of Object.entries(featureObj || {})) {
    if (!isObj(v)) continue;
    if (hasGeom(v)) return [k, v];
    if (Object.values(v).some((x) => isObj(x) && hasGeom(x))) return [k, v];
  }
  return [null, null];
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
    properties[k] = isObj(v) && "#text" in v ? v["#text"] : v;
  }

  const id =
    featureNode?.["@_gml:id"] || featureNode?.["@_fid"] || properties?.id;
  return { type: "Feature", id, geometry, properties };
}

function gmlToFeatureCollection(xmlText) {
  const doc = xp.parse(xmlText);
  const root = doc["wfs:FeatureCollection"] || doc["FeatureCollection"] || doc;

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
  else if (root?.["gml:featureMembers"])
    members = Object.values(root["gml:featureMembers"]).flatMap((v) =>
      Array.isArray(v) ? v : [v]
    );
  else
    members = Object.values(root).filter(
      (v) => isObj(v) && Object.keys(v).some(notNs)
    );

  const features = members.map((m) => memberToFeature(m)).filter(Boolean);

  const fc = { type: "FeatureCollection", features };
  if (Number.isFinite(numberMatched)) fc.numberMatched = numberMatched;
  if (Number.isFinite(numberReturned)) fc.numberReturned = numberReturned;
  if (timeStamp) fc.timeStamp = timeStamp;
  return fc;
}

// ---------- Public servises ----------
export async function listWFSTLayers({ fields, baseUrl } = {}) {
  const layers = await getWFSTStore({ baseUrl, prefer: "api" });
  const pickFields = (fields || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return pickFields.length ? layers.map((l) => pick(l, pickFields)) : layers;
}

export async function getWFSTFeatures({
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
}) {
  const layers = await getWFSTStore({ baseUrl, prefer: "api" });
  const layer = layers.find((l) => String(l.id) === String(id));
  if (!layer) throw new NotFoundError("WFST-layer not found");

  if (!isValidUrl(layer.url)) throw new UpstreamError("Invalid layer URL", 400);
  if (bbox && !isValidBbox(bbox))
    throw new UpstreamError("Invalid bbox format", 400);

  const tn =
    typeName || (Array.isArray(layer.layers) ? layer.layers[0] : layer.layers);
  if (!tn) throw new UpstreamError("Missing typeName for layer", 400);

  const crs = srsName || layer.projection || "EPSG:4326";

  // 1) JSON attempt
  const urlJson = buildWfsGetFeatureUrl({
    baseUrl: layer.url,
    version,
    typeName: tn,
    srsName: crs,
    bbox,
    limit,
    offset,
    outputFormat: "application/json",
    filter,
    cqlFilter,
  });

  let res = await fetchWithTimeout(urlJson, {
    headers: { Accept: "application/json" },
  });
  let ctype = res.headers.get("content-type") || "";
  let text = await res.text();

  if (!res.ok) {
    console.warn(
      `Upstream error from ${layer.url}: ${res.status} - ${text.substring(0, 200)}`
    );
  }
  if (
    res.ok &&
    (ctype.includes("application/json") || text.trim().startsWith("{"))
  ) {
    try {
      const fc = JSON.parse(text);
      // GeoServer: totalFeatures; WFS 2.0 JSON: numberMatched
      if (typeof fc.totalFeatures === "number")
        fc.numberMatched = fc.totalFeatures;
      if (Array.isArray(fc.features) && typeof fc.numberReturned !== "number")
        fc.numberReturned = fc.features.length;
      return fc;
    } catch {
      // fall through to GML
    }
  }

  // 2) GML3 fallback
  const urlGml3 = rewriteOutputFormat(
    urlJson,
    "application/gml+xml; version=3.2"
  );
  res = await fetchWithTimeout(urlGml3, {
    headers: { Accept: "application/xml,text/xml,application/gml+xml" },
  });
  text = await res.text();
  if (res.ok && text.trim().startsWith("<"))
    return gmlToFeatureCollection(text);

  // 3) GML2 fallback
  const urlGml2 = rewriteOutputFormat(urlJson, "GML2");
  res = await fetchWithTimeout(urlGml2, {
    headers: { Accept: "application/xml,text/xml" },
  });
  text = await res.text();
  if (res.ok && text.trim().startsWith("<"))
    return gmlToFeatureCollection(text);

  throw new UpstreamError(
    "Upstream gav varken GeoJSON eller GML",
    res.status || 502
  );
}

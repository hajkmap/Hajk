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

// ---------- WFS URL-helper ----------
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
  const params = {
    SERVICE: "WFS",
    REQUEST: "GetFeature",
    VERSION: version || "1.1.0",
    TYPENAME: typeName,
    SRSNAME: srsName,
    OUTPUTFORMAT: outputFormat || "application/json",
  };
  if (bbox) params.BBOX = bbox.includes(",EPSG") ? bbox : `${bbox},${srsName}`;
  if (limit) params.MAXFEATURES = String(limit);
  if (offset) params.STARTINDEX = String(offset);
  if (filter) params.FILTER = filter; // OGC Filter (XML)
  if (cqlFilter) params.CQL_FILTER = cqlFilter; // GeoServer CQL filter (optional)

  const qs = new URLSearchParams(params).toString();
  return baseUrl + (baseUrl.includes("?") ? "&" : "?") + qs;
}

function rewriteOutputFormat(urlStr, fmt) {
  const u = new URL(urlStr, "http://dummy");
  u.searchParams.set("OUTPUTFORMAT", fmt);
  u.searchParams.set("outputFormat", fmt);
  return (
    (urlStr.startsWith("http") ? "" : "") +
    u.toString().replace("http://dummy", "")
  );
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

function parseRing(obj) {
  if (obj?.["gml:posList"]) return posListToCoords(asText(obj["gml:posList"]));
  if (obj?.["gml:coordinates"])
    return coordsElToCoords(asText(obj["gml:coordinates"]));
  return [];
}

const keyOf = (obj, localName) =>
  Object.keys(obj).find((k) => k.endsWith(`:${localName}`));
const hasGeomLocal = (o, name) => !!keyOf(o, name);

const keyOfAny = (obj, names) => names.map((n) => keyOf(obj, n)).find(Boolean);
function ensureClosed(ring) {
  if (!ring || ring.length === 0) return ring || [];
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  return fx === lx && fy === ly ? ring : [...ring, ring[0]];
}

function gmlGeomToGeoJSON(g) {
  if (!g || !isObj(g)) return null;

  const pointKey = keyOf(g, "Point");
  if (pointKey) {
    const p = g[pointKey];
    const pos = p["gml:pos"] || p["gml2:pos"] || p["pos"];
    const coordsEl =
      p["gml:coordinates"] || p["gml2:coordinates"] || p["coordinates"];
    const coord = pos
      ? posToCoord(asText(pos))
      : coordsEl
        ? coordsElToCoords(asText(coordsEl))[0]
        : null;
    return coord ? { type: "Point", coordinates: coord } : null;
  }

  const lineKey = keyOf(g, "LineString");
  if (lineKey) {
    const ls = g[lineKey];
    const posList = ls["gml:posList"] || ls["gml2:posList"] || ls["posList"];
    const coordsEl =
      ls["gml:coordinates"] || ls["gml2:coordinates"] || ls["coordinates"];
    const coordinates = posList
      ? posListToCoords(asText(posList))
      : coordsEl
        ? coordsElToCoords(asText(coordsEl))
        : [];
    return { type: "LineString", coordinates };
  }

  const polyKey = keyOf(g, "Polygon");
  if (polyKey) {
    const poly = g[polyKey];

    // exterior / outerBoundaryIs
    const exteriorKey = keyOfAny(poly, ["exterior", "outerBoundaryIs"]);
    const exteriorObj = exteriorKey ? poly[exteriorKey] : null;
    const linearRingKey = exteriorObj
      ? keyOfAny(exteriorObj, ["LinearRing"])
      : null;
    const exteriorRing = linearRingKey
      ? parseRing(exteriorObj[linearRingKey])
      : [];
    const exterior = ensureClosed(exteriorRing);

    // interior(s) / innerBoundaryIs
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

  const mpKey = keyOf(g, "MultiPoint");
  if (mpKey) {
    const mp = g[mpKey];
    const memberK = keyOf(mp, "pointMember");
    const members = Array.isArray(mp[memberK])
      ? mp[memberK]
      : mp[memberK]
        ? [mp[memberK]]
        : [];
    return {
      type: "MultiPoint",
      coordinates: members
        .map(
          (m) =>
            gmlGeomToGeoJSON({ [keyOf(m, "Point")]: m[keyOf(m, "Point")] })
              ?.coordinates
        )
        .filter(Boolean),
    };
  }

  const mlsKey = keyOf(g, "MultiLineString");
  if (mlsKey) {
    const ml = g[mlsKey];
    const memberK = keyOf(ml, "lineStringMember");
    const members = Array.isArray(ml[memberK])
      ? ml[memberK]
      : ml[memberK]
        ? [ml[memberK]]
        : [];
    return {
      type: "MultiLineString",
      coordinates: members
        .map(
          (m) =>
            gmlGeomToGeoJSON({
              [keyOf(m, "LineString")]: m[keyOf(m, "LineString")],
            })?.coordinates
        )
        .filter(Boolean),
    };
  }

  const mpolyKey = keyOf(g, "MultiPolygon");
  const msurfKey = keyOf(g, "MultiSurface");
  if (mpolyKey || msurfKey) {
    const cont = g[mpolyKey || msurfKey];
    const memberK = keyOf(cont, mpolyKey ? "polygonMember" : "surfaceMember");
    const members = Array.isArray(cont[memberK])
      ? cont[memberK]
      : cont[memberK]
        ? [cont[memberK]]
        : [];
    return {
      type: "MultiPolygon",
      coordinates: members
        .map((m) => {
          const poly = keyOf(m, "Polygon");
          return gmlGeomToGeoJSON({ [poly]: m[poly] })?.coordinates;
        })
        .filter(Boolean),
    };
  }

  return null;
}

function findGeometryEntry(featureObj) {
  for (const [k, v] of Object.entries(featureObj)) {
    if (!isObj(v)) continue;
    if (
      [
        "Point",
        "LineString",
        "Polygon",
        "MultiPoint",
        "MultiLineString",
        "MultiPolygon",
        "MultiSurface",
      ].some((n) => hasGeomLocal(v, n))
    )
      return [k, v];
    if (
      Object.values(v).some(
        (x) =>
          isObj(x) &&
          ["Point", "LineString", "Polygon"].some((n) => hasGeomLocal(x, n))
      )
    )
      return [k, v];
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
  return { type: "FeatureCollection", features };
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

  // JSON-try
  let res = await fetchWithTimeout(urlJson, {
    headers: { Accept: "application/json" },
  });
  let ctype = res.headers.get("content-type") || "";
  let text = await res.text();

  if (!res.ok) {
    log.warn(
      `Upstream error from ${layer.url}: ${res.status} - ${text.substring(0, 200)}`
    );
  }
  if (
    res.ok &&
    (ctype.includes("application/json") || text.trim().startsWith("{"))
  ) {
    try {
      return JSON.parse(text);
    } catch {
      /* fall back to GML */
    }
  }

  // GML3 fallback
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

  // GML2 fallback
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

import SettingsService from "./settings.service.js";
import { XMLParser } from "fast-xml-parser";

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
async function getWFSTStore() {
  const store = await SettingsService.readFileAsJson("layers.json");
  return store?.wfstlayers || [];
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
}) {
  const params = {
    SERVICE: "WFS",
    REQUEST: "GetFeature",
    VERSION: version || "1.1.0",
    TYPENAME: typeName, // WFS 1.1.0
    SRSNAME: srsName,
    OUTPUTFORMAT: outputFormat || "application/json",
  };
  if (bbox) params.BBOX = bbox.includes(",EPSG") ? bbox : `${bbox},${srsName}`;
  if (limit) params.MAXFEATURES = String(limit);
  if (offset) params.STARTINDEX = String(offset);
  if (filter) params.FILTER = filter;

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

function gmlGeomToGeoJSON(g) {
  if (!g || !isObj(g)) return null;
  if (g["gml:Point"]) {
    const p = g["gml:Point"];
    const coord = p["gml:pos"]
      ? posToCoord(asText(p["gml:pos"]))
      : coordsElToCoords(asText(p["gml:coordinates"]))[0];
    return { type: "Point", coordinates: coord };
  }
  if (g["gml:LineString"]) {
    const ls = g["gml:LineString"];
    const coordinates = ls["gml:posList"]
      ? posListToCoords(asText(ls["gml:posList"]))
      : coordsElToCoords(asText(ls["gml:coordinates"]));
    return { type: "LineString", coordinates };
  }
  if (g["gml:Polygon"]) {
    const poly = g["gml:Polygon"];
    const exterior = parseRing(poly["gml:exterior"]?.["gml:LinearRing"]);
    const iraw = poly["gml:interior"];
    const interiors = Array.isArray(iraw) ? iraw : iraw ? [iraw] : [];
    const holes = interiors.map((i) => parseRing(i["gml:LinearRing"]));
    return { type: "Polygon", coordinates: [exterior, ...holes] };
  }
  if (g["gml:MultiPoint"]) {
    const mp = g["gml:MultiPoint"];
    const memb = Array.isArray(mp["gml:pointMember"])
      ? mp["gml:pointMember"]
      : mp["gml:pointMember"]
        ? [mp["gml:pointMember"]]
        : [];
    return {
      type: "MultiPoint",
      coordinates: memb
        .map(
          (m) => gmlGeomToGeoJSON({ "gml:Point": m["gml:Point"] })?.coordinates
        )
        .filter(Boolean),
    };
  }
  if (g["gml:MultiLineString"]) {
    const ml = g["gml:MultiLineString"];
    const memb = Array.isArray(ml["gml:lineStringMember"])
      ? ml["gml:lineStringMember"]
      : ml["gml:lineStringMember"]
        ? [ml["gml:lineStringMember"]]
        : [];
    return {
      type: "MultiLineString",
      coordinates: memb
        .map(
          (m) =>
            gmlGeomToGeoJSON({ "gml:LineString": m["gml:LineString"] })
              ?.coordinates
        )
        .filter(Boolean),
    };
  }
  if (g["gml:MultiPolygon"]) {
    const mp = g["gml:MultiPolygon"];
    const memb = Array.isArray(mp["gml:polygonMember"])
      ? mp["gml:polygonMember"]
      : mp["gml:polygonMember"]
        ? [mp["gml:polygonMember"]]
        : [];
    return {
      type: "MultiPolygon",
      coordinates: memb
        .map(
          (m) =>
            gmlGeomToGeoJSON({ "gml:Polygon": m["gml:Polygon"] })?.coordinates
        )
        .filter(Boolean),
    };
  }
  if (g["gml:MultiSurface"]) {
    const ms = g["gml:MultiSurface"];
    const memb = Array.isArray(ms["gml:surfaceMember"])
      ? ms["gml:surfaceMember"]
      : ms["gml:surfaceMember"]
        ? [ms["gml:surfaceMember"]]
        : [];
    return {
      type: "MultiPolygon",
      coordinates: memb
        .map(
          (m) =>
            gmlGeomToGeoJSON({ "gml:Polygon": m["gml:Polygon"] })?.coordinates
        )
        .filter(Boolean),
    };
  }
  return null;
}

function findGeometryEntry(featureObj) {
  for (const [k, v] of Object.entries(featureObj)) {
    if (!isObj(v)) continue;
    if (
      v["gml:Point"] ||
      v["gml:LineString"] ||
      v["gml:Polygon"] ||
      v["gml:MultiPoint"] ||
      v["gml:MultiLineString"] ||
      v["gml:MultiPolygon"] ||
      v["gml:MultiSurface"]
    )
      return [k, v];
    if (
      Object.values(v).some(
        (x) =>
          isObj(x) &&
          (x["gml:Point"] || x["gml:LineString"] || x["gml:Polygon"])
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
export async function listWFSTLayers({ fields } = {}) {
  const layers = await getWFSTStore();
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
}) {
  const layers = await getWFSTStore();
  const layer = layers.find((l) => String(l.id) === String(id));
  if (!layer) throw new NotFoundError("WFST-layer not found");

  const tn =
    typeName || (Array.isArray(layer.layers) ? layer.layers[0] : layer.layers);
  if (!tn) throw new UpstreamError("Missing typeName for layer", 400);

  const crs = srsName || layer.projection || "EPSG:4326";

  // 1) Try GeoJSON
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
  });
  let res = await fetch(urlJson, { headers: { Accept: "application/json" } });
  let ctype = res.headers.get("content-type") || "";
  let text = await res.text();

  if (
    res.ok &&
    (ctype.includes("application/json") || text.trim().startsWith("{"))
  ) {
    try {
      return JSON.parse(text);
    } catch {
      /* fallthrough to GML */
    }
  }

  // 2) Fallback: GML3 -> GeoJSON
  const urlGml3 = rewriteOutputFormat(
    urlJson,
    "application/gml+xml; version=3.2"
  );
  res = await fetch(urlGml3, {
    headers: { Accept: "application/xml,text/xml,application/gml+xml" },
  });
  text = await res.text();
  if (res.ok && text.trim().startsWith("<"))
    return gmlToFeatureCollection(text);

  // 3) Fallback: GML2 -> GeoJSON
  const urlGml2 = rewriteOutputFormat(urlJson, "GML2");
  res = await fetch(urlGml2, {
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

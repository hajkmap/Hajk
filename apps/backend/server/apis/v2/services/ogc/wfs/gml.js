import { XMLParser } from "fast-xml-parser";
import { CONSTANTS } from "../constants.js";
import { UpstreamError } from "../errors.js";
import { logger } from "../logger.js";

/** ================= XML Parser ================= */
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

/** ================= Helpers ================= */
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const notNs = (k) => !k.startsWith("gml:") && !k.startsWith("wfs:");
const asText = (v) => (isObj(v) ? (v["#text"] ?? "") : (v ?? ""));

function maybeSwapXY(coord, srsName) {
  if (!Array.isArray(coord) || coord.length < 2) return coord;
  const srs = (srsName || "").toUpperCase();
  // rule for EPSG:4326 in GML3: (lat, lon) should become (lon, lat)
  if (srs.includes("EPSG:4326")) return [coord[1], coord[0], ...coord.slice(2)];
  return coord;
}

// --- Get srsName near geometry ---
function extractSrsNameNear(node) {
  if (!isObj(node)) return undefined;
  for (const attr of ["@_srsName", "@_srsname", "@_srs"]) {
    if (node[attr]) return node[attr];
  }
  const geomKey =
    keyOf(node, "Point") ||
    keyOf(node, "LineString") ||
    keyOf(node, "Polygon") ||
    keyOf(node, "MultiPoint") ||
    keyOf(node, "MultiLineString") ||
    keyOf(node, "MultiPolygon") ||
    keyOf(node, "MultiSurface") ||
    keyOf(node, "MultiGeometry") ||
    keyOf(node, "GeometryCollection");
  const geom = geomKey && isObj(node[geomKey]) ? node[geomKey] : null;
  if (geom) {
    for (const attr of ["@_srsName", "@_srsname", "@_srs"]) {
      if (geom[attr]) return geom[attr];
    }
  }
  return undefined;
}

const nums = (s) =>
  String(s)
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
  String(s)
    .trim()
    .split(/\s+/)
    .map((p) => p.split(",").map(Number));

// Return only the key that actually exists in the object (namespace-agnostisk)
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

function removeNamespacePrefix(key) {
  const parts = key.split(":");
  return parts.length > 1 ? parts[parts.length - 1] : key;
}

/** ================= Geometry search ================= */
export function findAllGeometryEntries(featureObj) {
  const hits = [];

  const hasGeom = (o) =>
    CONSTANTS.GEOMETRY_TYPES.some((n) => {
      const k = keyOf(o, n);
      return k && o[k] !== undefined;
    });

  function dfs(obj, depth = 0) {
    if (!isObj(obj) || depth > 10) return;
    for (const [k, v] of Object.entries(obj)) {
      if (!isObj(v)) continue;

      // hit: v contains a GML geometry type (Point/Polygon/…)
      if (hasGeom(v)) hits.push([k, v]);

      // continue search
      dfs(v, depth + 1);
    }
  }

  dfs(featureObj, 0);
  return hits; // array of [field name, object containing GML geometry]
}

/** ================= GML -> GeoJSON ================= */
export function gmlGeomToGeoJSON(g) {
  if (!g || !isObj(g)) return null;

  // Find srsName near the geometry
  const srs = extractSrsNameNear(g);

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
    return coord
      ? { type: "Point", coordinates: maybeSwapXY(coord, srs) }
      : null;
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
    // Swap coordinates per point (lon,lat -> lat,lon)
    return {
      type: "LineString",
      coordinates: coordinates.map((c) => maybeSwapXY(c, srs)),
    };
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
    // Swap the coordinates in the rings
    const exterior = ensureClosed(exteriorRing).map((c) => maybeSwapXY(c, srs));

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
        return ensureClosed(ring).map((c) => maybeSwapXY(c, srs));
      })
      .filter((r) => r.length);

    return { type: "Polygon", coordinates: [exterior, ...holes] };
  }

  // MultiPoint
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
      .filter(Boolean)
      .map((c) => maybeSwapXY(c, srs));
    return { type: "MultiPoint", coordinates: coords };
  }

  // MultiLineString
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
      .filter(Boolean)
      .map((line) => line.map((c) => maybeSwapXY(c, srs)));
    return { type: "MultiLineString", coordinates: coords };
  }

  // MultiPolygon & MultiSurface
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
        return polyGeom
          ? polyGeom.coordinates.map((ring) =>
              ring.map((c) => maybeSwapXY(c, srs))
            )
          : null;
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
    const geometries = members.map((m) => gmlGeomToGeoJSON(m)).filter(Boolean); // filter out null geometries
    return { type: "GeometryCollection", geometries };
  }

  return null;
}

/** ================= Member -> Feature ================= */
export function memberToFeature(member) {
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

  // Collect all geometry nodes
  const geomEntries = findAllGeometryEntries(featureNode);

  // Build GeoJSON geometry (one or multiple)
  let geometry = null;
  if (geomEntries.length === 1) {
    const [, geomVal] = geomEntries[0];
    geometry = gmlGeomToGeoJSON(geomVal);
  } else if (geomEntries.length > 1) {
    const geoms = geomEntries
      .map(([, v]) => gmlGeomToGeoJSON(v))
      .filter(Boolean);
    if (geoms.length === 1) {
      geometry = geoms[0];
    } else if (geoms.length > 1) {
      geometry = { type: "GeometryCollection", geometries: geoms };
      logger.trace("Multiple geometries found; returning GeometryCollection", {
        count: geoms.length,
      });
    }
  }

  // Identify geometry-containing properties at top level in featureNode
  const geomTopLevelKeys = new Set(
    Object.keys(featureNode).filter((topK) =>
      geomEntries.some(([hitK]) => hitK === topK)
    )
  );

  const properties = {};
  for (const [k, v] of Object.entries(featureNode)) {
    // Skip geometry properties on top level
    if (geomTopLevelKeys.has(k)) continue;
    // Skip pure gml: namespace properties
    if (k.startsWith("gml:")) continue;
    // If the value contains gml: elements, skip (avoid dumping entire GML)
    if (isObj(v) && Object.keys(v).some((kk) => kk.startsWith("gml:")))
      continue;

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

/** ================= XML -> FeatureCollection ================= */
export function gmlToFeatureCollection(xmlText) {
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
    logger.error("Failed to parse GML", error);
    throw new UpstreamError("Failed to parse GML response", 502);
  }
}

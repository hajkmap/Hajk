import GeoJSON from "ol/format/GeoJSON";
import { hfetch } from "./FetchWrapper";

// The click waits for WFS before drawing, so a hanging server must not block it.
const WFS_TIMEOUT_MS = 10000;

/**
 * Replaces zoom-dependent GetFeatureInfo geometries with the full geometry
 * from GeoServer WFS. Other features are left unchanged. A failed lookup
 * never throws: the GetFeatureInfo geometry is kept and the failure is logged.
 *
 * @param {import("ol/Feature").default[]} features
 * @param {import("ol/Map").default} map
 */
export async function fetchFullFeatureGeometries(features, map) {
  if (!Array.isArray(features) || features.length === 0) {
    return;
  }

  try {
    const groups = groupByWfsUrl(features, map);
    const viewProjection = map?.getView?.()?.getProjection?.();
    await Promise.allSettled(
      [...groups.entries()].map(([url, group]) =>
        replaceGroupGeometries(url, group, viewProjection)
      )
    );
  } catch (error) {
    console.info(
      "fetchFullFeatureGeometries: WFS lookup failed, using GetFeatureInfo geometry instead.",
      error
    );
  }
}

/**
 * GeoServer feature ids look like `typeName.fid`. The type name is everything
 * before the last dot. Ids we generated ourselves, and ids from other servers,
 * do not take this path.
 */
function getTypeName(feature) {
  const id = feature?.getId?.();
  if (typeof id !== "string") {
    return null;
  }
  const dot = id.lastIndexOf(".");
  if (dot <= 0 || dot === id.length - 1) {
    return null;
  }
  return id.slice(0, dot);
}

function isGeoServerFeature(feature) {
  return (
    feature?.layer?.getSource?.()?.serverType_ === "geoserver" &&
    getTypeName(feature) !== null
  );
}

function findSublayer(layer, typeName) {
  const layersInfo = layer?.layersInfo;
  if (!layersInfo || typeof layersInfo !== "object") {
    return undefined;
  }
  return Object.values(layersInfo).find((info) => {
    const id = info?.id;
    return (
      id === typeName || (typeof id === "string" && id.endsWith(`:${typeName}`))
    );
  });
}

function getWmsUrl(layer) {
  try {
    const source = layer?.getSource?.();
    if (!source) {
      return "";
    }
    const urls = source.getUrls?.();
    if (Array.isArray(urls) && urls[0]) {
      return urls[0];
    }
    const url = source.getUrl?.();
    return typeof url === "string" ? url : "";
  } catch {
    return "";
  }
}

/**
 * Replaces a trailing `/wms` (before a query or hash) with `/wfs`.
 * Returns null when the WMS URL does not end that way.
 */
function deriveWfsUrl(wmsUrl) {
  if (typeof wmsUrl !== "string") {
    return null;
  }
  const trimmed = wmsUrl.trim();
  if (!trimmed) {
    return null;
  }
  const derived = trimmed.replace(/\/wms\/?(?=$|[?#])/i, "/wfs");
  return derived === trimmed ? null : derived;
}

function resolveWfsUrl(feature, map) {
  if (!isGeoServerFeature(feature)) {
    return null;
  }
  // Experimental: may change or be removed without notice.
  if (map?.measurementWfs !== true) {
    return null;
  }
  const typeName = getTypeName(feature);
  const sublayer = findSublayer(feature.layer, typeName);
  const searchUrl =
    typeof sublayer?.searchUrl === "string" ? sublayer.searchUrl.trim() : "";
  if (searchUrl) {
    return searchUrl;
  }
  // Experimental: deriving the WFS URL from the WMS URL is a guess.
  if (map?.measurementWfsDeriveUrl === true) {
    return deriveWfsUrl(getWmsUrl(feature.layer));
  }
  return null;
}

function groupByWfsUrl(features, map) {
  const groups = new Map();
  for (const feature of features) {
    let url = null;
    try {
      url = resolveWfsUrl(feature, map);
    } catch {
      url = null;
    }
    if (!url) {
      continue;
    }
    const group = groups.get(url);
    if (group) {
      group.push(feature);
    } else {
      groups.set(url, [feature]);
    }
  }
  return groups;
}

function buildGetFeatureUrl(baseUrl, featureIds, srsName) {
  const base =
    typeof window !== "undefined" && window.location?.href
      ? window.location.href
      : "http://localhost/";
  const url = new URL(baseUrl, base);
  url.searchParams.set("SERVICE", "WFS");
  // Hardcoded 1.1.0, like the other WFS clients (Edit, Collector, GeosuiteExport,
  // AttributeEditor, CQLFilter). With a short "EPSG:xxxx" SRSNAME, GeoServer then
  // returns x/y order, which OpenLayers expects; 2.0.0 may swap axes.
  url.searchParams.set("VERSION", "1.1.0");
  url.searchParams.set("REQUEST", "GetFeature");
  url.searchParams.set("FEATUREID", featureIds.join(","));
  url.searchParams.set("OUTPUTFORMAT", "application/json");
  url.searchParams.set("SRSNAME", srsName);
  return url.toString();
}

/**
 * Reads a WFS FeatureCollection the same way Click.readJsonFeatures does:
 * GeoServer puts the CRS on the collection, so it is applied to every feature.
 * When the response has no CRS, the view projection is used.
 */
function readWfsFeatures(jsonData, viewProjection) {
  if (!jsonData || !Array.isArray(jsonData.features)) {
    throw new Error("Response is not a FeatureCollection");
  }
  const parser = new GeoJSON();
  const parserOptions = {
    dataProjection: jsonData.crs
      ? parser.readProjection(jsonData)
      : viewProjection,
    featureProjection: viewProjection,
  };
  return jsonData.features.map((jsonFeature) =>
    parser.readFeature(jsonFeature, parserOptions)
  );
}

function logFallback(url, ids, error) {
  console.info(
    `fetchFullFeatureGeometries: WFS lookup failed for ${url} (${ids}), using GetFeatureInfo geometry instead.`,
    error
  );
}

async function replaceGroupGeometries(url, features, viewProjection) {
  const ids = features.map((feature) => feature.getId()).join(", ");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WFS_TIMEOUT_MS);
  try {
    const srsName = viewProjection?.getCode?.() || "EPSG:4326";
    const requestUrl = buildGetFeatureUrl(
      url,
      features.map((feature) => String(feature.getId())),
      srsName
    );
    const response = await hfetch(requestUrl, { signal: controller.signal });
    if (!response?.ok) {
      throw new Error(`HTTP ${response?.status ?? "unknown"}`);
    }
    const jsonData = await response.json();
    const wfsFeatures = readWfsFeatures(jsonData, viewProjection);
    const byId = new Map();
    for (const wfsFeature of wfsFeatures) {
      const id = wfsFeature.getId();
      if (id != null && wfsFeature.getGeometry()) {
        byId.set(String(id), wfsFeature.getGeometry());
      }
    }

    const missing = [];
    for (const feature of features) {
      const geometry = byId.get(String(feature.getId()));
      if (!geometry) {
        missing.push(feature.getId());
        continue;
      }
      feature.setGeometry(geometry.clone());
    }
    if (missing.length > 0) {
      logFallback(
        url,
        missing.join(", "),
        new Error("Feature id missing from WFS response")
      );
    }
  } catch (error) {
    logFallback(url, ids, error);
  } finally {
    clearTimeout(timeoutId);
  }
}

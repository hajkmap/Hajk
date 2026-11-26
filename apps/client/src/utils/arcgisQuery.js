import { getPointResolution } from "ol/proj";

import { hfetch } from "./FetchWrapper";
import { fetchServiceLayers } from "./arcgisServiceInfo";
import { getWkid } from "./arcgisHelpers";

// Map click (infoclick) queries for ArcGIS REST layers (see ArcGISLayer).
// Used by both infoclick implementations: Click.js (legacy) and MapClickModel.

// Drop null/empty attributes so infobox <if Attribute> tags stay false.
function dropEmpty(props) {
  const out = {};
  Object.keys(props || {}).forEach((k) => {
    if (props[k] !== null && props[k] !== undefined && props[k] !== "") {
      out[k] = props[k];
    }
  });
  return out;
}

// Click tolerance (in screen pixels) when querying ArcGIS sublayers
const CLICK_TOLERANCE_PX = 12;

// ArcGIS REST: query each visible, queryable sublayer with /query?f=geojson
// and return a Response-like JSON payload that the rest of the click chain
// can parse.
export function queryArcGIS(map, layer, evt) {
  const view = map.getView();
  const resolution = view.getResolution();
  const currentZoom = view.getZoom();
  const code = view.getProjection().getCode();
  const wkid = getWkid(code);
  const url = (layer.get("url") || "").replace(/\/$/, "");
  const proxyUrl = layer.get("proxyUrl") || "";
  // Only query sublayers that are drawn and that the admin marked as queryable
  const candidates = (layer.getSource().getParams()["LAYERS"] || "")
    .split(",")
    .filter(Boolean)
    .filter((id) => layer.layersInfo?.[id]?.queryable === true);
  // Respect min/max zoom, just like the WMS branch in query() (#836)
  if (
    !wkid ||
    !layer.layersInfo ||
    candidates.length === 0 ||
    currentZoom <= layer.getMinZoom() ||
    currentZoom > layer.getMaxZoom()
  ) {
    return false;
  }
  // The query distance is given in meters, while the resolution is in map
  // units (degrees in e.g. EPSG:4326), so convert it.
  const metersPerPixel = getPointResolution(
    view.getProjection(),
    resolution,
    evt.coordinate,
    "m"
  );
  const [x, y] = evt.coordinate;
  // Group layers have no features of their own (their children are queried
  // instead). The service info is cached, so this normally doesn't make a
  // request. If it can't be read, every sublayer is queried: a group layer
  // then answers with an error, which is logged and skipped below.
  return fetchServiceLayers(url, proxyUrl).then((serviceLayers) =>
    queryArcGISSubLayers({
      layerIds: candidates.filter(
        (id) => serviceLayers?.get(id)?.isGroup !== true
      ),
      url,
      proxyUrl,
      wkid,
      code,
      x,
      y,
      distance: metersPerPixel * CLICK_TOLERANCE_PX,
    })
  );
}

// Queries the given sublayers and returns a Response with all features found
function queryArcGISSubLayers({
  layerIds,
  url,
  proxyUrl,
  wkid,
  code,
  x,
  y,
  distance,
}) {
  const requests = layerIds.map((id) => {
    const params = new URLSearchParams({
      f: "geojson",
      geometry: x + "," + y,
      geometryType: "esriGeometryPoint",
      inSR: wkid,
      outSR: wkid,
      spatialRel: "esriSpatialRelIntersects",
      distance: String(distance),
      units: "esriSRUnit_Meter",
      outFields: "*",
      returnGeometry: "true",
    });
    const queryUrl = url + "/" + id + "/query?" + params.toString();
    // Requests go through the Hajk proxy if one is configured. Like everywhere
    // else in the client (WMS, WFS, legends), the proxy is a plain prefix.
    return hfetch(proxyUrl + queryUrl)
      .then((r) => r.json())
      .then((json) => {
        // ArcGIS often answers HTTP 200 with an "error" object
        if (json.error) {
          throw new Error(json.error.message || "ArcGIS query failed");
        }
        return (json.features || []).map((f, i) => ({
          ...f,
          id: id + "." + (f.id ?? f.properties?.OBJECTID ?? i),
          properties: dropEmpty(f.properties),
        }));
      })
      .catch((err) => {
        console.warn(`ArcGIS query failed for sublayer ${id}:`, err);
        return [];
      });
  });
  return Promise.all(requests).then(
    (arrays) =>
      new Response(
        JSON.stringify({
          type: "FeatureCollection",
          crs: { type: "name", properties: { name: code } },
          features: arrays.flat(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
  );
}

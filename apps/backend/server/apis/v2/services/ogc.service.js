import ConfigService from "./config.service.js";
import { logger } from "./ogc/logger.js";
import { Validator } from "./ogc/validator.js";
import { pick } from "./ogc/utils/object.js";
import { fetchWithRetry, ensureNotTooLarge } from "./ogc/utils/http.js";
import {
  buildWfsGetFeatureUrl,
  rewriteOutputFormat,
} from "./ogc/wfs/url-builder.js";
import { gmlToFeatureCollection } from "./ogc/wfs/gml.js";
import {
  ServiceError,
  NotFoundError,
  UpstreamError,
  ValidationError,
} from "./ogc/errors.js";

/** ===== Internal function: get WFST layer from config ===== */
async function getWFSTStore({ user = null, washContent = true } = {}) {
  const store = await ConfigService.getLayersStore(user, washContent);
  if (store?.error) {
    throw new ServiceError("Failed to read layers store", 500, {
      originalError: store.error?.message || String(store.error),
    });
  }
  return store?.wfstlayers || [];
}

/** ===== Public API: listWFSTLayers ===== */
export async function listWFSTLayers({ fields, user, washContent } = {}) {
  try {
    const layers = await getWFSTStore({ user, washContent });
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

/** ===== Public API: getWFSTLayer ===== */
export async function getWFSTLayer({ id, fields, user, washContent } = {}) {
  if (!Validator.isValidId(id)) {
    throw new ValidationError("Invalid layer ID format", { id });
  }

  const layers = await getWFSTStore({ user, washContent });
  const layer = layers.find((l) => String(l.id) === String(id));
  if (!layer) {
    throw new NotFoundError("WFST layer not found", { layerId: id });
  }

  if (!fields) return layer;

  const pickFields = fields
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return pickFields.length ? pick(layer, pickFields) : layer;
}

/** ===== Public API: getWFSTFeatures ===== */
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
    const layers = await getWFSTStore({ user, washContent });
    const layer = layers.find((l) => String(l.id) === String(id));
    if (!layer)
      throw new NotFoundError("WFST layer not found", { layerId: id });

    if (!Validator.isValidUrl(layer.url)) {
      throw new UpstreamError("Invalid layer URL configuration", 500);
    }

    const tn =
      typeName ||
      (Array.isArray(layer.layers) ? layer.layers[0] : layer.layers);
    if (!tn) throw new ValidationError("Missing typeName for layer");

    const crs = srsName || layer.projection || "EPSG:4326";

    // 1) Try GeoJSON
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

    // 4xx: abort directly if the response does not look like a valid format
    if (!res.ok && res.status >= 400 && res.status < 500) {
      const snippet = text.substring(0, 500);
      const maybeFormatIssue =
        res.status === 406 ||
        res.status === 415 ||
        /output|format|json|geo\s*\+?\s*json/i.test(snippet);

      if (!maybeFormatIssue) {
        logger.warn("Client error from WFS server (no fallback)", {
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
        if (typeof fc.totalFeatures === "number") {
          fc.numberMatched = fc.totalFeatures;
        }
        if (
          Array.isArray(fc.features) &&
          typeof fc.numberReturned !== "number"
        ) {
          fc.numberReturned = fc.features.length;
        }

        // --- FORWARDING: CRS determination ---
        const normalizeEpsg = (name) => {
          if (!name) return undefined;
          const m = String(name).match(/EPSG[:/]*[:]*([0-9]+)/i);
          return m ? `EPSG:${m[1]}` : undefined;
        };

        // Retrieve CRS from various sources (priority ordering)
        let finalCrs = null;

        const crsFromGeojson = normalizeEpsg(
          fc?.crs?.properties?.name || fc?.crs?.name
        );
        if (crsFromGeojson) {
          finalCrs = crsFromGeojson;
        }

        if (!finalCrs) {
          finalCrs = normalizeEpsg(crs);
        }

        if (!finalCrs && fc.crsName) {
          finalCrs = normalizeEpsg(fc.crsName);
        }

        if (finalCrs) {
          fc.crsName = finalCrs;

          // Legacy CRS object for QGIS 3.40+ compatibility
          // (even though it technically breaks RFC 7946, it is required for QGIS)
          if (!fc.crs) {
            const epsgCode = finalCrs.match(/EPSG:(\d+)/)?.[1];
            if (epsgCode) {
              fc.crs = {
                type: "name",
                properties: {
                  name: `urn:ogc:def:crs:EPSG::${epsgCode}`,
                },
              };
            }
          }
        }

        const looksLonLatBbox = (bbox) => {
          if (!Array.isArray(bbox) || bbox.length < 4) return false;
          const [xmin, ymin, xmax, ymax] = bbox.map(Number);
          const inLon = Math.abs(xmin) <= 180 && Math.abs(xmax) <= 180;
          const inLat = Math.abs(ymin) <= 90 && Math.abs(ymax) <= 90;
          return inLon && inLat;
        };

        const coordsLookProjected = (featureCollection) => {
          const check = (xy) =>
            Array.isArray(xy) && xy.length >= 2 && xy[0] > 1e5 && xy[1] > 1e6;

          const scanGeom = (g) => {
            if (!g) return false;
            switch (g.type) {
              case "Point":
                return check(g.coordinates);
              case "MultiPoint":
                return (g.coordinates || []).some(check);
              case "LineString":
                return (g.coordinates || []).some(check);
              case "MultiLineString":
                return (g.coordinates || []).flat(1).some(check);
              case "Polygon":
                return (g.coordinates || []).flat(1).some(check);
              case "MultiPolygon":
                return (g.coordinates || []).flat(2).some(check);
              case "GeometryCollection":
                return (g.geometries || []).some(scanGeom);
              default:
                return false;
            }
          };

          for (const f of featureCollection.features || []) {
            if (scanGeom(f.geometry)) return true;
          }
          return false;
        };

        if (fc.bbox && looksLonLatBbox(fc.bbox) && coordsLookProjected(fc)) {
          logger.debug(
            "Removing inconsistent bbox (lon/lat bbox with projected coords)"
          );
          delete fc.bbox;
        }

        return fc;
      } catch (parseError) {
        logger.warn("Failed to parse JSON response, trying GML", {
          error: parseError.message,
        });
        // Fallback to GML
      }
    }

    // 2) GML3
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

    // 3) GML2
    const urlGml2 = rewriteOutputFormat(urlJson, "GML2");
    res = await fetchWithRetry(urlGml2, {
      headers: { Accept: "application/xml, text/xml" },
    });
    ensureNotTooLarge(res);
    text = await res.text();
    if (res.ok && text.trim().startsWith("<")) {
      return gmlToFeatureCollection(text);
    }

    throw new UpstreamError(
      "Upstream server did not return valid GeoJSON or GML",
      res.status || 502
    );
  } catch (error) {
    if (error instanceof ServiceError) throw error;

    logger.error("Unexpected error in getWFSTFeatures", error);
    throw new ServiceError("Internal server error", 500, {
      originalError: error.message,
    });
  }
}

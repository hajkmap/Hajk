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
import { buildWfsTransactionXml } from "./ogc/wfs/transaction-builder.js";
import { parseTransactionResponse } from "./ogc/wfs/transaction-response.js";

// Helper function to strip milliseconds from ISO date strings
const stripMilliseconds = (value) => {
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+/.test(value)
  ) {
    // Remove the .xxx part (milliseconds), keep the rest
    return value.replace(/\.\d+/, "");
  }
  return value;
};

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
      (Array.isArray(layer.layers) && layer.layers.length > 0
        ? layer.layers[0]
        : layer.layers);
    if (!tn) {
      throw new ValidationError("Missing typeName for layer", {
        layerId: id,
        availableLayers: layer.layers,
      });
    }

    // Determine CRS: use request param, layer config, or default to EPSG:3006
    const crs = srsName || layer.projection || "EPSG:3006";

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

    // Handle 4xx errors - abort if not a format issue
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

        // Add basic metadata
        if (typeof fc.totalFeatures === "number") {
          fc.numberMatched = fc.totalFeatures;
        }
        if (
          Array.isArray(fc.features) &&
          typeof fc.numberReturned !== "number"
        ) {
          fc.numberReturned = fc.features.length;
        }

        // Normalize EPSG code format
        const normalizeEpsg = (name) => {
          if (!name) return undefined;
          const m = String(name).match(/EPSG[:/]*[:]*([0-9]+)/i);
          return m ? `EPSG:${m[1]}` : undefined;
        };

        // Set crsName to requested CRS (normalized)
        const finalCrs = normalizeEpsg(crs) || "EPSG:3006";
        fc.crsName = finalCrs;

        // Set crs object for OpenLayers compatibility
        const epsgCode = finalCrs.match(/EPSG:(\d+)/)?.[1];
        if (epsgCode) {
          fc.crs = {
            type: "name",
            properties: {
              name: `urn:ogc:def:crs:EPSG::${epsgCode}`,
            },
          };
        }

        // Store layer's native projection for coordinate transformation
        fc.layerProjection = layer.projection || "EPSG:3006";

        // Clean up inconsistent bbox (lon/lat bbox with projected coords)
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

    // 2) Try GML3
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
      const fc = gmlToFeatureCollection(text);

      // Add CRS metadata for GML response
      fc.crsName = crs;
      fc.layerProjection = layer.projection || "EPSG:3006";

      const epsgCode = crs.match(/EPSG:(\d+)/)?.[1];
      if (epsgCode) {
        fc.crs = {
          type: "name",
          properties: { name: `urn:ogc:def:crs:EPSG::${epsgCode}` },
        };
      }

      return fc;
    }

    // 3) Try GML2
    const urlGml2 = rewriteOutputFormat(urlJson, "GML2");
    res = await fetchWithRetry(urlGml2, {
      headers: { Accept: "application/xml, text/xml" },
    });
    ensureNotTooLarge(res);
    text = await res.text();
    if (res.ok && text.trim().startsWith("<")) {
      const fc = gmlToFeatureCollection(text);

      // Add CRS metadata for GML2 response
      fc.crsName = crs;
      fc.layerProjection = layer.projection || "EPSG:3006";

      const epsgCode = crs.match(/EPSG:(\d+)/)?.[1];
      if (epsgCode) {
        fc.crs = {
          type: "name",
          properties: { name: `urn:ogc:def:crs:EPSG::${epsgCode}` },
        };
      }

      return fc;
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

export async function commitWFSTTransaction(params) {
  const { id, user, washContent, inserts, updates, deletes, srsName } = params;

  if (!Validator.isValidId(id)) {
    throw new ValidationError("Invalid layer ID format", { id });
  }

  // Fetch layer configuration
  const layers = await getWFSTStore({ user, washContent });
  const layer = layers.find((l) => String(l.id) === String(id));

  if (!layer) {
    throw new NotFoundError("WFST layer not found", { layerId: id });
  }

  if (!Validator.isValidUrl(layer.url)) {
    throw new UpstreamError("Invalid layer URL configuration", 500);
  }

  const typeName =
    Array.isArray(layer.layers) && layer.layers.length > 0
      ? layer.layers[0]
      : layer.layers;
  if (!typeName) {
    throw new ValidationError("Missing typeName for layer", {
      layerId: id,
      availableLayers: layer.layers,
    });
  }

  // Validate geometries
  for (const feature of [...inserts, ...updates]) {
    if (feature.geometry && !isValidGeoJSONGeometry(feature.geometry)) {
      throw new ValidationError("Invalid geometry", {
        featureId: feature.id,
      });
    }
  }

  // Determine effective CRS: prioritize frontend srsName, then layer config, then default
  const effectiveSrsName = srsName || layer.projection || "EPSG:3006";

  // Helper to format feature IDs for WFS-T
  const formatFeatureId = (featureId) => {
    if (featureId == null) return featureId;

    const idStr = String(featureId);

    // If already in native format (contains : or .), keep as-is
    // Examples: "workspace:layer.123", "layer.123", "namespace:feature.456"
    if (idStr.includes(":") || idStr.includes(".")) {
      return idStr;
    }

    // Detect server type from URL or explicit flag
    const isGeoServer =
      layer.serverType === "geoserver" ||
      layer.url?.toLowerCase().includes("geoserver");

    if (isGeoServer) {
      // GeoServer format: "typename.123" or keep workspace prefix if present
      // If typeName has workspace prefix (e.g. "goteborg:buildings"), use full prefix
      return `${typeName}.${featureId}`;
    }

    // QGIS Server or unknown - return canonical ID as-is
    return featureId;
  };

  // Format IDs for updates and deletes
  const formattedUpdates = updates.map((feature) => ({
    ...feature,
    id: formatFeatureId(feature.id),
  }));

  const formattedDeletes = deletes.map(formatFeatureId);

  // Clean milliseconds from date fields for Oracle compatibility
  const cleanDateFields = (feature) => ({
    ...feature,
    properties: Object.fromEntries(
      Object.entries(feature.properties || {}).map(([key, value]) => [
        key,
        stripMilliseconds(value),
      ])
    ),
  });

  const cleanedInserts = inserts.map(cleanDateFields);
  const cleanedUpdates = formattedUpdates.map(cleanDateFields);

  // Pass namespace and formatted IDs
  const transactionXml = buildWfsTransactionXml({
    version: layer.wfsVersion || "1.1.0",
    typeName,
    srsName: effectiveSrsName,
    geometryName: layer.geometryField || "geometry",
    namespace: layer.namespace, // Pass namespace for GeoServer
    inserts: cleanedInserts,
    updates: cleanedUpdates,
    deletes: formattedDeletes,
  });

  logger.debug("Sending WFS-T transaction", {
    url: layer.url,
    inserts: inserts.length,
    updates: updates.length,
    deletes: deletes.length,
  });

  // Send transaction to WFS server
  const response = await fetchWithRetry(layer.url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml",
      Accept: "application/xml, text/xml",
    },
    body: transactionXml,
  });

  ensureNotTooLarge(response);
  const responseText = await response.text();

  if (!response.ok) {
    logger.error("WFS-T transaction failed", {
      status: response.status,
      response: responseText.substring(0, 500),
    });

    throw new UpstreamError(
      `WFS-T transaction failed: ${response.status}`,
      response.status
    );
  }

  // Parse and validate transaction response
  const result = parseTransactionResponse(responseText);

  if (result.success === false) {
    logger.error("WFS-T reported failure", result);
    throw new UpstreamError(result.message || "Transaction failed", 400);
  }

  // TOTAL FAILURES

  // Check if we expected inserts but got 0
  if (inserts.length > 0 && result.inserted === 0) {
    logger.error("WFS-T returned 0 inserts when we expected some", {
      layerId: id,
      typeName,
      expectedInserts: inserts.length,
      geometryTypes: inserts.map((f) => f.geometry?.type).filter(Boolean),
      serverWarning: result.warning,
    });

    // Detect geometry type from inserts
    const geomTypes = [
      ...new Set(inserts.map((f) => f.geometry?.type).filter(Boolean)),
    ];
    const geomTypeStr =
      geomTypes.length > 0 ? ` (försökte spara ${geomTypes.join(", ")})` : "";

    // Combine QGIS error with helpful explanation
    let errorMessage = `Servern sparade 0 av ${inserts.length} objekt${geomTypeStr}.`;

    if (result.warning) {
      errorMessage += `\n\nServermeddelande: ${result.warning}`;
    }

    errorMessage += `\n\nDetta beror ofta på fel geometrityp (t.ex. försöker spara polygon i ett punktlager) eller datafel.`;

    throw new UpstreamError(errorMessage, 400);
  }

  // Check if we expected updates but got 0 (could indicate ID mismatch)
  if (formattedUpdates.length > 0 && result.updated === 0) {
    logger.error("WFS-T returned 0 updates when we expected some", {
      layerId: id,
      typeName,
      expectedUpdates: formattedUpdates.length,
      updateIds: formattedUpdates.map((u) => u.id).slice(0, 5),
      serverWarning: result.warning,
    });

    // Combine QGIS error with helpful explanation
    let errorMessage = `Servern uppdaterade 0 av ${formattedUpdates.length} objekt.`;

    if (result.warning) {
      errorMessage += `\n\nServermeddelande: ${result.warning}`;
    }

    errorMessage += `\n\nDetta kan bero på fel feature-ID-format eller att objekten inte finns i lagret.`;

    throw new UpstreamError(errorMessage, 400);
  }

  // Check if we expected deletes but got 0
  if (formattedDeletes.length > 0 && result.deleted === 0) {
    logger.error("WFS-T returned 0 deletes when we expected some", {
      layerId: id,
      typeName,
      expectedDeletes: formattedDeletes.length,
      deleteIds: formattedDeletes.slice(0, 5),
      serverWarning: result.warning,
    });

    // Combine QGIS error with helpful explanation
    let errorMessage = `Servern raderade 0 av ${formattedDeletes.length} objekt.`;

    if (result.warning) {
      errorMessage += `\n\nServermeddelande: ${result.warning}`;
    }

    errorMessage += `\n\nDetta kan bero på fel feature-ID-format eller att objekten inte finns i lagret.`;

    throw new UpstreamError(errorMessage, 400);
  }

  // PARTIAL FAILURES

  const partialFailures = [];

  if (inserts.length > 0 && result.inserted < inserts.length) {
    const failed = inserts.length - result.inserted;
    partialFailures.push(`${failed} av ${inserts.length} nya objekt`);

    logger.warn("WFS-T partial insert failure", {
      layerId: id,
      typeName,
      expected: inserts.length,
      actual: result.inserted,
      failed,
      geometryTypes: inserts.map((f) => f.geometry?.type).filter(Boolean),
    });
  }

  if (formattedUpdates.length > 0 && result.updated < formattedUpdates.length) {
    const failed = formattedUpdates.length - result.updated;
    partialFailures.push(
      `${failed} av ${formattedUpdates.length} uppdateringar`
    );

    logger.warn("WFS-T partial update failure", {
      layerId: id,
      typeName,
      expected: formattedUpdates.length,
      actual: result.updated,
      failed,
    });
  }

  if (formattedDeletes.length > 0 && result.deleted < formattedDeletes.length) {
    const failed = formattedDeletes.length - result.deleted;
    partialFailures.push(
      `${failed} av ${formattedDeletes.length} borttagningar`
    );

    logger.warn("WFS-T partial delete failure", {
      layerId: id,
      typeName,
      expected: formattedDeletes.length,
      actual: result.deleted,
      failed,
    });
  }

  logger.info("WFS-T transaction successful", {
    inserted: result.inserted,
    updated: result.updated,
    deleted: result.deleted,
    partialFailures: partialFailures.length > 0 ? partialFailures : undefined,
  });

  return {
    ...result,
    partialFailures: partialFailures.length > 0 ? partialFailures : undefined,
    warning: result.warning || undefined,
  };
}

// Helper: validate GeoJSON geometry
function isValidGeoJSONGeometry(geom) {
  if (!geom || typeof geom !== "object") return false;

  const validTypes = [
    "Point",
    "LineString",
    "Polygon",
    "MultiPoint",
    "MultiLineString",
    "MultiPolygon",
    "GeometryCollection",
  ];

  if (!validTypes.includes(geom.type)) return false;

  // GeometryCollection must have geometries array
  if (geom.type === "GeometryCollection") {
    if (!Array.isArray(geom.geometries)) return false;
    // Recursively validate each geometry in the collection
    return geom.geometries.every((g) => isValidGeoJSONGeometry(g));
  }

  // All other types must have coordinates array
  if (!Array.isArray(geom.coordinates)) {
    return false;
  }

  return true;
}

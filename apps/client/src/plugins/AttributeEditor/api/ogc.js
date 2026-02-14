import { hfetch } from "../../../utils/FetchWrapper";
import { WFS, GeoJSON } from "ol/format";
import GML2 from "ol/format/GML2";
import Feature from "ol/Feature";

const wfsFormat = new WFS();
const wfsGml2Format = new WFS({ gmlFormat: new GML2() });
const geojsonFormat = new GeoJSON();

/**
 * Creates an OGC API client for WFST operations.
 *
 * - Layer listing and metadata are fetched from the Hajk backend
 *   (which handles AD filtering).
 * - Feature data is proxied through the backend but parsed client-side
 *   using OpenLayers (supports both GeoJSON and GML responses).
 * - WFS-T transactions are built client-side with OpenLayers and
 *   forwarded through the backend proxy.
 *
 * All HTTP calls use hfetch (FetchWrapper) for correct credential
 * handling, including NTLM/Kerberos when behind IIS.
 *
 * @param {string} baseUrl - The backend API base URL
 * @returns {Object} API methods
 */
export function createOgcApi(baseUrl) {
  const base = (baseUrl || "").replace(/\/+$/, "");

  // Validate layerId to prevent path traversal attacks
  const validateLayerId = (id) => {
    if (id == null || id === "") {
      throw new Error("Layer ID is required");
    }
    const idStr = String(id);
    if (/[/\\.]{2,}|[<>"|*?]/.test(idStr)) {
      throw new Error("Invalid layer ID format");
    }
    return encodeURIComponent(idStr);
  };

  const pickFields = (fields) => {
    const f = (fields ?? "").trim();
    return f ? `?fields=${encodeURIComponent(f)}` : "";
  };

  const logError = (context, error) => {
    console.error(`[AttributeEditor/OGC] ${context}:`, error);
  };

  // ── Layer listing & metadata (backend handles AD filtering) ──────

  const fetchWfstList = async (fields = "id,caption", { signal } = {}) => {
    const res = await hfetch(`${base}/ogc/wfst${pickFields(fields)}`, {
      signal,
    });
    if (!res.ok) throw new Error(`WFST-lista misslyckades (${res.status})`);
    const json = await res.json();
    if (Array.isArray(json)) return json;
    if (Array.isArray(json.layers)) return json.layers;
    if (Array.isArray(json.wfst)) return json.wfst;
    return [];
  };

  const getServiceMeta = async (id, { signal } = {}) => {
    const safeId = validateLayerId(id);
    try {
      const res = await hfetch(`${base}/ogc/wfst/${safeId}`, { signal });
      if (!res.ok) throw new Error(`Failed to fetch metadata (${res.status})`);
      const layer = await res.json();
      return {
        id: layer.id,
        caption: layer.caption,
        title: layer.caption,
        projection: layer.projection,
        layers: layer.layers || [],
      };
    } catch (error) {
      logError("getServiceMeta", error);
      throw error;
    }
  };

  const fetchWfstMeta = async (id, { signal } = {}) => {
    return getServiceMeta(id, { signal });
  };

  /** Fetch the full layer configuration object from backend. */
  const fetchWfst = async (id, fields, { signal } = {}) => {
    const safeId = validateLayerId(id);
    try {
      const url = `${base}/ogc/wfst/${safeId}${pickFields(fields)}`;
      const res = await hfetch(url, { signal });
      if (!res.ok) throw new Error(`WFST get misslyckades (${res.status})`);
      return res.json();
    } catch (error) {
      logError("fetchWfst", error);
      throw error;
    }
  };

  // ── Features (backend proxies, client parses with OpenLayers) ────

  const fetchWfstFeatures = async (id, params = {}, { signal } = {}) => {
    const safeId = validateLayerId(id);
    const queryParams = {
      ...params,
    };

    const q = new URLSearchParams(queryParams).toString();
    const url = `${base}/ogc/wfst/${safeId}/features?${q}`;

    const res = await hfetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      cache: "no-store",
      signal,
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch WFST features (${res.status})`);
    }

    const result = await res.json();
    const srs = result.srsName || "EPSG:3006";
    const layerProj = result.layerProjection || srs;

    // JSON response — already GeoJSON, pass through with CRS metadata
    if (result.format === "json") {
      const fc = addCrsMetadata(result.data, srs, layerProj);
      // Post-process to match old gml.js output format:
      // add @_fid and strip namespace prefixes from property keys
      if (Array.isArray(fc.features)) {
        for (const f of fc.features) {
          if (f.id != null && f.properties && !f.properties["@_fid"]) {
            f.properties["@_fid"] = String(f.id);
          }
          if (f.properties) {
            const cleaned = {};
            for (const [k, v] of Object.entries(f.properties)) {
              const colonIdx = k.indexOf(":");
              const cleanKey = colonIdx >= 0 ? k.slice(colonIdx + 1) : k;
              cleaned[cleanKey] = v;
            }
            f.properties = cleaned;
          }
        }
      }
      // QGIS Server includes geometry_name in GeoJSON features
      const firstFeature = fc.features?.[0];
      if (firstFeature?.geometry_name) {
        fc.geometryName = firstFeature.geometry_name;
      }
      return fc;
    }

    // XML/GML response — parse with OpenLayers.
    // Don't pass dataProjection/featureProjection here: the GML may
    // contain a different srsName than what the backend requested
    // (e.g. QGIS Server ignoring the SRSNAME parameter). Letting OL
    // auto-detect avoids failed reprojections for unregistered CRS.
    //
    // Some WFS servers (notably QGIS Server) return GML2 encoding
    // inside a WFS 1.1.0 response. OL defaults to a GML3 parser for
    // WFS 1.1.0 which can fail on GML2 polygon geometries. If the
    // GML3 parse fails we retry with an explicit GML2 parser.
    let features;
    try {
      features = wfsFormat.readFeatures(result.data);
    } catch (e) {
      features = []; // trigger GML2 fallback below
    }

    // GML2 fallback: if GML3 parser returned 0 features (or threw),
    // the XML likely contains GML2 encoding (common with QGIS Server).
    // Check if the XML actually contains feature members before giving up.
    if (
      features.length === 0 &&
      /<(gml:)?featureMember|<wfs:member/i.test(result.data)
    ) {
      try {
        features = wfsGml2Format.readFeatures(result.data);
      } catch (e2) {
        logError("GML2 fallback parsing also failed", e2);
      }
    }

    // Detect the actual geometry field name from parsed features.
    // This is critical for WFS-T: the insert XML must use the correct
    // element name (e.g. "geometry" not "geom"). OL reads this from GML.
    const detectedGeomName =
      features.length > 0 ? features[0].getGeometryName() : null;

    // Use the backend-reported CRS (from layer config) for the
    // FeatureCollection metadata. The old backend gml.js never detected
    // CRS from XML — it just used the configured projection. Using the
    // XML-detected CRS can fail if that CRS isn't registered in OL/proj4.
    const fc = toFeatureCollection(features, srs, layerProj);
    if (detectedGeomName) {
      fc.geometryName = detectedGeomName;
    }
    return fc;
  };

  // ── Transactions (client builds XML with OL, backend proxies) ────

  const commitWfstTransaction = async (
    layerId,
    transaction,
    { signal } = {}
  ) => {
    const safeLayerId = validateLayerId(layerId);
    const {
      inserts = [],
      updates = [],
      deletes = [],
      srsName,
      geometryName: txGeomName,
    } = transaction;

    try {
      // Fetch layer config for WFS-T parameters (namespace, typeName, etc.)
      const layer = await fetchWfst(layerId, null, { signal });
      const typeName = resolveTypeName(layer);
      const [prefix, type] = splitTypeName(typeName);
      // Geometry field name priority:
      // 1. Detected from loaded features (most reliable — matches actual WFS schema)
      // 2. Layer config geometryField
      // 3. Fallback "geometry" (matches transaction-builder.js default)
      const geometryName = txGeomName || layer.geometryField || "geometry";
      // Namespace URI: layer config → generated from workspace prefix
      // (matches transaction-builder.js: `http://hajk.se/wfs/${nsPrefix}`)
      const featureNS = layer.uri || `http://hajk.se/wfs/${prefix}`;
      const crs = srsName || layer.projection || "EPSG:3006";

      // Convert GeoJSON-like objects to OpenLayers Feature objects
      const olInserts = inserts.map((f) => toOlFeature(f, crs, geometryName));
      const olUpdates = updates.map((f) =>
        toOlFeature(f, crs, geometryName, formatFeatureId(f.id, layer))
      );
      const olDeletes = deletes.map((fid) => {
        const feat = new Feature();
        feat.setId(formatFeatureId(fid, layer));
        return feat;
      });

      // Build WFS-T XML using OpenLayers
      const transactionNode = wfsFormat.writeTransaction(
        olInserts,
        olUpdates,
        olDeletes,
        {
          featureNS,
          featurePrefix: prefix,
          featureType: type,
          srsName: crs,
          hasZ: false,
          version: "1.1.0",
        }
      );
      const transactionXml = new XMLSerializer().serializeToString(
        transactionNode
      );

      // Send through backend proxy (which validates AD and forwards to WFS)
      const url = `${base}/ogc/wfst/${safeLayerId}/transaction`;
      const response = await hfetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionXml }),
        signal,
      });

      if (!response.ok) {
        const err = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Transaction failed");
      }

      // Parse the raw WFS-T response from the upstream server
      const { wfsResponse } = await response.json();
      const parsed = parseWfstResponse(wfsResponse);
      return parsed;
    } catch (error) {
      logError("commitWfstTransaction", error);
      throw error;
    }
  };

  return {
    fetchWfstList,
    getServiceMeta,
    fetchWfstMeta,
    fetchWfst,
    fetchWfstFeatures,
    commitWfstTransaction,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Add CRS metadata to a GeoJSON FeatureCollection (matches backend contract). */
function addCrsMetadata(fc, srsName, layerProjection) {
  const crs = srsName || "EPSG:3006";
  fc.crsName = crs;
  fc.layerProjection = layerProjection || crs;

  const epsgCode = crs.match(/EPSG:(\d+)/)?.[1];
  if (epsgCode) {
    fc.crs = {
      type: "name",
      properties: { name: `urn:ogc:def:crs:EPSG::${epsgCode}` },
    };
  }
  return fc;
}

/**
 * Convert OpenLayers features to a GeoJSON FeatureCollection with CRS.
 *
 * Matches the output format of the old backend gml.js:
 *  - @_fid added to properties (from OL feature ID)
 *  - Namespace prefixes stripped from property names
 */
function toFeatureCollection(olFeatures, srsName, layerProjection) {
  const fc = geojsonFormat.writeFeaturesObject(olFeatures, {
    dataProjection: srsName,
    featureProjection: srsName,
  });

  // Post-process each feature to match old gml.js output format
  if (Array.isArray(fc.features)) {
    for (const f of fc.features) {
      // 1) Add @_fid to properties (gml.js did this via fast-xml-parser
      //    attributeNamePrefix: "@_" — AttributeEditor.js relies on it)
      if (f.id != null && f.properties) {
        f.properties["@_fid"] = String(f.id);
      }

      // 2) Strip namespace prefixes from property keys (qgs:bg_namn → bg_namn)
      if (f.properties) {
        const cleaned = {};
        for (const [k, v] of Object.entries(f.properties)) {
          const colonIdx = k.indexOf(":");
          const cleanKey = colonIdx >= 0 ? k.slice(colonIdx + 1) : k;
          cleaned[cleanKey] = v;
        }
        f.properties = cleaned;
      }
    }
  }

  return addCrsMetadata(fc, srsName, layerProjection);
}

/**
 * Convert a GeoJSON-like insert/update object to an OpenLayers Feature.
 *
 * Input format (from AttributeEditorView):
 *   insert: { properties: {...}, geometry: {...} }
 *   update: { id: "123", properties: {...}, geometry?: {...} }
 */
function toOlFeature(data, srsName, geometryName, featureId) {
  const props = { ...(data.properties || {}) };

  if (data.geometry) {
    props[geometryName] = geojsonFormat.readGeometry(data.geometry, {
      dataProjection: srsName,
      featureProjection: srsName,
    });
  }

  const feature = new Feature(props);
  feature.setGeometryName(geometryName);

  if (featureId != null) {
    feature.setId(featureId);
  }

  return feature;
}

/**
 * Resolve the typeName from a layer config.
 * WFST layers are configured with exactly one typeName in the layers array.
 * Warns if multiple are found — WFS-T transactions target a single featureType.
 */
function resolveTypeName(layer) {
  if (Array.isArray(layer.layers)) {
    if (layer.layers.length === 0) {
      throw new Error(
        `Layer "${layer.caption || layer.id}" has no typeName configured`
      );
    }
    if (layer.layers.length > 1) {
      console.warn(
        `[AttributeEditor/OGC] Layer "${layer.caption || layer.id}" has ${layer.layers.length} typeNames — using first: "${layer.layers[0]}"`
      );
    }
    return layer.layers[0];
  }
  if (typeof layer.layers === "string" && layer.layers) {
    return layer.layers;
  }
  throw new Error(
    `Layer "${layer.caption || layer.id}" has no typeName configured`
  );
}

/** Split "workspace:layerName" into [prefix, type]. */
function splitTypeName(typeName) {
  const parts = String(typeName).split(":");
  return parts.length === 2 ? parts : ["feature", parts[0]];
}

/**
 * Format a feature ID for the upstream WFS server.
 * GeoServer expects "typeName.numericId", QGIS Server uses plain IDs.
 */
function formatFeatureId(featureId, layer) {
  if (featureId == null) return featureId;

  const idStr = String(featureId);

  // Already qualified (contains . or :) — keep as-is
  if (idStr.includes(".") || idStr.includes(":")) {
    return idStr;
  }

  // GeoServer expects "typeName.id"
  const isGeoServer =
    layer.serverType === "geoserver" ||
    layer.url?.toLowerCase().includes("geoserver");

  if (isGeoServer) {
    const typeName = resolveTypeName(layer);
    return `${typeName}.${featureId}`;
  }

  return idStr;
}

/**
 * Parse a raw WFS-T TransactionResponse XML string.
 * Uses OpenLayers readTransactionResponse when possible,
 * with DOMParser fallback for non-standard responses.
 */
function parseWfstResponse(xml) {
  const doc = new DOMParser().parseFromString(xml, "text/xml");

  // Helper: find element by local name regardless of namespace prefix
  const findNS = (tag) =>
    doc.querySelector(tag) || doc.getElementsByTagNameNS("*", tag)[0];
  const findAllNS = (tag) => {
    const fromQS = doc.querySelectorAll(tag);
    if (fromQS.length) return Array.from(fromQS);
    return Array.from(doc.getElementsByTagNameNS("*", tag));
  };

  // 1) Check for OGC/OWS exceptions (ows:ExceptionText, ServiceException)
  const exception = findNS("ExceptionText") || findNS("ServiceException");
  if (exception) {
    return {
      success: false,
      error: exception.textContent.trim(),
      inserted: 0,
      updated: 0,
      deleted: 0,
    };
  }

  // 2) Extract counts from TransactionSummary
  const getText = (tag) => parseInt(findNS(tag)?.textContent || "0", 10);
  let inserted, updated, deleted;

  try {
    const result = wfsFormat.readTransactionResponse(xml);
    if (result) {
      inserted = result.transactionSummary?.totalInserted ?? 0;
      updated = result.transactionSummary?.totalUpdated ?? 0;
      deleted = result.transactionSummary?.totalDeleted ?? 0;
    }
  } catch {
    // OL parser failed — fall through to manual count extraction
  }

  // Fallback: extract counts manually if OL parser didn't produce them
  if (inserted == null) {
    inserted = getText("totalInserted");
    updated = getText("totalUpdated");
    deleted = getText("totalDeleted");
  }

  // 3) Check for failure messages in TransactionResults/Action/Message.
  //    QGIS Server reports per-operation failures this way inside a valid
  //    TransactionResponse. Only treat as error when all counts are 0
  //    (to avoid false positives from servers that include informational
  //    messages on successful transactions).
  const total = inserted + updated + deleted;
  const actionMessages = findAllNS("Message");
  if (actionMessages.length > 0 && total === 0) {
    const errors = actionMessages.map((el) => el.textContent.trim());
    return {
      success: false,
      error: errors.join("; "),
      inserted: 0,
      updated: 0,
      deleted: 0,
    };
  }

  // 4) If we have counts or messages, build the response
  const response = { success: true, inserted, updated, deleted };

  // Attach warning if there were messages but some operations succeeded
  if (actionMessages.length > 0) {
    response.warning = actionMessages
      .map((el) => el.textContent.trim())
      .join("; ");
  }

  return response;
}

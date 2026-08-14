import { hfetch } from "../../../utils/FetchWrapper";
import { WFS, GeoJSON } from "ol/format";
import GML2 from "ol/format/GML2";
import Feature from "ol/Feature";
import MultiPoint from "ol/geom/MultiPoint";
import MultiLineString from "ol/geom/MultiLineString";
import MultiPolygon from "ol/geom/MultiPolygon";

const wfsFormat = new WFS();
const wfsGml2Format = new WFS({ gmlFormat: new GML2() });
const geojsonFormat = new GeoJSON();

function coordsHaveZ(coords) {
  if (!Array.isArray(coords) || coords.length === 0) return false;
  if (typeof coords[0] === "number") return coords.length >= 3;
  return coordsHaveZ(coords[0]);
}

function addZToCoords(coords) {
  if (!Array.isArray(coords)) return coords;
  if (typeof coords[0] === "number") {
    return coords.length === 2 ? [...coords, 0] : coords;
  }
  return coords.map(addZToCoords);
}

function ensureZInGeometry(geom) {
  if (!geom) return geom;
  if (geom.geometries) {
    return { ...geom, geometries: geom.geometries.map(ensureZInGeometry) };
  }
  if (!geom.coordinates) return geom;
  return { ...geom, coordinates: addZToCoords(geom.coordinates) };
}

/**
 * Creates an OGC API client for WFST operations.
 *
 * - Layer listing and metadata are fetched from the Hajk backend
 *   (which handles AD filtering).
 * - Feature data is fetched directly from layer.url (absolute URL) or via
 *   the backend proxy (relative URL), and parsed client-side using OpenLayers
 *   (supports both GeoJSON and GML responses).
 * - WFS-T transactions are built client-side with OpenLayers and
 *   sent to layer.url (direct for absolute URLs, via backend proxy
 *   for relative URLs) — same routing as feature fetching.
 *
 * All HTTP calls use hfetch (FetchWrapper) for correct credential
 * handling, including NTLM/Kerberos when behind IIS.
 *
 * @param {string} baseUrl - The backend API base URL
 * @returns {Object} API methods
 */
export function createOgcApi(baseUrl) {
  const base = (baseUrl || "").replace(/\/+$/, "");

  // Backend origin from mapserviceBase (e.g. "http://localhost:3002").
  // Used to prefix relative layer.url paths so they reach the backend.
  const backendOrigin = (() => {
    try {
      return new URL(base).origin;
    } catch {
      return "";
    }
  })();

  /** Resolve layer.url: prefix relative paths with backend origin. */
  const resolveLayerUrl = (url) => {
    if (!url) return url;
    if (url.startsWith("/")) return `${backendOrigin}${url}`;
    return url;
  };

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

  // ── Features (fetched from layer.url — either proxy or direct) ───

  // WFS servers report errors as XML exception documents, often with
  // HTTP 200 (classic QGIS Server/GeoServer behavior). Without this check
  // such a response parses to "0 features" and looks like an empty layer.
  // Only the head is sniffed for the ROOT element — feature responses start
  // with FeatureCollection, and exception words inside attribute values are
  // entity-escaped in real XML, so false positives are not possible.
  const detectWfsException = (text) => {
    if (typeof text !== "string") return null;
    const head = text.slice(0, 1000);
    if (!/<(\w+:)?(ExceptionReport|ServiceExceptionReport)[\s>]/i.test(head)) {
      return null;
    }
    const m = text.match(
      /<(?:\w+:)?(?:ExceptionText|ServiceException)[^>]*>([\s\S]*?)<\//i
    );
    return (m?.[1] || "").trim() || "Okänt WFS-fel (ExceptionReport)";
  };

  const fetchWfstFeatures = async (id, params = {}, { signal } = {}) => {
    // Always get layer config from backend (AD filtering, metadata)
    const layer = await fetchWfst(id, null, { signal });
    const typeName = resolveTypeName(layer);
    const srs = params.srsName || layer.projection || "EPSG:3006";
    const version = params.version || "1.1.0";

    // Build WFS GetFeature URL using layer.url.
    // If layer.url is relative (e.g. /api/v2/proxy/kartserver/wfs)
    // it goes through the backend proxy. If absolute
    // (e.g. https://karta.orebro.se/wfs) it goes direct.
    const queryParams = new URLSearchParams({
      SERVICE: "WFS",
      REQUEST: "GetFeature",
      VERSION: version,
      TYPENAME: typeName,
      SRSNAME: srs,
    });
    // Feature cap — WFS 1.x uses MAXFEATURES, WFS 2.0 uses COUNT.
    const limit = params.limit ?? params.maxFeatures;
    if (limit) {
      queryParams.set(
        version.startsWith("2") ? "COUNT" : "MAXFEATURES",
        String(limit)
      );
    }
    if (params.bbox) {
      queryParams.set("BBOX", params.bbox);
    }
    if (params.filter) {
      queryParams.set("FILTER", params.filter);
    }
    if (params.cqlFilter) {
      queryParams.set("CQL_FILTER", params.cqlFilter);
    }
    const layerUrl = resolveLayerUrl(layer.url);
    const separator = layerUrl.includes("?") ? "&" : "?";
    const wfsUrl = `${layerUrl}${separator}${queryParams.toString()}`;

    const res = await hfetch(wfsUrl, {
      method: "GET",
      cache: "no-store",
      signal,
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch WFS features (${res.status})`);
    }

    const contentType = res.headers.get("Content-Type") || "";
    const responseText = await res.text();
    const layerProj = layer.projection || srs;

    const wfsError = detectWfsException(responseText);
    if (wfsError) {
      throw new Error(`WFS-fel från servern: ${wfsError}`);
    }

    // JSON response — parse as GeoJSON
    if (contentType.includes("json")) {
      const data =
        typeof responseText === "string"
          ? JSON.parse(responseText)
          : responseText;
      const fc = addCrsMetadata(data, srs, layerProj);
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
      const firstFeature = fc.features?.[0];
      if (firstFeature?.geometry_name) {
        fc.geometryName = firstFeature.geometry_name;
      }
      if (firstFeature?.geometry?.coordinates) {
        fc.hasZ = coordsHaveZ(firstFeature.geometry.coordinates);
      }
      if (firstFeature?.geometry?.type) {
        fc.geometryType = firstFeature.geometry.type;
      }
      if (!fc.geometryType) {
        const dtResult = await fetchWfsGeometryType(
          layerUrl,
          typeName,
          version,
          signal
        );
        if (dtResult) {
          fc.geometryType = dtResult.type;
          if (!fc.hasZ) fc.hasZ = dtResult.hasZ;
        }
      }
      if (limit && Array.isArray(fc.features) && fc.features.length >= limit) {
        // The server returned exactly the cap — the layer likely has more.
        fc.limitReached = Number(limit);
      }
      fc.layerConfig = layer;
      return fc;
    }

    // XML/GML response — parse with OpenLayers.
    // Some WFS servers (notably QGIS Server) return GML2 encoding
    // inside a WFS 1.1.0 response. If GML3 parse fails, retry GML2.
    let features;
    try {
      features = wfsFormat.readFeatures(responseText);
    } catch {
      features = [];
    }

    if (
      features.length === 0 &&
      /<(gml:)?featureMember|<wfs:member/i.test(responseText)
    ) {
      try {
        features = wfsGml2Format.readFeatures(responseText);
      } catch (e2) {
        logError("GML2 fallback parsing also failed", e2);
      }
    }

    const detectedGeomName =
      features.length > 0 ? features[0].getGeometryName() : null;
    const firstLayout = features[0]?.getGeometry?.()?.getLayout?.();
    const detectedGeomType = features[0]?.getGeometry?.()?.getType?.() ?? null;

    const fc = toFeatureCollection(features, srs, layerProj);
    if (detectedGeomName) {
      fc.geometryName = detectedGeomName;
    }
    if (firstLayout) {
      fc.hasZ = firstLayout === "XYZ" || firstLayout === "XYZM";
    }
    if (detectedGeomType) {
      fc.geometryType = detectedGeomType;
    }
    if (!fc.geometryType) {
      const dtResult = await fetchWfsGeometryType(
        layerUrl,
        typeName,
        version,
        signal
      );
      if (dtResult) {
        fc.geometryType = dtResult.type;
        if (!fc.hasZ) fc.hasZ = dtResult.hasZ;
      }
    }
    if (limit && Array.isArray(fc.features) && fc.features.length >= limit) {
      // The server returned exactly the cap — the layer likely has more.
      fc.limitReached = Number(limit);
    }
    fc.layerConfig = layer;
    return fc;
  };

  // ── Transactions (client builds XML with OL, backend proxies) ────

  const commitWfstTransaction = async (
    layerId,
    transaction,
    { signal } = {}
  ) => {
    const {
      inserts = [],
      updates = [],
      deletes = [],
      srsName,
      geometryName: txGeomName,
      hasZ: txHasZ,
      geometryType: txGeomType,
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
      const hasZ = Boolean(txHasZ || layer.forceZ);
      const needsMultiWrap = /^Multi/i.test(txGeomType);

      // Convert GeoJSON-like objects to OpenLayers Feature objects
      const olInserts = inserts.map((f) => {
        const olF = toOlFeature(f, crs, geometryName, undefined, hasZ);
        if (needsMultiWrap) {
          const geom = olF.getGeometry();
          if (geom) olF.setGeometry(wrapGeomAsMulti(geom));
        }
        return olF;
      });
      const olUpdates = updates.map((f) => {
        const olF = toOlFeature(
          f,
          crs,
          geometryName,
          formatFeatureId(f.id, layer),
          hasZ
        );
        if (needsMultiWrap) {
          const geom = olF.getGeometry();
          if (geom) olF.setGeometry(wrapGeomAsMulti(geom));
        }
        return olF;
      });
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
          hasZ,
          version: "1.1.0",
        }
      );
      const transactionXml = new XMLSerializer().serializeToString(
        transactionNode
      );

      // POST WFS-T XML directly to layer.url (proxy or kartserver)
      const response = await hfetch(resolveLayerUrl(layer.url), {
        method: "POST",
        headers: { "Content-Type": "application/xml" },
        body: transactionXml,
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `Transaction failed (${response.status}): ${errorText}`
        );
      }

      const wfsResponse = await response.text();
      return parseWfstResponse(wfsResponse);
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
function toOlFeature(data, srsName, geometryName, featureId, hasZ = false) {
  const props = { ...(data.properties || {}) };

  if (data.geometry) {
    const geom = hasZ ? ensureZInGeometry(data.geometry) : data.geometry;
    props[geometryName] = geojsonFormat.readGeometry(geom, {
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
 *
 * The OGC WFS/GML standard uses qualified IDs: "typeName.numericId".
 * Most WFS servers follow this (GeoServer, ArcGIS Server, MapServer, …).
 * QGIS Server is a known exception — it uses plain unqualified IDs.
 *
 * The logic therefore qualifies by default (standard-compliant) and
 * only skips qualification for QGIS Server.
 */
function formatFeatureId(featureId, layer) {
  if (featureId == null) return featureId;

  let idStr = String(featureId);

  // Strip the namespace prefix if OpenLayers included it in the gml:id.
  try {
    const [wsPrefix] = splitTypeName(resolveTypeName(layer));
    if (
      wsPrefix &&
      wsPrefix !== "feature" &&
      idStr.startsWith(`${wsPrefix}:`)
    ) {
      idStr = idStr.slice(wsPrefix.length + 1);
    }
  } catch {
    // resolveTypeName can throw if layer has no typeName — skip prefix stripping
  }

  if (idStr.includes(".")) {
    return idStr;
  }

  // QGIS Server uses plain (unqualified) feature IDs
  const isQgis =
    layer.serverType === "qgis" || layer.url?.toLowerCase().includes("qgis");

  if (isQgis) {
    return idStr;
  }

  // Standard WFS: qualify as "localTypeName.id" (without workspace prefix).
  // GeoServer and most WFS servers use the local layer name in GML IDs,
  // e.g. "mylayer.1" not "myworkspace:mylayer.1".
  const [, localType] = splitTypeName(resolveTypeName(layer));
  return `${localType}.${idStr}`;
}

/**
 * Fetch the geometry column type from WFS DescribeFeatureType (JSON format).
 * Called as fallback when no features were loaded (empty layer).
 * Returns { type, hasZ } where type is an OL-compatible geometry type string
 * (e.g. "MultiPolygon") and hasZ is true for 3D geometry columns, or null on failure.
 */
async function fetchWfsGeometryType(layerUrl, typeName, version, signal) {
  try {
    const sep = layerUrl.includes("?") ? "&" : "?";
    const url =
      `${layerUrl}${sep}SERVICE=WFS&REQUEST=DescribeFeatureType` +
      `&VERSION=${version}&TYPENAME=${encodeURIComponent(typeName)}` +
      `&OUTPUTFORMAT=application%2Fjson`;
    const res = await hfetch(url, { signal });
    if (!res.ok) return null;
    const json = await res.json();
    const props = json?.featureTypes?.[0]?.properties;
    if (!Array.isArray(props)) return null;
    const geomProp = props.find((p) => /^gml:/i.test(p.type ?? ""));
    if (!geomProp?.localType) return null;
    const rawLocalType = geomProp.localType;
    // Detect 3D from type name — QGIS Server exposes e.g. "PointZPropertyType"
    const hasZ = /Z(?:M)?(?:PropertyType)?$/i.test(rawLocalType);
    // Strip Z/ZM and PropertyType suffixes to get a plain base type name
    const stripped = rawLocalType
      .replace(/Z(?:M)?(?:PropertyType)?$/i, "")
      .replace(/PropertyType$/i, "");
    const baseType = stripped || rawLocalType;
    // Normalize GML3 surface/curve aliases to OL type names
    const aliases = {
      MultiSurface: "MultiPolygon",
      MultiCurve: "MultiLineString",
      Surface: "Polygon",
      Curve: "LineString",
    };
    return { type: aliases[baseType] ?? baseType, hasZ };
  } catch {
    return null;
  }
}

/**
 * Wrap a singular OL geometry in its Multi equivalent.
 * Already-multi or unsupported types are returned unchanged.
 */
function wrapGeomAsMulti(geom) {
  switch (geom.getType()) {
    case "Point":
      return new MultiPoint([geom.getCoordinates()]);
    case "LineString":
      return new MultiLineString([geom.getCoordinates()]);
    case "Polygon":
      return new MultiPolygon([geom.getCoordinates()]);
    default:
      return geom;
  }
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
      message: exception.textContent.trim(),
      inserted: 0,
      updated: 0,
      deleted: 0,
    };
  }

  // 2) Extract counts and inserted feature ids from TransactionSummary
  const getText = (tag) => parseInt(findNS(tag)?.textContent || "0", 10);
  let inserted, updated, deleted;
  let insertedIds = [];

  try {
    const result = wfsFormat.readTransactionResponse(xml);
    if (result) {
      // NO "?? 0" here: when the OL parser returns a result without a
      // usable transactionSummary the counts must stay undefined so the
      // manual extraction below can engage — coercing to 0 made a
      // successful transaction look like "Delvis sparat: 0 ...".
      inserted = result.transactionSummary?.totalInserted;
      updated = result.transactionSummary?.totalUpdated;
      deleted = result.transactionSummary?.totalDeleted;
      // The fids the server assigned to newly inserted features
      // (e.g. "mylayer.124") — used to re-select them after save.
      insertedIds = result.insertIds ?? [];
    }
  } catch {
    // OL parser failed — fall through to manual count extraction
  }

  // Fallback: extract counts manually if OL parser didn't produce them.
  // Per field, so a partially populated transactionSummary can't leave an
  // undefined slot behind (inserted + undefined would make the total NaN).
  if (inserted == null) inserted = getText("totalInserted");
  if (updated == null) updated = getText("totalUpdated");
  if (deleted == null) deleted = getText("totalDeleted");

  // Fallback for inserted fids: read InsertResults' FeatureId (WFS 1.x)
  // or ResourceId (WFS 2.0) elements directly.
  if (insertedIds.length === 0 && inserted > 0) {
    insertedIds = [
      ...findAllNS("FeatureId").map((el) => el.getAttribute("fid")),
      ...findAllNS("ResourceId").map((el) => el.getAttribute("rid")),
    ].filter(Boolean);
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
      message: errors.join("; "),
      inserted: 0,
      updated: 0,
      deleted: 0,
    };
  }

  // 4) If we have counts or messages, build the response
  const response = { success: true, inserted, updated, deleted, insertedIds };

  // Attach warning if there were messages but some operations succeeded
  if (actionMessages.length > 0) {
    response.warning = actionMessages
      .map((el) => el.textContent.trim())
      .join("; ");
  }

  return response;
}

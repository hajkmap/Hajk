export const CONSTANTS = {
  DEFAULT_BASE:
    process.env.HAJK_BASE_URL || `http://localhost:${process.env.PORT || 3002}`,
  UPSTREAM_TIMEOUT: Number(process.env.OGC_UPSTREAM_TIMEOUT_MS || 20000),
  TRANSACTION_TIMEOUT: Number(process.env.OGC_TRANSACTION_TIMEOUT_MS || 60000),

  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 2000, 4000],
  DEFAULT_LIMIT: Number(process.env.OGC_DEFAULT_LIMIT || 1000),
  MAX_LIMIT: Number(process.env.OGC_MAX_LIMIT || 10000),
  MAX_RESPONSE_BYTES: Number(
    process.env.OGC_MAX_RESPONSE_BYTES || 300 * 1024 * 1024
  ), // 300 MB – GML for complex polygons is very verbose

  // WFS-T: max XML payload size (catches both bulk ops and complex geometries)
  MAX_TRANSACTION_XML_BYTES: Number(
    process.env.OGC_MAX_TRANSACTION_XML_BYTES || 10 * 1024 * 1024
  ), // 10 MB

  NAMESPACES: {
    GML: "gml:",
    WFS: "wfs:",
  },

  GEOMETRY_TYPES: [
    "Point",
    "LineString",
    "Polygon",
    "MultiPoint",
    "MultiLineString",
    "MultiPolygon",
    "MultiSurface",
    "MultiGeometry",
    "GeometryCollection",
  ],

  GEOMETRY_TYPES_SET: new Set([
    "Point",
    "LineString",
    "Polygon",
    "MultiPoint",
    "MultiLineString",
    "MultiPolygon",
    "MultiSurface",
    "MultiGeometry",
    "GeometryCollection",
  ]),

  WFS_VERSIONS: {
    V1: "1.1.0",
    V2: "2.0.0",
  },

  // null = allow all (fallback); otherwise, comma-separated allowlist in env
  ALLOWED_HOSTS: process.env.WFS_ALLOWED_HOSTS
    ? process.env.WFS_ALLOWED_HOSTS.split(",").map((h) => h.trim())
    : null,
};

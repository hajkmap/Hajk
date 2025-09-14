export const CONSTANTS = {
  DEFAULT_BASE:
    process.env.HAJK_BASE_URL || `http://localhost:${process.env.PORT || 3002}`,
  UPSTREAM_TIMEOUT: Number(process.env.OGC_UPSTREAM_TIMEOUT_MS || 20000),

  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 2000, 4000],
  MAX_LIMIT: 10000,
  MAX_RESPONSE_BYTES: 100 * 1024 * 1024, // 100 MB

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

  WFS_VERSIONS: {
    V1: "1.1.0",
    V2: "2.0.0",
  },

  // null = allow all (fallback); otherwise, comma-separated whitelist in env
  ALLOWED_HOSTS: process.env.WFS_ALLOWED_HOSTS
    ? process.env.WFS_ALLOWED_HOSTS.split(",").map((h) => h.trim())
    : null,
};

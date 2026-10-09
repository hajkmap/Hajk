/**
 * @summary Extracts all line segments (edges) from a geometry.
 * @param {ol.geom.Geometry} geometry
 * @returns {Array<[number[], number[]]>} Array of line segments [start, end]
 */
export const getGeometryEdges = (geometry) => {
  const type = geometry.getType();
  const edges = [];

  const addEdgesFromCoords = (coords) => {
    for (let i = 0; i < coords.length - 1; i++) {
      edges.push([coords[i], coords[i + 1]]);
    }
  };

  switch (type) {
    case "LineString":
      addEdgesFromCoords(geometry.getCoordinates());
      break;
    case "Polygon":
      geometry.getCoordinates().forEach((ring) => addEdgesFromCoords(ring));
      break;
    case "MultiLineString":
      geometry.getCoordinates().forEach((line) => addEdgesFromCoords(line));
      break;
    case "MultiPolygon":
      geometry
        .getCoordinates()
        .forEach((polygon) =>
          polygon.forEach((ring) => addEdgesFromCoords(ring))
        );
      break;
    default:
      break;
  }

  return edges;
};

/**
 * @summary Computes the intersection point of two line segments, if any.
 * @param {number[]} p1 - Start of segment 1
 * @param {number[]} p2 - End of segment 1
 * @param {number[]} p3 - Start of segment 2
 * @param {number[]} p4 - End of segment 2
 * @returns {number[]|null} The intersection point [x, y] or null
 */
export const segmentIntersection = (p1, p2, p3, p4) => {
  const d1x = p2[0] - p1[0];
  const d1y = p2[1] - p1[1];
  const d2x = p4[0] - p3[0];
  const d2y = p4[1] - p3[1];

  const denom = d1x * d2y - d1y * d2x;

  // Parallel or coincident segments
  if (Math.abs(denom) < 1e-10) return null;

  const t = ((p3[0] - p1[0]) * d2y - (p3[1] - p1[1]) * d2x) / denom;
  const u = ((p3[0] - p1[0]) * d1y - (p3[1] - p1[1]) * d1x) / denom;

  // Check that intersection lies within both segments
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return [p1[0] + t * d1x, p1[1] + t * d1y];
  }

  return null;
};

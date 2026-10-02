import { LineString } from "ol/geom";
import { fromCircle } from "ol/geom/Polygon";
import {
  getArea as getSphereArea,
  getLength as getSphereLength,
} from "ol/sphere";

const PLANAR = "planar";
const SPHERE = "sphere";

/**
 * Returns the map-wide measurement method from the OL map.
 * Missing or unknown values are treated as planar.
 */
export const getMeasurementMethod = (map) =>
  map?.measurementMethod === SPHERE ? SPHERE : PLANAR;

const getProjectionOptions = (map) => ({
  projection: map.getView().getProjection(),
});

const measurePlanarArea = (geometry) => {
  try {
    if (typeof geometry.getArea === "function") {
      return geometry.getArea() || 0;
    }
    if (geometry.getType() === "GeometryCollection") {
      return geometry
        .getGeometries()
        .reduce((sum, child) => sum + measurePlanarArea(child), 0);
    }
    return 0;
  } catch {
    return 0;
  }
};

const measurePlanarLength = (geometry) => {
  try {
    if (typeof geometry.getLength === "function") {
      return geometry.getLength() || 0;
    }
    if (geometry.getType() === "GeometryCollection") {
      return geometry
        .getGeometries()
        .reduce((sum, child) => sum + measurePlanarLength(child), 0);
    }
    return 0;
  } catch {
    return 0;
  }
};

export const measureLength = (geometry, map) => {
  try {
    if (!geometry) {
      return 0;
    }
    if (getMeasurementMethod(map) === SPHERE) {
      return getSphereLength(geometry, getProjectionOptions(map)) || 0;
    }
    return measurePlanarLength(geometry);
  } catch {
    return 0;
  }
};

export const measureArea = (geometry, map) => {
  try {
    if (!geometry) {
      return 0;
    }
    if (getMeasurementMethod(map) === SPHERE) {
      return getSphereArea(geometry, getProjectionOptions(map)) || 0;
    }
    return measurePlanarArea(geometry);
  } catch {
    return 0;
  }
};

/**
 * Circle measurements. Sphere mode approximates the circle as a 96-segment
 * polygon (same as the previous ol/sphere implementation) so area accounts
 * for geodesic distortion; radius is the sphere length from center to edge.
 */
export const measureCircle = (circle, map) => {
  try {
    if (getMeasurementMethod(map) === SPHERE) {
      const polygon = fromCircle(circle, 96);
      const center = circle.getCenter();
      const edgePoint = polygon.getCoordinates()[0][0];
      const options = getProjectionOptions(map);
      return {
        area: getSphereArea(polygon, options) || 0,
        radius:
          getSphereLength(new LineString([center, edgePoint]), options) || 0,
      };
    }
    const radius = circle.getRadius();
    return {
      area: Math.pow(radius, 2) * Math.PI,
      radius,
    };
  } catch {
    return { area: 0, radius: 0 };
  }
};

/**
 * Outer-ring perimeter. Recurses into MultiPolygon and GeometryCollection.
 */
export const measurePolygonPerimeter = (geometry, map) => {
  try {
    const type = geometry?.getType?.();
    if (type === "MultiPolygon") {
      return geometry
        .getPolygons()
        .reduce(
          (sum, polygon) => sum + measurePolygonPerimeter(polygon, map),
          0
        );
    }
    if (type === "GeometryCollection") {
      return geometry
        .getGeometries()
        .reduce((sum, child) => sum + measurePolygonPerimeter(child, map), 0);
    }
    const linearRingCoords =
      geometry?.getLinearRing?.(0)?.getCoordinates?.() || null;
    if (!linearRingCoords) {
      return 0;
    }
    return measureLength(new LineString(linearRingCoords), map);
  } catch {
    return 0;
  }
};

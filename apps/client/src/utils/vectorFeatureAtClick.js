import VectorLayer from "ol/layer/Vector";

// Same pixel tolerance as handleClick in models/Click.js.
const HIT_TOLERANCE_PX = 10;

const AREA_GEOMETRY_TYPES = new Set(["Polygon", "MultiPolygon", "Circle"]);

/**
 * Vector features under a map click that "Välj på kartan" should be able to
 * copy. Content layers only (`ol/layer/Vector` with `layerType: "layer"`),
 * so draw sketches, snap guides, search results, and background layers stay
 * out. Two passes: what is actually painted, then polygon interiors that a
 * stroke-only symbol misses.
 *
 * @param {import("ol/Map").default} map
 * @param {number[]} pixel
 * @param {number[]} coordinate
 * @returns {import("ol/Feature").default[]}
 */
export function vectorFeaturesAtClick(map, pixel, coordinate) {
  if (!map || !pixel || !Array.isArray(coordinate)) {
    return [];
  }

  const features = [];
  const seen = new Set();

  const remember = (feature, layer) => {
    if (!feature || seen.has(feature) || isSkippedFeature(feature)) {
      return;
    }
    feature.layer = layer;
    seen.add(feature);
    features.push(feature);
  };

  map.forEachFeatureAtPixel(
    pixel,
    (feature, layer) => {
      if (!isContentVectorLayer(layer)) {
        return;
      }
      remember(feature, layer);
    },
    {
      hitTolerance: HIT_TOLERANCE_PX,
      layerFilter: isContentVectorLayer,
    }
  );

  const resolution = map.getView()?.getResolution();
  if (!resolution) {
    return features;
  }

  const tolerance = HIT_TOLERANCE_PX * resolution;
  const [x, y] = coordinate;
  const extent = [x - tolerance, y - tolerance, x + tolerance, y + tolerance];

  map.getAllLayers().forEach((layer) => {
    if (!isContentVectorLayer(layer) || !layer.isVisible?.()) {
      return;
    }
    const source = layer.getSource?.();
    if (typeof source?.forEachFeatureInExtent !== "function") {
      return;
    }
    source.forEachFeatureInExtent(extent, (feature) => {
      if (seen.has(feature) || isSkippedFeature(feature)) {
        return;
      }
      if (!areaFeatureHits(feature, coordinate, tolerance)) {
        return;
      }
      if (!featureIsDrawn(feature, resolution, layer)) {
        return;
      }
      remember(feature, layer);
    });
  });

  return features;
}

function isContentVectorLayer(layer) {
  return layer instanceof VectorLayer && layer.get("layerType") === "layer";
}

function isSkippedFeature(feature) {
  return (
    feature?.get?.("SNAP_IGNORE") === true ||
    feature?.get?.("USER_MEASUREMENT_GUIDE") === true
  );
}

// Polygon, MultiPolygon, and Circle. Interior clicks count, and so does a
// click within the pixel tolerance of the ring (stroke-only polygons).
function areaFeatureHits(feature, coordinate, tolerance) {
  const geometry = feature.getGeometry?.();
  if (!geometry || !AREA_GEOMETRY_TYPES.has(geometry.getType?.())) {
    return false;
  }
  if (geometry.intersectsCoordinate(coordinate)) {
    return true;
  }
  const closest = geometry.getClosestPoint(coordinate);
  const dx = closest[0] - coordinate[0];
  const dy = closest[1] - coordinate[1];
  return dx * dx + dy * dy <= tolerance * tolerance;
}

// Same choice as the vector renderer: a feature style function wins,
// otherwise the layer style function. The OpenLayers default is itself a
// style function and returns a style. A function that returns nothing (an
// SLD rule that does not apply at this resolution) leaves the feature undrawn.
function featureIsDrawn(feature, resolution, layer) {
  const styleFunction =
    feature.getStyleFunction?.() || layer.getStyleFunction?.();
  if (typeof styleFunction !== "function") {
    return false;
  }
  let style;
  try {
    style = styleFunction(feature, resolution);
  } catch {
    return false;
  }
  return styleDraws(style);
}

function styleDraws(style) {
  if (!style) {
    return false;
  }
  if (Array.isArray(style)) {
    return style.some((entry) => styleDraws(entry));
  }
  return true;
}

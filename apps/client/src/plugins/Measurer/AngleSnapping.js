import { Circle as CircleStyle, Stroke, Style } from "ol/style";
import { Feature } from "ol";
import { LineString, Point } from "ol/geom";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { buffer, containsCoordinate } from "ol/extent";
import { lineString as TurfLineString } from "@turf/helpers";
import booleanPointOnLine from "@turf/boolean-point-on-line";
import { getGeometryEdges, segmentIntersection } from "utils/geometryEdges";

// Green guide strokes are 1px (rays) or 7px (the highlighted segment). A few
// extra pixels lets a click land on the ray without requiring an exact hit.
const GUIDE_HIT_TOLERANCE_PX = 8;

// Upper bound on real edges tested against the rays, so dense WFS views
// can't freeze the click that creates the guides.
const MAX_INTERSECTION_EDGES = 20000;

// Extra margin (in pixels) around the view when looking for ray crossings.
const INTERSECTION_VIEW_BUFFER_PX = 50;

// Only the crossings nearest the ray origin are useful as corners.
const MAX_INTERSECTIONS_PER_RAY = 3;

const intersectionStyle = new Style({
  image: new CircleStyle({
    radius: 4,
    stroke: new Stroke({
      color: "rgba(0, 200, 0, 0.9)",
      width: 1.5,
    }),
  }),
});

export default class AngleSnapping {
  #snapGuides;
  #intersectionFeatures;
  #angleSnappingIsActive;
  #allowedTypes;
  #anglesToGenerate;

  #drawModel;
  #map;
  #guideSource;
  #guideLayer;
  #moveEndListenerActive;

  #sketchFeature;
  #sketchGeometry;
  #sketchChangeListener;
  #lastCoordinateCount;
  #replacingGuides;

  constructor(drawModel, map) {
    this.#drawModel = drawModel;
    this.#map = map;
    this.#snapGuides = [];
    this.#intersectionFeatures = [];
    this.#moveEndListenerActive = false;
    this.#angleSnappingIsActive = false;
    // We can only create perpendicular snapping for these types.
    this.#allowedTypes = ["Polygon", "MultiPolygon", "LineString"];
    // The snapping angles
    // Maybe we should be able to configure these in the future
    this.#anglesToGenerate = [0, 90, 180, 270];
    this.#sketchFeature = null;
    this.#sketchGeometry = null;
    this.#sketchChangeListener = null;
    this.#lastCoordinateCount = 0;
    this.#replacingGuides = false;
    this.#createGuideLayer();
  }

  // Guides live in their own layer so they never compete with real features
  // in the draw source. SnapHelper gives "low" snapPriority layers the
  // weakest Snap, so real edges override the guides.
  #createGuideLayer = () => {
    this.#guideSource = new VectorSource({ wrapX: false });
    this.#guideLayer = new VectorLayer({
      source: this.#guideSource,
      layerType: "system",
      ignoreInFeatureInfo: true,
      zIndex: 5001,
      caption: "Angle snapping guides",
    });
    this.#guideLayer.set("snapPriority", "low");
    this.#map.addLayer(this.#guideLayer);
  };

  #handleKeyDownToggle = (e) => {
    this.#angleSnappingIsActive = e.ctrlKey === true || e.metaKey === true;
  };

  setActive = (active) => {
    const fName = active ? "addEventListener" : "removeEventListener";
    window[fName]("keydown", this.#handleKeyDownToggle);
    window[fName]("keyup", this.#handleKeyDownToggle);
    // Measurer calls setActive(true) on every render. Resetting the flag
    // here would forget a Ctrl/Cmd key that is still held.
    if (!active) {
      this.#angleSnappingIsActive = false;
    }
  };

  clearSnapGuides = () => {
    this.#setMoveEndListener(false);
    this.#clearIntersections();
    this.#snapGuides.forEach((guideFeature) => {
      this.#guideSource.removeFeature(guideFeature);
    });
    this.#snapGuides = [];
  };

  #clearIntersections = () => {
    this.#intersectionFeatures.forEach((f) => {
      this.#guideSource.removeFeature(f);
    });
    this.#intersectionFeatures = [];
  };

  #setMoveEndListener = (active) => {
    if (active === this.#moveEndListenerActive) {
      return;
    }
    this.#map[active ? "on" : "un"]("moveend", this.#handleMoveEnd);
    this.#moveEndListenerActive = active;
  };

  // Crossings are only computed for the current view.
  #handleMoveEnd = () => {
    this.#updateIntersections();
  };

  // Called when a sketch is finished or aborted.
  handleDrawEndEvent = () => {
    this.#unbindSketchListener();
    this.clearSnapGuides();
  };

  #unbindSketchListener = () => {
    if (this.#sketchGeometry && this.#sketchChangeListener) {
      this.#sketchGeometry.un("change", this.#sketchChangeListener);
    }
    this.#sketchFeature = null;
    this.#sketchGeometry = null;
    this.#sketchChangeListener = null;
    this.#lastCoordinateCount = 0;
  };

  #bindSketchListener = (feature) => {
    this.#unbindSketchListener();
    const geometry = feature.getGeometry();
    if (!geometry) {
      return;
    }
    this.#sketchFeature = feature;
    this.#sketchGeometry = geometry;
    this.#lastCoordinateCount = this.#getDrawnCoordinates(geometry).length;
    this.#sketchChangeListener = () => {
      this.#handleSketchGeometryChange();
    };
    geometry.on("change", this.#sketchChangeListener);
  };

  // LineString coordinates, or the outer ring while a polygon is being drawn.
  // The last coordinate of a line follows the cursor. A polygon ring also
  // repeats its first coordinate at the end.
  #getDrawnCoordinates = (geometry) => {
    const type = geometry.getType();
    if (type === "LineString") {
      return geometry.getCoordinates();
    }
    if (type === "Polygon") {
      return geometry.getCoordinates()[0] || [];
    }
    return [];
  };

  // The point the user just placed, or null when the geometry change is only
  // the cursor moving or the polygon ring closing. Returns a copy so later
  // cursor updates cannot move the guide origin.
  #newlyCommittedVertex = (geometry) => {
    const coords = this.#getDrawnCoordinates(geometry);
    if (geometry.getType() === "Polygon") {
      // [start, placed vertex, cursor, start] is the first ring that contains
      // a vertex the user actually clicked.
      if (coords.length < 4) {
        return null;
      }
      return coords[coords.length - 3]?.slice() ?? null;
    }
    if (coords.length < 3) {
      return null;
    }
    return coords[coords.length - 2]?.slice() ?? null;
  };

  #handleSketchGeometryChange = () => {
    if (
      this.#replacingGuides ||
      !this.#sketchFeature ||
      !this.#sketchGeometry
    ) {
      return;
    }
    const coords = this.#getDrawnCoordinates(this.#sketchGeometry);
    const count = coords.length;
    if (count < this.#lastCoordinateCount) {
      this.#lastCoordinateCount = count;
      return;
    }
    if (count === this.#lastCoordinateCount) {
      return;
    }
    const committed = this.#newlyCommittedVertex(this.#sketchGeometry);
    this.#lastCoordinateCount = count;
    if (!this.#angleSnappingIsActive || !committed) {
      return;
    }
    // Resolve the hit while the current guides are still on the map.
    const hit = this.#getClickedSegment(this.#sketchFeature, committed);
    if (!hit) {
      return;
    }
    this.#replacingGuides = true;
    try {
      this.#createGuides(committed, hit.segment, hit.highlight);
    } finally {
      this.#replacingGuides = false;
    }
  };

  #lookForSegmentInFeature = (feature, coordinate) => {
    let allCoordinates = this.#drawModel.getFeatureCoordinates(feature);

    let i = 0;
    let clickedSegment = null;

    // If a geometry is too complex we might choke the browser....
    // We'll prevent this by limiting this functionality to more simple geometries.
    const maxSegmentsToCheck = 500; // 500 is still allot....

    // Now it's time to look for the specific clicked segment of the feature we clicked.
    // We'll use the segment later to get the relevant angle.
    while (
      !clickedSegment &&
      i < allCoordinates.length - 1 &&
      i <= maxSegmentsToCheck
    ) {
      const segment = [
        allCoordinates[i],
        allCoordinates[i + 1] || allCoordinates[0], // Handle broken MultiPolygons
      ];

      // getClosestPoint did not work as expected so I used methods from turf
      const foundClickedSegment = booleanPointOnLine(
        coordinate,
        new TurfLineString(segment),
        {
          ignoreEndVertices: false,
          epsilon: 0.001, // I got no matches without a value here (hitTolerance/fuzziness)
        }
      );

      if (foundClickedSegment) {
        clickedSegment = [segment[0].slice(), segment[1].slice()];
      }

      i++;
    }
    return clickedSegment;
  };

  #distanceToSegmentPx = (segment, coordinate) => {
    const px = this.#map.getPixelFromCoordinate(coordinate);
    const closestPx = this.#map.getPixelFromCoordinate(
      new LineString(segment).getClosestPoint(coordinate)
    );
    if (!px || !closestPx) {
      return Infinity;
    }
    return Math.hypot(px[0] - closestPx[0], px[1] - closestPx[1]);
  };

  // Real drawn features win over the green guides when both are under the cursor.
  #findRealSegment = (measureFeature, coordinate) => {
    const px = this.#map.getPixelFromCoordinate(coordinate);
    if (!px) {
      return null;
    }
    const clickedFeatures = this.#map
      .getFeaturesAtPixel(px, {
        hitTolerance: 0,
      })
      .filter((f) => {
        const geometry = f.getGeometry();
        if (!geometry || f === measureFeature) {
          return false;
        }
        // Guides are resolved separately so a click on a green ray can chain.
        if (f.get("USER_MEASUREMENT_GUIDE") === true) {
          return false;
        }
        return this.#allowedTypes.includes(geometry.getType());
      });

    for (let i = 0; i < clickedFeatures.length; i++) {
      const clickedSegment = this.#lookForSegmentInFeature(
        clickedFeatures[i],
        coordinate
      );
      if (clickedSegment) {
        return clickedSegment;
      }
    }
    return null;
  };

  // Pick the guide line closest to the click. Rays meet at the origin, so the
  // first match would be ambiguous there.
  #findGuideSegment = (coordinate) => {
    let best = null;
    let bestDistance = Infinity;
    for (let g = 0; g < this.#snapGuides.length; g++) {
      const guide = this.#snapGuides[g];
      const coordinates = guide.getGeometry()?.getCoordinates();
      if (!coordinates || coordinates.length < 2) {
        continue;
      }
      for (let i = 0; i < coordinates.length - 1; i++) {
        const segment = [coordinates[i], coordinates[i + 1]];
        const distance = this.#distanceToSegmentPx(segment, coordinate);
        if (distance <= GUIDE_HIT_TOLERANCE_PX && distance < bestDistance) {
          bestDistance = distance;
          best = {
            segment: [segment[0].slice(), segment[1].slice()],
            // A ray is the previous snap guide. Highlighting it would redraw
            // that long line. Only highlight a real segment.
            highlight: guide.get("ANGLE_SNAP_RAY") !== true,
          };
        }
      }
    }
    return best;
  };

  #getClickedSegment = (measureFeature, coordinate) => {
    const realSegment = this.#findRealSegment(measureFeature, coordinate);
    if (realSegment) {
      return { segment: realSegment, highlight: true };
    }
    return this.#findGuideSegment(coordinate);
  };

  #createGuides = (coord, clickedSegment, highlightOwner) => {
    this.clearSnapGuides();

    const guides = [];

    if (highlightOwner) {
      this.#addOwnerHighlight(clickedSegment, guides);
    }

    this.#addRays(coord, clickedSegment, guides);
    this.#snapGuides = guides;
    this.#updateIntersections();
    this.#setMoveEndListener(true);
  };

  #getRays = () => {
    return this.#snapGuides.filter((f) => f.get("ANGLE_SNAP_RAY") === true);
  };

  // Edges of real features (drawn or WFS) in the given extent, across all
  // visible vector layers except the guides themselves.
  #collectRealEdges = (extent) => {
    const edges = [];
    const layers = this.#map
      .getAllLayers()
      .filter(
        (l) =>
          l !== this.#guideLayer &&
          l.getVisible() &&
          typeof l.getSource?.()?.getFeatures === "function"
      );
    for (const layer of layers) {
      if (edges.length >= MAX_INTERSECTION_EDGES) {
        break;
      }
      layer.getSource().forEachFeatureInExtent(extent, (feature) => {
        if (
          feature.get("USER_MEASUREMENT_GUIDE") === true ||
          feature.get("SNAP_IGNORE") === true
        ) {
          return;
        }
        const geometry = feature.getGeometry();
        if (!geometry || geometry.getType() === "Point") {
          return;
        }
        edges.push(...getGeometryEdges(geometry));
        // Returning a truthy value stops forEachFeatureInExtent.
        return edges.length >= MAX_INTERSECTION_EDGES;
      });
    }
    return edges.slice(0, MAX_INTERSECTION_EDGES);
  };

  // Points where a ray crosses a real edge become guide points. In the guide
  // Snap a point counts as a vertex, which beats an edge, so the cursor jumps
  // to the crossing. The real Snap then keeps it since it is on its edge.
  #updateIntersections = () => {
    this.#clearIntersections();
    const rays = this.#getRays();
    const view = this.#map.getView();
    const resolution = view.getResolution();
    const size = this.#map.getSize();
    if (rays.length === 0 || !resolution || !size) {
      return;
    }

    const extent = buffer(
      view.calculateExtent(size),
      INTERSECTION_VIEW_BUFFER_PX * resolution
    );
    const edges = this.#collectRealEdges(extent);
    if (edges.length === 0) {
      return;
    }

    // Crossings closer than this are treated as the same point.
    const tolerance = resolution * 0.5;
    const seen = new Set();
    const features = [];

    for (const ray of rays) {
      const [origin, end] = ray.getGeometry().getCoordinates();
      const candidates = [];
      for (const [edgeStart, edgeEnd] of edges) {
        const point = segmentIntersection(origin, end, edgeStart, edgeEnd);
        if (!point || !containsCoordinate(extent, point)) {
          continue;
        }
        const distance = Math.hypot(point[0] - origin[0], point[1] - origin[1]);
        if (distance >= tolerance) {
          candidates.push({ point, distance });
        }
      }
      candidates.sort((a, b) => a.distance - b.distance);

      let kept = 0;
      for (const { point } of candidates) {
        if (kept >= MAX_INTERSECTIONS_PER_RAY) {
          break;
        }
        const key = `${Math.round(point[0] / tolerance)}:${Math.round(
          point[1] / tolerance
        )}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        kept++;

        const feature = new Feature({ geometry: new Point(point) });
        feature.setStyle(intersectionStyle);
        feature.set("USER_MEASUREMENT_GUIDE", true);
        feature.set("ANGLE_SNAP_INTERSECTION", true);
        features.push(feature);
      }
    }

    if (features.length > 0) {
      this.#guideSource.addFeatures(features);
      this.#intersectionFeatures = features;
    }
  };

  #addOwnerHighlight = (clickedSegment, guides) => {
    const segmentLine = new LineString(clickedSegment);

    // Lets add a nice line on top of the segment
    // to highlight the "owner" segment. Kind of like a selection.
    const segmentStroke = new Stroke({
      color: "rgba(53, 156, 40, 0.2)",
      width: 7,
    });
    const segmentFeature = new Feature({
      geometry: segmentLine,
    });
    segmentFeature.setStyle(
      new Style({
        stroke: segmentStroke,
      })
    );
    // Mark as measurement guide so it's not treated as a user-drawn feature
    segmentFeature.set("USER_MEASUREMENT_GUIDE", true);

    this.#guideSource.addFeature(segmentFeature);
    guides.push(segmentFeature);
  };

  #addRays = (coord, clickedSegment, guides) => {
    const angleRadians = Math.atan2(
      clickedSegment[0][0] - clickedSegment[1][0],
      clickedSegment[0][1] - clickedSegment[1][1]
    );

    // We'll use this style for all added snapping lines.
    const guideStyle = new Style({
      stroke: new Stroke({
        color: "rgba(0, 255, 0, 0.5)",
        lineDash: null, // Warning! Adding lineDash here makes this sooooooo slow.
        width: 1,
      }),
    });

    this.#anglesToGenerate.forEach((angle) => {
      angle = (angle * Math.PI) / 180; // Degrees to radians
      let targetX = coord[0] + 100000 * Math.cos(angle);
      let targetY = coord[1] + 100000 * Math.sin(angle);
      let guideLine = new LineString([
        [coord[0], coord[1]],
        [targetX, targetY],
      ]);
      guideLine.rotate(-angleRadians, coord);
      let feature = new Feature({
        geometry: guideLine,
      });
      feature.setStyle(guideStyle);

      guides.push(feature);
      feature.set("USER_MEASUREMENT_GUIDE", true);
      feature.set("ANGLE_SNAP_RAY", true);
      this.#guideSource.addFeature(feature);
    });
  };

  handleDrawStartEvent = (drawStartEvent) => {
    this.#unbindSketchListener();

    const measureFeature = drawStartEvent.feature;
    const featureType = measureFeature?.getGeometry()?.getType();
    const canSnap =
      Boolean(measureFeature) && this.#allowedTypes.includes(featureType);

    if (!canSnap) {
      this.clearSnapGuides();
      return;
    }

    if (this.#angleSnappingIsActive) {
      // Look up before clearing so a click on an existing green guide can
      // start the next set of guides.
      const coord = this.#drawModel
        .getFeatureCoordinates(measureFeature)[0]
        ?.slice();
      const hit = coord ? this.#getClickedSegment(measureFeature, coord) : null;
      this.clearSnapGuides();
      if (coord && hit) {
        this.#createGuides(coord, hit.segment, hit.highlight);
      }
    } else {
      this.clearSnapGuides();
    }

    this.#bindSketchListener(measureFeature);
  };
}

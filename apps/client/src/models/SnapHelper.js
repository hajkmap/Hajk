import Snap from "ol/interaction/Snap";
import Overlay from "ol/Overlay";
import LocalStorageHelper from "../utils/LocalStorageHelper";

const DISABLE_KEY = "space";
const STORAGE_KEY = "sketch";
const DEFAULT_PIXEL_TOLERANCE = 10;

export default class SnapHelper {
  constructor(app) {
    this.map = app.map;
    this.globalObserver = app.globalObserver;

    this.snapInteractions = []; // Will hold snap interactions

    // Initiate a new set that will hold active plugins
    this.activePlugins = new Set();

    // Initiate a variable that keeps track of pending updates
    this.updatePending = false;

    // Read snap settings from localStorage
    const savedSettings = LocalStorageHelper.get(STORAGE_KEY) || {};
    this.pixelTolerance =
      savedSettings.snapTolerance ?? DEFAULT_PIXEL_TOLERANCE;
    this.snapEnabled = savedSettings.snapEnabled ?? true;

    // Snap tracking state (for visual feedback on pointermove)
    this.pointerMoveHandler = null;
    this.snappedCoordinate = null;
    this.snapOverlay = null;
    this.isTracking = false;

    // When layer visibility is changed, check if there was a
    // vector source. If so, refresh the snap interactions to
    // reflect the visibility change.
    this.globalObserver.on(
      "core.layerVisibilityChanged",
      this.#handleLayerVisibilityChanged
    );

    // Add key listeners to disable/enable snapping via the spacebar
    document.addEventListener("keydown", this.#handleKeyDown);
    document.addEventListener("keyup", this.#handleKeyUp);
  }
  /**
   * @summary Sets the pixel tolerance for snap interactions.
   * @description Updates the pixel tolerance and refreshes all snap interactions.
   *
   * @param {number} tolerance - The pixel tolerance value
   * @memberof SnapHelper
   */
  setPixelTolerance(tolerance) {
    this.pixelTolerance = tolerance;
    // Refresh snap interactions if there are active plugins
    if (this.activePlugins.size > 0) {
      this.#removeAllSnapInteractions();
      this.#addSnapToAllVectorSources();
    }
  }

  /**
   * @summary Enables or disables snapping.
   * @description When disabled, all snap interactions are removed.
   * When enabled, snap interactions are added if there are active plugins.
   *
   * @param {boolean} enabled - Whether snapping should be enabled
   * @memberof SnapHelper
   */
  setSnapEnabled(enabled) {
    this.snapEnabled = enabled;
    if (enabled && this.activePlugins.size > 0) {
      this.#addSnapToAllVectorSources();
    } else if (!enabled) {
      this.#removeAllSnapInteractions();
    }
  }

  /**
   * @summary Adds a given plugin to the set of plugins interested of
   * snap interaction. As long as this set isn't empty, Snap helper knows
   * that interactions should be added.
   *
   * @param {string} plugin
   * @memberof SnapHelper
   */
  add(plugin) {
    // If this is the first plugin that wants to activate Snap,
    // ensure that we add the interactions to map (only if snap is enabled).
    // Else, they've already been added and there's no need to do it again.
    this.activePlugins.size === 0 &&
      this.snapEnabled &&
      this.#addSnapToAllVectorSources();

    // Add the plugin to our stack
    this.activePlugins.add(plugin);
  }
  /**
   * @summary Does the opposite of add() by deleting a plugin from the Set.
   * When the set is empty, Snap helper knows that no one is interested in snapping
   * anyway, and it can remove all snap interactions (when the last plugin leaves the list).
   *
   * @param {string} plugin
   * @memberof SnapHelper
   */
  delete(plugin) {
    this.activePlugins.delete(plugin);

    // If there are no active plugins left, remove interactions
    this.activePlugins.size === 0 && this.#removeAllSnapInteractions();
  }

  /**
   * @summary Snaps a coordinate to the nearest vertex of visible vector features.
   * @description This is useful for click handlers that don't use OL Draw/Modify
   * interactions (which have automatic snapping). Returns the snapped coordinate
   * if a vertex is found within pixel tolerance, otherwise returns the original.
   *
   * @param {number[]} coordinate - The coordinate [x, y] to snap
   * @param {ol.Feature} [excludeFeature] - Optional feature to exclude from snapping
   * @returns {number[]} The snapped coordinate, or original if no snap target found
   * @memberof SnapHelper
   */
  snapCoordinate(coordinate, excludeFeature = null) {
    if (!this.snapEnabled) {
      return coordinate;
    }

    const pixel = this.map.getPixelFromCoordinate(coordinate);
    let closestPoint = null;
    let closestDistanceSq = Infinity;

    // Get all visible vector layers (including those nested in LayerGroups)
    const layers = this.map
      .getAllLayers()
      .filter((l) => l.getVisible() && this.#isVectorSource(l.getSource?.()));

    for (const layer of layers) {
      const source = layer.getSource();
      const features = source.getFeatures();

      for (const feature of features) {
        // Skip excluded feature (e.g., the feature being drawn)
        if (excludeFeature && feature === excludeFeature) continue;

        const geometry = feature.getGeometry();
        if (!geometry) continue;

        // Check vertices first (they have priority)
        const vertices = this.#getGeometryVertices(geometry);
        for (const vertexCoord of vertices) {
          const vertexPixel = this.map.getPixelFromCoordinate(vertexCoord);
          const dx = vertexPixel[0] - pixel[0];
          const dy = vertexPixel[1] - pixel[1];
          const distanceSq = dx * dx + dy * dy;

          if (distanceSq < closestDistanceSq) {
            closestDistanceSq = distanceSq;
            closestPoint = vertexCoord;
          }
        }

        // Also check edges (lines between vertices)
        const edges = this.#getGeometryEdges(geometry);
        for (const [segStart, segEnd] of edges) {
          const edgePoint = this.#closestPointOnSegment(
            coordinate,
            segStart,
            segEnd
          );
          const edgePixel = this.map.getPixelFromCoordinate(edgePoint);
          const dx = edgePixel[0] - pixel[0];
          const dy = edgePixel[1] - pixel[1];
          const distanceSq = dx * dx + dy * dy;

          if (distanceSq < closestDistanceSq) {
            closestDistanceSq = distanceSq;
            closestPoint = edgePoint;
          }
        }
      }
    }

    // Return snapped coordinate if within tolerance
    const toleranceSq = this.pixelTolerance * this.pixelTolerance;
    return closestPoint && closestDistanceSq <= toleranceSq
      ? closestPoint
      : coordinate;
  }

  /**
   * @summary Starts tracking pointer movement for snap visual feedback.
   * @description Creates a visual overlay that shows where the snap will occur
   * and updates it as the user moves the mouse. Use getSnappedCoordinate() to
   * get the current snapped coordinate when the user clicks.
   *
   * @memberof SnapHelper
   */
  startSnapTracking() {
    if (this.isTracking) return;

    // Create the snap indicator element (same style as fixed length cursor)
    const element = document.createElement("div");
    element.style.cssText = `
      width: 14px;
      height: 14px;
      background: rgba(255, 0, 0, 0.9);
      border: 2px solid rgba(255, 255, 255, 1);
      border-radius: 50%;
      pointer-events: none;
      box-shadow: 0 0 6px rgba(0,0,0,0.6);
    `;

    // Create the overlay
    this.snapOverlay = new Overlay({
      element: element,
      positioning: "center-center",
      stopEvent: false,
    });
    this.map.addOverlay(this.snapOverlay);
    this.snapOverlay.setPosition(undefined); // Hidden initially

    // Create the pointermove handler
    this.pointerMoveHandler = (event) => {
      // Skip if dragging
      if (event.dragging) return;

      if (!this.snapEnabled) {
        // Show indicator at mouse position when snap is disabled
        this.snappedCoordinate = null;
        this.snapOverlay?.setPosition(event.coordinate);
        return;
      }

      const snapped = this.snapCoordinate(event.coordinate);
      const didSnap =
        snapped[0] !== event.coordinate[0] ||
        snapped[1] !== event.coordinate[1];

      if (didSnap) {
        // Show indicator at snap position (the "jump" effect)
        this.snappedCoordinate = snapped;
        this.snapOverlay?.setPosition(snapped);
      } else {
        // Show indicator at mouse position when not snapping
        this.snappedCoordinate = null;
        this.snapOverlay?.setPosition(event.coordinate);
      }
    };

    this.map.on("pointermove", this.pointerMoveHandler);
    this.isTracking = true;
  }

  /**
   * @summary Stops tracking pointer movement and removes the snap indicator.
   * @memberof SnapHelper
   */
  stopSnapTracking() {
    if (!this.isTracking) return;

    // Remove pointermove listener
    if (this.pointerMoveHandler) {
      this.map.un("pointermove", this.pointerMoveHandler);
      this.pointerMoveHandler = null;
    }

    // Remove overlay
    if (this.snapOverlay) {
      this.map.removeOverlay(this.snapOverlay);
      this.snapOverlay = null;
    }

    this.snappedCoordinate = null;
    this.isTracking = false;
  }

  /**
   * @summary Gets the current snapped coordinate from pointer tracking.
   * @description Returns the snapped coordinate if the pointer is currently
   * near a vertex, otherwise returns null.
   *
   * @returns {number[]|null} The snapped coordinate or null
   * @memberof SnapHelper
   */
  getSnappedCoordinate() {
    return this.snappedCoordinate;
  }

  /**
   * @summary Extracts all vertex coordinates from a geometry.
   * @param {ol.geom.Geometry} geometry
   * @returns {number[][]} Array of coordinates
   */
  #getGeometryVertices = (geometry) => {
    const type = geometry.getType();
    let coords = [];

    switch (type) {
      case "Point":
        coords = [geometry.getCoordinates()];
        break;
      case "LineString":
        coords = geometry.getCoordinates();
        break;
      case "Polygon":
        geometry.getCoordinates().forEach((ring) => coords.push(...ring));
        break;
      case "MultiPoint":
        coords = geometry.getCoordinates();
        break;
      case "MultiLineString":
        geometry.getCoordinates().forEach((line) => coords.push(...line));
        break;
      case "MultiPolygon":
        geometry
          .getCoordinates()
          .forEach((polygon) =>
            polygon.forEach((ring) => coords.push(...ring))
          );
        break;
      default:
        break;
    }

    return coords;
  };

  /**
   * @summary Extracts all line segments (edges) from a geometry.
   * @param {ol.geom.Geometry} geometry
   * @returns {Array<[number[], number[]]>} Array of line segments [start, end]
   */
  #getGeometryEdges = (geometry) => {
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
   * @summary Finds the closest point on a line segment to a given point.
   * @param {number[]} point - The point [x, y]
   * @param {number[]} segStart - Start of segment [x, y]
   * @param {number[]} segEnd - End of segment [x, y]
   * @returns {number[]} The closest point on the segment
   */
  #closestPointOnSegment = (point, segStart, segEnd) => {
    const dx = segEnd[0] - segStart[0];
    const dy = segEnd[1] - segStart[1];
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) {
      // Segment is a point
      return segStart;
    }

    // Calculate projection of point onto line (as parameter t)
    const t = Math.max(
      0,
      Math.min(
        1,
        ((point[0] - segStart[0]) * dx + (point[1] - segStart[1]) * dy) /
          lengthSq
      )
    );

    // Return the closest point on the segment
    return [segStart[0] + t * dx, segStart[1] + t * dy];
  };
  /**
   * @summary Helper used to determine if a given source is ol.VectorSource.
   * @description Ideally, we would look into the prototype, to see if
   * constructor.name is "VectorSource". But, because Webpack uglifies the
   * class names, we can't do that. This is the best I came up with regarding
   * finding out whether the source appears to be a vector source or not: we
   * look for the getFeatures() method. It only exists on vector sources, so
   * it should be safe to use this way.
   *
   * @param {object} source
   * @returns {*} isVectorSource
   */
  #isVectorSource = (source) => {
    return source && typeof source["getFeatures"] === "function";
  };

  /**
   * @summary Called when a layer's visibility is changed. Ensures that
   * snapping is always enabled for all visible vector sources.
   *
   * @param {*} e Event that contains the layer who's visibility has changed.
   */
  #handleLayerVisibilityChanged = (e) => {
    if (
      this.activePlugins.size === 0 || // Abort if no plugin is interested of snap interactions
      this.updatePending === true || // Abort if there already is a pending update
      this.#isVectorSource(e.target.getSource()) === false // Abort if event was triggered on a non-vector source
    )
      return;

    // Switch the pending flag to true, this will avoid multiple invokations
    this.updatePending = true;

    // After 250 ms…
    setTimeout(() => {
      // Reload sources
      this.#removeAllSnapInteractions();
      this.#addSnapToAllVectorSources();
      // Reset the flag
      this.updatePending = false;
    }, 250);
  };

  /**
   * @summary Handles keydown events; turns off snapping if the disable key is pressed.
   *
   * @param {KeyboardEvent} e
   */
  #handleKeyDown = (e) => {
    if (e.code.toLowerCase() === DISABLE_KEY) {
      if (this.snapInteractions.length > 0) {
        this.#removeAllSnapInteractions();
      }
    }
  };

  /**
   * @summary Handles keyup events; re-enables snapping on disable key release if needed.
   *
   * @param {KeyboardEvent} e
   */
  #handleKeyUp = (e) => {
    if (e.code.toLowerCase() === DISABLE_KEY) {
      if (this.activePlugins.size > 0 && this.snapInteractions.length === 0) {
        this.#addSnapToAllVectorSources();
      }
    }
  };

  #addSnapToAllVectorSources = () => {
    const vectorSources = this.map
      .getAllLayers() // Get all layers (including nested in LayerGroups)
      .filter((l) => l.getVisible()) // and only currently visible.
      .map((l) => l.getSource()) // Get each layer's source
      .filter(this.#isVectorSource); // but only if it is a VectorSource (which we'll know by checking for "getFeatures").

    // Add the snap interaction for each found source
    vectorSources.forEach((source) => {
      const snap = new Snap({
        source,
        pixelTolerance: this.pixelTolerance,
      });
      this.map.addInteraction(snap);

      // And save each interaction into a local stack (so we can remove them later)
      this.snapInteractions.push(snap);
    });
  };

  #removeAllSnapInteractions = () => {
    if (this.snapInteractions.length === 0) return;

    // Loop through the local stack of snap interactions
    for (const i of this.snapInteractions) {
      // And remove each one of them from the map
      this.map.removeInteraction(i);
    }

    // Important: purge the local stack!
    this.snapInteractions = [];
  };
}

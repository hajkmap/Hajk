import { Style, Text } from "ol/style";
import { Feature } from "ol";
import { LineString, Point, Polygon } from "ol/geom";

export default class Segment {
  #enabled;
  #drawModel;
  #currentSegmentLength;
  #polygonFirstAndLast;
  #currentCenter;
  #measureFeature;
  #map;
  #currentFeatureSavedId;
  #currentPoint;

  constructor(drawModel, map, enabled) {
    this.#enabled = enabled ?? false;
    this.#drawModel = drawModel;
    this.#currentSegmentLength = null;
    this.#polygonFirstAndLast = [];
    this.#currentCenter = null;
    this.#measureFeature = { type: "LineString", numCoordinates: 0 };
    this.#map = map;
    this.#currentFeatureSavedId = null;
    this.#currentPoint = null;
  }

  setEnabled = (enabled) => {
    this.#enabled = enabled;
  };

  setLastPlacedFeatureId = (id) => {
    // Due to timing we cant assign the points to the feature id before the feature is complete.
    // We need to save them and update them at a later time to be able to also remove them when
    // the feature is removed.
    this.#currentFeatureSavedId = id;
    // Update the saved points to reference this feature with MEASUREMENT_ID
    this.#updateMeasurementReferences();
  };

  // Useful to remove the extra points created by "double clicks" for ending the measurement.
  #allreadyExists = (coordinate) => {
    let exists = false;
    // Get all user drawn measurements that are not parents, ie only the segment points.
    const allDrawnFeatures = this.#drawModel
      .getAllDrawnFeatures()
      .filter(
        (f) => f.get("USER_DRAWN") === true && !f.get("MEASUREMENT_PARENT")
      );
    // If we find a point with the same coordinate as the one we are checking, return true.
    allDrawnFeatures.forEach((f) => {
      if (
        JSON.stringify(f.getGeometry().getCoordinates()) ===
        JSON.stringify(coordinate)
      ) {
        exists = true;
      }
    });
    return exists;
  };

  #formatLength = (line) => {
    const length = line.getLength();
    let output;
    if (length > 1000) {
      // Convert and format the length to 1 decimal rounded up if longer than 1 km
      output = Math.round((length / 1000) * 10) / 10 + " km";
    } else {
      // Otherwise show meters with 1 decimal
      output = Math.round(length * 100) / 100 + " m";
    }
    return output;
  };

  #updateMeasurementReferences = () => {
    // Update the source features
    const allDrawnFeatures = this.#drawModel
      .getAllDrawnFeatures()
      .filter((f) => f.get("USER_DRAWN") === true);
    allDrawnFeatures.forEach((f) => {
      if (f.getGeometry().getType() === "Point") {
        const featureWithMeasurementId = f.get("MEASUREMENT_ID");
        // Check that the feature has the correct attribute, and that it allready belongs to another feature.
        if (
          featureWithMeasurementId &&
          !featureWithMeasurementId.includes("-")
        ) {
          const childID = f.get("MEASUREMENT_ID");
          // We prefix these segment points with the measured objects MEASUREMENT_ID, and check that it's not a parent.
          if (
            childID !== this.#currentFeatureSavedId &&
            !f.get("MEASUREMENT_PARENT")
          ) {
            f.set(
              "MEASUREMENT_ID",
              this.#currentFeatureSavedId + "-" + childID
            );
          }
        }
      }
    });
  };

  #applyTextStyle = (length) => {
    // Setting font to italic, underline styling not possible with RichText
    return [`${length}`, "italic 11px Roboto, Helvetica, Arial, sans-serif"];
  };

  #createPoint = () => {
    // Dont create point if the currentCenter is not set
    if (this.#currentCenter !== null) {
      // Check if this coordinate allready has a measurement, the
      if (!this.#allreadyExists(this.#currentCenter)) {
        const segmentPoint = new Point(this.#currentCenter);
        const id = Math.random().toString(36).substring(2, 15);
        const f = new Feature({
          geometry: segmentPoint,
        });
        // Generate a random ID for the feature
        f.setId(id);
        // Create the style and set the features parameters
        const segmentPointStyle = new Style({
          // Indicate that we are using text.
          text: new Text(),
          zIndex: 5000,
        });
        f.setStyle(segmentPointStyle);
        f.set("EXTRACTED_STYLE", this.#drawModel.extractFeatureStyleInfo(f));
        f.set("DRAW_METHOD", "Text");
        f.set("USER_DRAWN", true);
        f.set("MEASUREMENT_ID", id);
        // Assign the measured and formatted length of the segment
        f.set("USER_TEXT", this.#applyTextStyle(this.#currentSegmentLength));
        f.set("TEXT_SETTINGS", {
          backgroundColor: "#000000",
          foregroundColor: "#FFFFFF",
          // size: 10,
        });

        this.#currentPoint = f.clone();
        // Draw the point
        this.#drawModel.addFeature(f);
      }
    }
  };

  #handleSingleClick = (e) => {
    // Dont place a point until we have more than 2 coordinates in the LineString measurement.
    // Or 3 coordinates if we measure a Polygon.
    if (
      (this.#measureFeature.type === "LineString" &&
        this.#measureFeature.numCoordinates > 2) ||
      (this.#measureFeature.type === "Polygon" &&
        this.#measureFeature.numCoordinates > 3)
    ) {
      this.#createPoint();
    }
  };

  handleDrawStartEvent = (e) => {
    // Do nothing if segments is not enabled
    if (!this.#enabled) {
      return;
    }

    const feature = e.feature;
    const geometry = feature.getGeometry();
    // We only handle LineString and Polygon
    if (!(geometry instanceof LineString || geometry instanceof Polygon)) {
      return;
    }

    this.#map.getViewport().addEventListener("click", this.#handleSingleClick);
    // Forward the change event
    feature.on("change", this.#handleFeatureChange);
  };

  handleDrawEndEvent = (e) => {
    const feature = e.feature;
    const geometry = feature.getGeometry();
    const type = geometry.getType();
    // When measuring a Polygon we need to measure the last segment that we saved
    if (type === "Polygon") {
      if (
        this.#measureFeature.type === "Polygon" &&
        this.#measureFeature.numCoordinates > 1
      ) {
        this.#findCenterPoint(this.#polygonFirstAndLast, Polygon);
        // Check that we found a centerpoint for the last segment in the polygon.
        // Also handle the case if you start measuring a polygon and hit esc, resulting
        // in a 0 measurement length.
        if (
          this.#currentCenter.length > 0 &&
          this.#currentSegmentLength !== "0 m"
        ) {
          this.#createPoint();
        }
      }
    }
    // If we measured a LineString and only have one segment, remove that measurement point,
    // the total tooltip from DrawModel would overlap otherwise and shows the same length anyway.
    // Also dont run the remove if there is only 1 coord.
    if (
      this.#enabled &&
      type === "LineString" &&
      geometry.getCoordinates().length <= 2
    ) {
      // The geometry should have more than one coordinate to be removed, otherwise it probably wasnt added.
      // In the case of LineString and Polygon.
      if (geometry.getCoordinates().length > 1) {
        // Remove the segment point.
        this.#drawModel.removeFeature(this.#currentPoint);
      }
    }

    // Cleanup and reset
    this.#currentCenter = null;
    this.#currentSegmentLength = null;
    this.#polygonFirstAndLast = [];
    this.#currentFeatureSavedId = null;
    this.#measureFeature = {
      type: this.#measureFeature.type,
      numCoordinates: 0,
    };
    this.#currentPoint = null;
    // Remove the click listener
    this.#map
      .getViewport()
      .removeEventListener("click", this.#handleSingleClick);
  };

  #findCenterPoint = (coords, type) => {
    let measurementLineString;
    if (type === LineString) {
      // Remove the last element in the coordinates array since we only are
      // interested in the last drawn segment
      coords.pop();
      if (coords.length >= 2) {
        measurementLineString = new LineString([
          coords[coords.length - 1],
          coords[coords.length - 2],
        ]);
        this.#currentSegmentLength = this.#formatLength(measurementLineString);
        this.#currentCenter = measurementLineString.getCoordinateAt(0.5);
      }
    } else if (type === Polygon) {
      if (coords.length > 3) {
        measurementLineString = new LineString([
          coords[coords.length - 3],
          coords[coords.length - 4],
        ]);
        this.#currentSegmentLength = this.#formatLength(measurementLineString);
      } else {
        measurementLineString = new LineString([
          coords[coords.length - 1],
          coords[coords.length - 2],
        ]);
        this.#currentSegmentLength = this.#formatLength(measurementLineString);
      }
      this.#currentCenter = measurementLineString.getCoordinateAt(0.5);
    }
  };

  #handleFeatureChange = (e) => {
    const feature = e.target;
    const geometry = feature.getGeometry();
    let allCoordinates;
    if (geometry instanceof LineString) {
      allCoordinates = geometry.getCoordinates();
      this.#measureFeature = {
        type: "LineString",
        numCoordinates: allCoordinates.length,
      };
      this.#findCenterPoint(allCoordinates, LineString);
    } else if (geometry instanceof Polygon) {
      allCoordinates = geometry.getCoordinates()[0];
      this.#measureFeature = {
        type: "Polygon",
        numCoordinates: allCoordinates.length,
      };
      // Store the last point to use when the drawEnd is triggered
      this.#polygonFirstAndLast = [
        allCoordinates[allCoordinates.length - 1],
        allCoordinates[allCoordinates.length - 2],
      ];
      this.#findCenterPoint(allCoordinates, Polygon);
    }
  };
}

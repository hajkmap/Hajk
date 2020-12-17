import { transform } from "ol/proj";
import Feature from "ol/Feature";
import Vector from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Point from "ol/geom/Point.js";
import Draw from "ol/interaction/Draw.js";
import { Circle as CircleStyle, Fill, Stroke, Style, Icon } from "ol/style";

class CoordinatesModel {
  constructor(settings) {
    this.app = settings.app;
    this.map = settings.map;
    this.localObserver = settings.localObserver;

    this.coordinates = undefined;
    this.transformations = settings.options.transformations;

    this.source = new VectorSource();
    this.vector = new Vector({
      source: this.source,
      name: "coordinateLayer",
    });
    this.map.addLayer(this.vector);
  }

  activate() {
    this.addInteraction();
    this.localObserver.publish("showSnackbar");
  }

  deactivate() {
    this.removeInteraction();
    this.vector.getSource().clear();

    this.localObserver.publish("hideSnackbar");
    this.localObserver.publish("setTransformedCoordinates", []);
  }

  /**
   * @summary Removes any previous markers and adds a new one to the given coordinates.
   * @memberof CoordinatesModel
   */
  addMarker = (coordinates) => {
    // Prepare the feature
    const feature = new Feature({
      geometry: new Point(coordinates),
    });

    // Style it with a nice icon
    const styleMarker = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        scale: 0.15,
        src: "marker.png",
      }),
    });
    feature.setStyle(styleMarker);

    // Remove any previous markers
    this.vector.getSource().clear();

    // Add the new marker
    this.source.addFeature(feature);
  };

  transform(coordinates, to) {
    const from = this.map.getView().getProjection();
    return transform(coordinates, from, to);
  }

  /**
   * @summary When draw has ended, get the coordinates for the point
   * drawn and add a marker to those coordinates.
   *
   * @memberof CoordinatesModel
   */
  handleDrawEnd = (e) => {
    // Grab coordinates from the Point that has been drawn
    this.coordinates = e.feature.getGeometry().getCoordinates();

    // Add a nice marker to those coordinates
    this.addMarker(this.coordinates);

    let transformedCoordinates;

    if (this.transformations.length > 0) {
      // If there are defined transformations, loop through them
      transformedCoordinates = this.transformations.map((transformation) => {
        const container = {};

        container.code = transformation.code ?? "";
        container.precision = transformation.precision ?? 3;
        container.default = transformation.default ?? false;
        container.hint = transformation.hint ?? "";
        container.title = transformation.title ?? "";
        container.xtitle = transformation.xtitle ?? "";
        container.ytitle = transformation.ytitle ?? "";
        container.inverseAxis = transformation.inverseAxis ?? false;
        container.coordinates =
          this.transform(this.coordinates, transformation.code) ?? "";

        return container;
      });
    } else {
      // If no transformations are defined, fall back to default WGS84
      transformedCoordinates = [
        {
          code: "EPSG:4326",
          precision: 3,
          default: false,
          hint: "",
          title: "WGS84",
          xtitle: "Lng",
          ytitle: "Lat",
          inverseAxis: true,
          coordinates: this.transform(this.coordinates, "EPSG:4326"),
        },
      ];
    }

    // Limit decimals to 3 by default
    for (const [i, v] of transformedCoordinates.entries()) {
      transformedCoordinates[i].coordinates[0] = v.coordinates[0].toFixed(
        v.precision
      );
      transformedCoordinates[i].coordinates[1] = v.coordinates[1].toFixed(
        v.precision
      );
    }

    // Notify the View of the new coordinates
    this.localObserver.publish(
      "setTransformedCoordinates",
      transformedCoordinates
    );
  };

  addInteraction() {
    this.draw = new Draw({
      source: this.source,
      type: "Point",
      style: new Style({
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.7)",
          }),
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)",
          }),
        }),
      }),
    });
    this.draw.on("drawend", this.handleDrawEnd);
    this.map.addInteraction(this.draw);
    this.map.clickLock.add("coordinates");

    // Add snap interactions AFTER measure source has been added
    // this will allow us to snap to the newly added source too
    this.map.snapHelper.add("coordinates");
  }

  removeInteraction() {
    this.map.snapHelper.delete("coordinates");
    this.map.removeInteraction(this.draw);
    this.map.clickLock.delete("coordinates");
  }
}

export default CoordinatesModel;

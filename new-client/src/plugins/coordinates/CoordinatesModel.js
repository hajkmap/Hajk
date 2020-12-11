import { get as getProjection, transform } from "ol/proj";
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

    this.updateTransforms();
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

  handleInput = (event) => {
    // Gets the transform that was specified on the TextField
    // it is used to transform the coordinates to the map projection which is the one updateTransforms expects
    var transformCode =
      event.target.parentElement.parentElement.attributes["transform"].value;
    // Gets the axis so we can know whether this is for the X or Y axis
    var axis =
      event.target.parentElement.parentElement.attributes["axis"].value;
    var updatedCoordinates =
      axis === "X" ? [event.target.value, 0] : [0, event.target.value];

    // We need to look in grand grand parent's children to find the other input field and pick the one
    // which does not have the same transform. From there, we can get the other input field
    event.target.parentElement.parentElement.parentElement.children.forEach(
      (item) => {
        if (axis !== item.attributes["axis"].value) {
          // Index to update
          var idx = item.attributes["axis"].value === "X" ? 0 : 1;

          // Need to collect the value which is inside an input grandchild
          item.children.forEach((child) => {
            if (child.localName === "div") {
              child.children.forEach((grandchild) => {
                if (grandchild.localName === "input") {
                  updatedCoordinates[idx] = grandchild.value;
                }
              });
            }
          });
        }
      }
    );
    // transform the coordinations if needed
    updatedCoordinates = [
      parseFloat(updatedCoordinates[0]),
      parseFloat(updatedCoordinates[1]),
    ];
    if (transformCode !== this.map.getView().getProjection()._code) {
      updatedCoordinates = transform(
        updatedCoordinates,
        getProjection(transformCode),
        this.map.getView().getProjection()
      );
    }
    // Set the coordinates field and run the update function so all values are updated
    this.coordinates = updatedCoordinates;
    this.updateTransforms();
  };

  updateTransforms = () => {
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
}

export default CoordinatesModel;

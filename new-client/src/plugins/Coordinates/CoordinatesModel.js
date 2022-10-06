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
    this.thousandSeparator = settings.options.thousandSeparator ?? false;
    this.showFieldsOnStart = settings.options.showFieldsOnStart ?? false;

    this.coordinates = undefined;
    this.transformations = settings.options.transformations;
    if (!this.transformations || this.transformations.length === 0) {
      this.transformations = [
        {
          code: "EPSG:4326",
          precision: 3,
          default: false,
          hint: "",
          title: "WGS84",
          xtitle: "Lng",
          ytitle: "Lat",
          inverseAxis: true,
        },
      ];
    } else {
      // Give default values in case none is set
      this.transformations.forEach((t) => {
        t.code = t.code ?? "";
        t.precision = t.precision ?? 3;
        t.default = t.default ?? false;
        t.title = t.title ?? "";
        t.xtitle = t.xtitle ?? "";
        t.ytitle = t.ytitle ?? "";
        t.inverseAxis = t.inverseAxis ?? "";
        t.coordinates = t.coordinates ?? "";
      });
    }

    this.source = new VectorSource();
    this.vector = new Vector({
      layerType: "system",
      zIndex: 5000,
      name: "pluginCoordinate",
      caption: "Coordinate layer",
      source: this.source,
    });
    this.map.addLayer(this.vector);
    this.localObserver.subscribe("newCoordinates", (incomingCoords) => {
      let transformedCoords = incomingCoords["coordinates"];
      if (
        incomingCoords["proj"] !== this.map.getView().getProjection().getCode()
      ) {
        transformedCoords = transform(
          incomingCoords["coordinates"],
          incomingCoords["proj"],
          this.map.getView().getProjection().getCode()
        );
      }
      this.addMarker(transformedCoords);
    });
  }

  activate() {
    this.addInteraction();
    this.localObserver.publish("showSnackbar");
    if (this.showFieldsOnStart) {
      this.localObserver.publish("newCoordinates", {
        coordinates: this.map.getView().getCenter(),
        proj: this.map.getView().getProjection().getCode(),
        force: true,
      });
    }
  }

  deactivate() {
    this.removeInteraction();
    this.vector.getSource().clear();

    this.localObserver.publish("hideSnackbar");
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

  /**
   * @summary Pans so the marker is at the center of the view
   */
  centerOnMarker = () => {
    if (this.vector.getSource().getFeatures().length > 0) {
      this.map
        .getView()
        .setCenter(
          this.vector
            .getSource()
            .getFeatures()[0]
            .getGeometry()
            .getCoordinates()
        );
    }
  };

  /**
   * @summary Zooms in on and centers on the marker
   */
  zoomOnMarker = () => {
    if (this.vector.getSource().getFeatures().length > 0) {
      this.map
        .getView()
        .fit(this.vector.getSource().getFeatures()[0].getGeometry());
    }
  };

  /**
   * @summary Gets the user's position and puts the marker there
   */
  goToUserLocation = () => {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000,
      };

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const point = new Point([pos.coords.longitude, pos.coords.latitude]);
          point.transform(
            "EPSG:4326",
            this.map.getView().getProjection().getCode()
          );
          this.coordinates = point.getCoordinates();
          this.localObserver.publish("newCoordinates", {
            coordinates: this.coordinates,
            proj: this.map.getView().getProjection().getCode(),
            force: true,
          });
          this.map.getView().setCenter(point.getCoordinates());
        },
        (error) => {
          // If error code is 1 (User denied Geolocation), show Snackbar with instructions to enable it again
          if (error.code === 1) {
            this.localObserver.publish("location-permissions-denied");
          }
        },
        options
      );
    }
  };

  /**
   * @summary Executed when the reset button is pressed and sends a request
   * to all transformations to reset their values to empty strings.
   * Also removes the marker
   */
  resetCoords = () => {
    this.vector.getSource().clear();
    this.localObserver.publish("resetCoordinates");
    this.coordinates = undefined;
  };

  /**
   * @summary When draw has ended, get the coordinates for the point
   * drawn and add a marker to those coordinates.
   *
   * @memberof CoordinatesModel
   */
  handleDrawEnd = (e) => {
    // Grab coordinates from the Point that has been drawn
    this.coordinates = e.feature.getGeometry().getCoordinates();
    this.addMarker(this.coordinates);

    this.localObserver.publish("newCoordinates", {
      coordinates: this.coordinates,
      proj: this.map.getView().getProjection(),
      force: true,
    });
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

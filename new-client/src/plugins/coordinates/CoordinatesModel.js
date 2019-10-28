import { transform } from "ol/proj";
import Feature from "ol/Feature";
import Vector from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Point from "ol/geom/Point.js";
import { Style, Icon } from "ol/style";

class CoordinatesModel {
  constructor(settings) {
    this.map = settings.map;
    this.localObserver = settings.localObserver;
    this.transformations = settings.options.transformations;

    this.source = new VectorSource();
    this.vector = new Vector({
      source: this.source,
      name: "coordinateLayer"
    });

    this.map.addLayer(this.vector);
    this.coordinates = undefined;
    this.transformedCoordinates = [];
  }

  addMarker = () => {
    if (!this.activated) {
      return;
    }

    let feature = new Feature({
      geometry: new Point(this.coordinates)
    });
    let styleMarker = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        scale: 0.15,
        src: "marker.png"
      })
    });
    feature.setStyle(styleMarker);
    this.vector.getSource().clear();
    this.source.addFeature(feature);
  };

  transform(coordinates, to) {
    let from = this.map.getView().getProjection();
    return transform(coordinates, from, to);
  }

  setCoordinates = () => {
    if (!this.activated) {
      return;
    }
    this.localObserver.publish("setCoordinates", this.coordinates);
    this.localObserver.publish("hideSnackbar");
  };

  presentCoordinates() {
    let coordinates = this.coordinates;
    let transformedCoordinates = [];
    let transformations = this.transformations;

    if (transformations.length) {
      transformations.map((transformation, i) => {
        transformedCoordinates = {
          code: transformation.code || "",
          default: transformation.default || false,
          hint: transformation.hint || "",
          title: transformation.title || "",
          xtitle: transformation.xtitle || "",
          ytitle: transformation.ytitle || "",
          inverseAxis: transformation.inverseAxis || false,
          coordinates: this.transform(coordinates, transformation.code) || ""
        };

        this.transformedCoordinates[i] = transformedCoordinates;

        this.localObserver.publish(
          "setTransformedCoordinates",
          this.transformedCoordinates
        );

        return this.transformedCoordinates;
      });
    } else {
      transformedCoordinates = {
        code: "EPSG:4326",
        default: false,
        hint: "",
        title: "WGS84",
        xtitle: "Lng",
        ytitle: "Lat",
        inverseAxis: true,
        coordinates: this.transform(coordinates, "EPSG:4326")
      };

      this.transformedCoordinates = [transformedCoordinates];

      this.localObserver.publish(
        "setTransformedCoordinates",
        this.transformedCoordinates
      );

      return this.transformedCoordinates;
    }
  }

  getCoordinates() {
    return this.coordinates;
  }

  activate() {
    this.map.on("singleclick", e => {
      this.coordinates = e.coordinate;
      this.setCoordinates();
      this.addMarker();
      this.presentCoordinates();
    });
    this.activated = true;
    this.localObserver.publish("showSnackbar");
  }

  deactivate() {
    this.map.un("singleclick", this.setCoordinates);
    this.vector.getSource().clear();

    this.activated = false;
    this.localObserver.publish("hideSnackbar");
    this.localObserver.publish("setTransformedCoordinates", []);
  }
}

export default CoordinatesModel;

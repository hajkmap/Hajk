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

  addMarker = coordinates => {
    let feature = new Feature({
      geometry: new Point(coordinates)
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

  activate() {
    let transformations = this.transformations;
    this.activated = true;

    this.map.on("singleclick", e => {
      if (!this.activated) {
        return;
      }

      this.coordinates = e.coordinate;
      this.addMarker(this.coordinates);
      let transformedCoordinates;

      if (transformations.length) {
        transformedCoordinates = transformations.map((transformation, i) => {
          let container = {};

          container.code = transformation.code || "";
          container.default = transformation.default || false;
          container.hint = transformation.hint || "";
          container.title = transformation.title || "";
          container.xtitle = transformation.xtitle || "";
          container.ytitle = transformation.ytitle || "";
          container.inverseAxis = transformation.inverseAxis || false;
          container.coordinates =
            this.transform(this.coordinates, transformation.code) || "";

          return container;
        });
      } else {
        transformedCoordinates = [
          {
            code: "EPSG:4326",
            default: false,
            hint: "",
            title: "WGS84",
            xtitle: "Lng",
            ytitle: "Lat",
            inverseAxis: true,
            coordinates: this.transform(this.coordinates, "EPSG:4326")
          }
        ];
      }

      this.localObserver.publish(
        "setTransformedCoordinates",
        transformedCoordinates
      );
    });
    this.localObserver.publish("showSnackbar");
  }

  deactivate() {
    this.map.un("singleclick", this.addMarker);
    this.vector.getSource().clear();

    this.activated = false;
    this.localObserver.publish("hideSnackbar");
    this.localObserver.publish("setTransformedCoordinates", []);
  }
}

export default CoordinatesModel;

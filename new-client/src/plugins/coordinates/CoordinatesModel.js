import { transform } from "ol/proj";
import Feature from "ol/Feature";
import Vector from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Point from "ol/geom/Point.js";
import { Style, Icon } from "ol/style";

class CoordinatesModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.options = settings.options;
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

  get getMap() {
    return this.map;
  }

  get getSource() {
    return this.source;
  }

  get getVector() {
    return this.vector;
  }

  addMarker = () => {
    var source = this.getSource;
    var vectorLayer = this.getVector;

    var feature = new Feature({
      geometry: new Point(this.coordinates)
    });
    var styleMarker = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        scale: 0.15,
        src: "marker.png"
      })
    });
    feature.setStyle(styleMarker);
    vectorLayer.getSource().clear();
    source.addFeature(feature);
  };

  transform(coordinates, to) {
    var from = this.map.getView().getProjection();
    return transform(coordinates, from, to);
  }

  setCoordinates = () => {
    if (!this.activated) {
      return;
    }
    this.localObserver.publish("setCoordinates", this.coordinates);
  };

  presentCoordinates() {
    var coordinates = this.coordinates;
    var transformedCoordinates = [];
    var transformations = this.transformations;

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

        return this.transformedCoordinates;
      });
    }

    this.localObserver.publish(
      "setTransformedCoordinates",
      this.transformedCoordinates
    );
  }

  getCoordinates() {
    return this.coordinates;
  }

  activate() {
    var map = this.getMap;

    this.activated = true;
    map.on("singleclick", e => {
      this.coordinates = e.coordinate;
      this.setCoordinates();
      this.addMarker();
      this.presentCoordinates();
    });
  }

  deactivate() {
    var map = this.getMap;

    this.activated = false;
    map.un("singleclick", this.setCoordinates);
    this.getVector.getSource().clear();
  }
}

export default CoordinatesModel;

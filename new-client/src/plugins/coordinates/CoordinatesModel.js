import { MousePosition } from "ol/control";
import { transform } from "ol/proj";
import Feature from "ol/Feature";
import Vector from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Point from "ol/geom/Point.js";
import { Circle as CircleStyle, Style, Icon } from "ol/style";

class CoordinatesModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.options = settings.options;
    this.localObserver = settings.localObserver;

    this.source = new VectorSource();
    this.vector = new Vector({
      source: this.source,
      name: "coordinateLayer"
    });

    this.map.addLayer(this.vector);
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

  addMarker = evt => {
    this.setCoordinates(evt.coordinate);

    var source = this.getSource;
    var vectorLayer = this.getVector;

    var feature = new Feature({
      geometry: new Point(evt.coordinate)
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

  setCoordinates(coordinates) {
    this.localObserver.publish("setCoordinates", coordinates);
  }

  activate = () => {
    var map = this.getMap;

    map.on("singleclick", e => {
      this.coordinates = e.coordinate;
      this.addMarker(e);
    });
    this.activated = true;
  };

  deactivate = () => {
    var map = this.getMap;

    map.un("singleclick", this.addMarker);
    this.activated = false;
    this.getVector.getSource().clear();
  };
}

export default CoordinatesModel;

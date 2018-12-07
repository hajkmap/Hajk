import { Circle, Stroke, Fill, Style } from "ol/style.js";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import Select from "ol/interaction/Select.js";
import GeoJSON from "ol/format/GeoJSON.js";
import { click } from "ol/events/condition.js";
import {
  Point,
  Polygon,
  MultiPoint,
  MultiLineString,
  MultiPolygon
} from "ol/geom.js";
import * as jsts from "jsts";

class BufferModel {
  constructor(settings) {
    this.olMap = settings.map;
    this.observer = settings.observer;
  }
  getDefaultStyle() {
    const color = "rgba(90, 100, 115, 1.5)";
    const fill = "rgba(255, 255, 255, 0.5)";
    return [
      new Style({
        fill: new Fill({
          color: fill
        }),
        stroke: new Stroke({
          color: color,
          width: 4
        }),
        image: new Circle({
          radius: 6,
          fill: new Fill({
            color: fill
          }),
          stroke: new Stroke({
            color: color,
            width: 2
          })
        })
      })
    ];
  }

  get getMap() {
    return this.setMap();
  }

  setMap() {
    return this.olMap;
  }

  get getObserver() {
    return this.setObserver();
  }

  setObserver() {
    return this.observer;
  }

  setActiveTool(dist) {
    var currentObserver = this.getObserver;
    currentObserver.subscribe("myEvent", message => {
      console.log(message);
    });
    console.log(currentObserver);

    var currentMap = this.getMap;
    //om jsts inte hittas måste du installera det genom
    // att stå i Hajk/new-client och köra
    // =>>>>>>>     npm install jsts --save-dev
    var parser = new jsts.io.OL3Parser();
    parser.inject(Point, Polygon, MultiPoint, MultiLineString, MultiPolygon);
    currentMap.getLayers().forEach(function(layer) {
      // var minS = layer.getSource();
      // console.log(minS);
    });
    var source = new VectorSource({
      format: new GeoJSON(),
      url: "temp/layer.geojson"
    });
    var layer = new VectorLayer({
      source: source,
      id: "buffer",
      style: this.getDefaultStyle()
    });

    currentMap.addLayer(layer);
    var selectClick = new Select({
      condition: click
    });

    var select = selectClick;
    //console.log(currentMap);
    currentMap.addInteraction(select);

    select.on("select", function(e) {
      // var thisFeature = this.getFeatures().getArray();
      // console.log(thisFeature);
      // thisFeature.forEach(feature => {
      currentMap.getLayers().forEach(function(layer) {
        var minS = layer.getSource();
        var feature = minS.getFeatures();
        var geometry = feature.getGeometry();
        if (geometry instanceof Circle) {
          geometry = Polygon.fromCircle(geometry, 0b10000000);
        }

        var jstsGeom = parser.read(feature.getGeometry());
        var buffered = jstsGeom.buffer(dist);

        feature.setGeometry(parser.write(buffered));
      });
    });
  }
  clearBuffer() {
    // var featureSource = this.getSource;
    // var vectorSource = this.getVector;
    // vectorSource.removeFeature(featureSource);
  }
}
export default BufferModel;

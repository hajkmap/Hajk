import Draw, {
  createBox,
  createRegularPolygon,
  createPolygon,
} from "ol/interaction/Draw";
import { Fill, Stroke, Style } from "ol/style.js";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import GeoJSON from "ol/format/GeoJSON.js";
import { WFS } from "ol/format";

class GeosuiteExportModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.options = settings.options;
    this.localObserver = settings.localObserver;

    this.source = new VectorSource();
    this.vector = new VectorLayer({
      source: this.source,
      name: "geoSuiteDrawLayer",
    });
    this.style = new Style({
      fill: new Fill({
        color: "rgba(255, 255, 255, 0.3)",
      }),
      stroke: new Stroke({
        color: "rgba(0, 0, 0, 0.5)",
        width: 3,
      }),
    });

    this.map.addLayer(this.vector);
    this.draw = null;
    this.wfsParser = new WFS();
  }

  handleDrawStart = (e) => {
    console.log("handleDrawStart");
    console.log(e);
  };

  handleDrawEnd = (e) => {
    console.log("handleDrawEnd");
    console.log(e);
    this.removeDrawInteraction();
  };

  handleDrawAbort = () => {
    console.log("handleDrawAbort");
  };

  removeDrawInteraction() {
    if (this.draw !== null) {
      this.map.removeInteraction(this.draw);
      this.draw = null;
    }
    // TODO: Delay this so we don't get a feature-info click
    this.map.clickLock.delete("geosuiteexport");
  }

  addDrawInteraction = () => {
    console.log("GeosuiteExportModel: startDrawInteraction");

    this.draw = new Draw({
      source: this.source,
      type: "Polygon",
    });
    this.draw.on("drawstart", this.handleDrawStart);
    this.draw.on("drawend", this.handleDrawEnd);
    this.draw.on("drawabort", this.handleDrawAbort);
    this.map.addInteraction(this.draw);

    this.map.clickLock.add("geosuiteexport"); //clicklock, otherwise we get InfoClicks.
  };

  showShapeInfo = () => {
    console.log("GeosuiteExportModel: showShapeInfo");
    const features = this.source.getFeatures();
    if (features.length > 0) {
      const featureGeometry = features[0].getGeometry();
      console.log(featureGeometry);
      //return features[0].getGeometry().getArea();
    }
  };

  //example
  createWfsRequest(area) {
    //create wfs request (example)
    const request = `http://example.com/geoserver/wfs?
    service=wfs&
    version=1.1.0&
    request=GetCapabilities"`;

    return request;
  }

  clearMap() {
    console.log("GeosuiteExportModel: clearMap");
    console.log("clear the selected area from the map");
  }
}

export default GeosuiteExportModel;

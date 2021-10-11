//will probably need some of these to create the selection area.
import Draw, { createBox } from "ol/interaction/Draw.js";
import { Fill, Stroke, Style } from "ol/style.js";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import GeoJSON from "ol/format/GeoJSON.js";

class GeosuiteExportModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
  }

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

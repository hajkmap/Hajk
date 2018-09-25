import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import WMTS from 'ol/source/WMTS.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import 'ol/ol.css';
import CoordinateSystemLoader from "./CoordinateSystemLoader.js";
import { register } from "ol/proj/proj4";

class OpenLayersMap {

  constructor(settings) {
    settings.config  = settings.config || {
      center: [319268, 6471199],
      zoom: 6
    };

    this.coordinateSystemLoader = new CoordinateSystemLoader([{
      "code": "EPSG:3006",
      "definition": "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
      "extent": [
        181896.33,
        6101648.07,
        864416.0,
        7689478.3
      ],
      "units": null
    }]);

    register(this.coordinateSystemLoader.getProj4());

    this.map = new Map({
      layers: [
        new TileLayer({
          opacity: 1,
          source: new WMTS({
            url: 'http://giscloud.se/mapservice/lmproxy/wmts',
            layer: 'topowebb',
            matrixSet: '3006',
            format: 'image/png',
            projection: 'EPGS:3006',
            tileGrid: new WMTSTileGrid({
              origin: [-1200000, 8500000],
              resolutions: [4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5],
              matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
            }),
            style: 'default',
            wrapX: false
          })
        })
      ],
      target: settings.target,
      view: new View({
        center: settings.config.center,
        zoom: settings.config.zoom,
        projection: 'EPSG:3006',
        resolutions: [4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25],
        extent: [
          0,
          6000000,
          1000000,
          9000000
        ]
      })
    });
    this.onUpdate = settings.onUpdate;
    this.onUpdate(this.getState());
    this.bindEvents();
  }

  bindEvents() {
    this.map.getView().on('change:zoom', () => {
      this.onUpdate(this.getState());
    });
    this.map.getView().on('change:center', () => {
      this.onUpdate(this.getState());
    });
  }

  getState() {
    return {
      center: this.map.getView().getCenter(),
      zoom: Math.round(this.map.getView().getZoom())
    }
  }

  getMap() {
    return this.map;
  }

}

export default OpenLayersMap;
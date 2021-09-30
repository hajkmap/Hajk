import View from "ol/View";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import MVT from "ol/format/MVT";
import LayerInfo from "./LayerInfo.js";
import { overrideLayerSourceParams } from "utils/FetchWrapper";

var mvtLayerProperties = {
  url: "",
  projection: "EPSG:3006",
  layer: "",
  opacity: 1,
  matrixSet: "3006",
  style: "default",
  axisMode: "natural",
  origin: [-1200000, 8500000],
  resolutions: [4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5],
  matrixIds: [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ],
  attribution: "",
};

class MVTLayer {
  constructor(config, proxyUrl, map) {
    config = {
      ...mvtLayerProperties,
      ...config,
    };
    this.proxyUrl = proxyUrl;
    this.map = map;
    // this.resolutions = this.resolutions = config.resolutions.map((r) =>
    //   Number(r)
    // );
    this.resolutions = config.resolutions;
    this.projection = config.projection;
    console.log("this.projection: ", this.projection);

    // let source = {
    //   attributions: config.attribution,
    //   format: "image/png",
    //   wrapX: false,
    //   url: config.url,
    //   crossOrigin: config.crossOrigin,
    //   axisMode: config.axisMode,
    //   layer: config.layer,
    //   matrixSet: config.matrixSet,
    //   style: config.style,
    //   projection: this.projection,
    //   tileGrid: this.tileGrid,
    // };

    this.tileGrid = new WMTSTileGrid({
      // origin: config.origin.map((o) => Number(o)),
      resolutions: this.resolutions,
      matrixIds: config.matrixIds,
      extent: config.extent,
    });

    let sourceOptions = {
      url: "https://mapslab.lantmateriet.se/vt-open/wmts/1.0.0/byggnad/default/3006/{z}/{y}/{x}.mvt",
      tileGrid: this.tileGrid,
      format: new MVT(),
      projection: this.projection,
    };
    overrideLayerSourceParams(sourceOptions);

    const source = new VectorTileSource(sourceOptions);

    const minZoom = config?.minZoom >= 0 ? config.minZoom : undefined;
    const maxZoom = config?.maxZoom >= 0 ? config.maxZoom : undefined;

    // this.layer = new TileLayer({
    //   name: config.name,
    //   visible: config.visible,
    //   queryable: config.queryable,
    //   opacity: config.opacity,
    //   source: new WMTS(source),
    //   layerInfo: new LayerInfo(config),
    //   minZoom: minZoom,
    //   maxZoom: maxZoom,
    // });

    this.layer = new VectorTileLayer({
      name: config.name,
      visible: config.visible,
      queryable: config.queryable,
      opacity: config.opacity,
      source,
      minZoom: minZoom,
      maxZoom: maxZoom,
      declutter: config.declutter,
      layerInfo: new LayerInfo(config),
    });

    this.updateMapViewResolutions();
    this.type = "mvt";
  }

  updateMapViewResolutions() {
    var view = this.map.getView();
    this.map.setView(
      new View({
        zoom: view.getZoom(),
        center: view.getCenter(),
        resolutions: this.resolutions,
        projection: this.projection,
      })
    );
  }
}

export default MVTLayer;

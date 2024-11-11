import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import LayerInfo from "./LayerInfo.js";
import { overrideLayerSourceParams } from "../../utils/FetchWrapper";

var wmtsLayerProperties = {
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

class WMTSLayer {
  constructor(config, proxyUrl, map) {
    config = {
      ...wmtsLayerProperties,
      ...config,
    };
    this.proxyUrl = proxyUrl;
    this.map = map;
    this.resolutions = this.resolutions = config.resolutions.map((r) =>
      Number(r)
    );
    this.projection = config.projection;

    let source = {
      attributions: config.attribution,
      format: "image/png",
      wrapX: false,
      url: config.url,
      crossOrigin: config.crossOrigin,
      axisMode: config.axisMode,
      layer: config.layer,
      matrixSet: config.matrixSet,
      style: config.style,
      projection: this.projection,
      tileGrid: new WMTSTileGrid({
        origin: config.origin.map((o) => Number(o)),
        resolutions: this.resolutions,
        matrixIds: config.matrixIds,
        extent: config.extent,
      }),
    };

    overrideLayerSourceParams(source);

    const minZoom = config?.minZoom >= 0 ? config.minZoom : undefined;
    const maxZoom = config?.maxZoom >= 0 ? config.maxZoom : undefined;

    this.layer = new TileLayer({
      name: config.name,
      visible: config.visible,
      queryable: config.queryable,
      opacity: config.opacity,
      zIndex: config.zIndex,
      layerType: config.layerType,
      source: new WMTS(source),
      layerInfo: new LayerInfo(config),
      minZoom: minZoom,
      maxZoom: maxZoom,
    });
    this.updateMapViewResolutions();
    this.type = "wmts";
  }

  updateMapViewResolutions() {
    var view = this.map.getView();
    this.map.setView(
      new View({
        zoom: view.getZoom(),
        center: view.getCenter(),
        resolutions: this.resolutions,
        projection: this.projection,
        constrainResolution: view.getConstrainResolution(),
      })
    );
  }
}

export default WMTSLayer;

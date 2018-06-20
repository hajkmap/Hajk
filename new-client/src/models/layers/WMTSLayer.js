import TileLayer from "ol/layer/tile";
import WMTSSource from "ol/source/wmts";
import WMTSTileGrid from "ol/tilegrid/wmts";
import Attribution from "ol/attribution";
import LayerInfo from "./LayerInfo.js";
import View from "ol/view";
import proj from "ol/proj";

var WmtsLayerProperties = {
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
    "12"
  ],
  attribution: ""
};

class WMTSLayer {
  constructor(config, proxyUrl) {
    this.proxyUrl = proxyUrl;
    this.validInfo = true;
    this.defaultProperties = WmtsLayerProperties;
    this.legend = config.legend;
    this.attribution = config.attribution;
    this.layerInfo = new LayerInfo(config);

    this.resolutions = config.resolutions.map(r => Number(r));
    this.origin = config.origin.map(o => Number(o));

    this.layer = new TileLayer({
      name: config.name,
      caption: config.caption,
      visible: config.visible,
      queryable: config.queryable,
      opacity: config.opacity,
      source: new WMTSSource({
        attributions: this.getAttributions(),
        format: "image/png",
        wrapX: false,
        url: config.url,
        axisMode: config.axisMode,
        layer: config.layer,
        matrixSet: config.matrixSet,
        style: config.style,
        projection: config.projection,
        tileGrid: new WMTSTileGrid({
          origin: config.origin,
          resolutions: config.resolutions,
          matrixIds: config.matrixIds,
          extent: config.extent
        })
      })
    });

    this.layer.getSource().set("url", config.url);
    this.layer.getSource().set("axisMode", config.axisMode);

    // FIXME: Shell is gone, so let's do it some other way
    // this.on(
    //   "change:shell",
    //   function(sender, shell) {
    //     this.updateMapViewResolutions();
    //   },
    //   this
    // );

    // this.set("type", "wmts");
  }

  getAttributions() {
    if (this.attribution) {
      return [
        new Attribution({
          html: this.attribution
        })
      ];
    }
  }

  updateMapViewResolutions() {
    var map = this.get("shell")
        .getMap()
        .getMap(),
      view = map.getView();
    map.setView(
      new View({
        zoom: view.getZoom(),
        center: view.getCenter(),
        resolutions: this.resolutions,
        projection: proj.get(this.projection)
      })
    );
  }
}

export default WMTSLayer;

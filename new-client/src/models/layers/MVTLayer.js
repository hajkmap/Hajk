// import View from "ol/View";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import MVT from "ol/format/MVT";
import LayerInfo from "./LayerInfo.js";

import { createXYZ } from "ol/tilegrid";

import WMTS, { optionsFromCapabilities } from "ol/source/WMTS";
import WMTSCapabilities from "ol/format/WMTSCapabilities";

// import { overrideLayerSourceParams } from "utils/FetchWrapper";

// const mvtLayerProperties = {
//   url: "",
//   projection: "EPSG:3006",
//   layer: "",
//   opacity: 1,
//   matrixSet: "3006",
//   style: "default",
//   axisMode: "natural",
//   origin: [-1200000, 8500000],
//   resolutions: [4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5],
//   matrixIds: [
//     "0",
//     "1",
//     "2",
//     "3",
//     "4",
//     "5",
//     "6",
//     "7",
//     "8",
//     "9",
//     "10",
//     "11",
//     "12",
//   ],
//   attribution: "",
// };

class MVTLayer {
  constructor(config, proxyUrl, map) {
    // config = {
    //   ...mvtLayerProperties,
    //   ...config,
    // };
    // this.proxyUrl = proxyUrl;
    // this.map = map;
    this.config = config;
    // this.resolutions = this.resolutions = config.resolutions.map((r) =>
    //   Number(r)
    // );

    // const parser = new WMTSCapabilities();

    // fetch(
    //   "http://geoservertest.halmstad.se/geoserver/gwc/service/wmts?REQUEST=GetCapabilities"
    // )
    //   .then((response) => {
    //     return response.text();
    //   })
    //   .then((text) => {
    //     const result = parser.read(text);
    //     const options = optionsFromCapabilities(result, {
    //       layer: "bmf:byggnader",
    //       matrixSet: "HK3KM",
    //     });
    //     console.log("options: ", options);
    //   });

    console.log(this.config.caption, this.config);

    const tileGrid =
      this.config.extent && this.config.origin && this.config.resolutions
        ? new WMTSTileGrid({
            extent: this.config.extent,
            origin: this.config.origin,
            resolutions: this.config.resolutions,
          })
        : undefined;

    console.log(`tileGrid for ${this.config.caption}:`, tileGrid);

    const sourceOptions = {
      url: this.config.url,
      // tileGrid,
      tileGrid: new createXYZ({
        extent: [-1200000, 4700000, 2600000, 8500000],
        maxZoom: 9,
        maxResolution: 2048,
      }),
      format: new MVT(),
      projection: this.config.projection,
      // maxZoom: 15,
    };
    // overrideLayerSourceParams(sourceOptions);

    const source = new VectorTileSource(sourceOptions);

    // const minZoom = config?.minZoom >= 0 ? config.minZoom : undefined;
    // const maxZoom = config?.maxZoom >= 0 ? config.maxZoom : undefined;

    this.layer = new VectorTileLayer({
      name: config.name,
      caption: config.name,
      visible: config.visible,
      queryable: config.queryable,
      opacity: config.opacity,
      source,
      // minZoom: minZoom,
      // maxZoom: maxZoom,
      declutter: this.config.declutter,
      layerInfo: new LayerInfo(this.config),
    });

    // this.updateMapViewResolutions();
    this.type = "mvt";
  }

  // updateMapViewResolutions() {
  //   var view = this.map.getView();
  //   this.map.setView(
  //     new View({
  //       zoom: view.getZoom(),
  //       center: view.getCenter(),
  //       resolutions: this.resolutions,
  //       projection: this.projection,
  //     })
  //   );
  // }
}

export default MVTLayer;

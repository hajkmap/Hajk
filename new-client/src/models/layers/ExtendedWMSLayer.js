import LayerInfo from "./LayerInfo.js";
import TileGrid from "ol/tilegrid/TileGrid";

import ImageLayer from "ol/layer/Image";
import TileLayer from "ol/layer/Tile";

import ImageWMS from "ol/source/ImageWMS";
import TileWMS from "ol/source/TileWMS";

var {
  customGetTileUrl,
  customGetFeatureInformationUrl
} = require("oloverrides/wmsurl");

var ExtendedWMSLayerProperties = {
  url: "",
  projection: "EPSG:3007",
  serverType: "geoserver",
  opacity: 1,
  status: "ok",
  params: {}
};

class ExtendedWMSLayer {
  constructor(config, proxyUrl) {
    this.proxyUrl = proxyUrl;
    this.validInfo = true;
    this.defaultProperties = ExtendedWMSLayerProperties;
    this.legend = config.legend;
    this.attribution = config.attribution;
    this.layerInfo = new LayerInfo(config);

    let parmas = this.get("params");

    var source = {
      url: config.url,
      params: config.params,
      projection: config.projection,
      serverType: config.serverType,
      imageFormat: config.imageFormat,
      attributions: this.getAttributions()
    };

    // TODO: Check if this is really used?
    // var infoClickSource = {
    //   url: this.get("url"),
    //   params: Object.assign({}, parmas),
    //   projection: this.get("projection"),
    //   serverType: this.get("serverType"),
    //   imageFormat: this.get("imageFormat"),
    //   attributions: this.getAttributions()
    // };

    this.queryableLayerNames = this.get("layersconfig")
      .filter(l => l.queryable)
      .map(l => l.name)
      .join(",");
    this.set("queryable", this.queryableLayerNames.length > 0);

    if (
      this.get("resolutions") &&
      this.get("resolutions").length > 0 &&
      this.get("origin") &&
      this.get("origin").length > 0
    ) {
      source.tileGrid = TileGrid({
        resolutions: this.get("resolutions"),
        origin: this.get("origin")
      });
      source.extent = this.get("extent");
    }

    if (this.get("singleTile")) {
      this.layer = new ImageLayer({
        name: this.get("name"),
        visible: this.get("visible"),
        queryable: this.get("queryable"),
        caption: this.get("caption"),
        opacity: this.get("opacity"),
        source: new ImageWMS(source)
      });
    } else {
      this.layer = new TileLayer({
        name: this.get("name"),
        visible: this.get("visible"),
        queryable: this.get("queryable"),
        caption: this.get("caption"),
        opacity: this.get("opacity"),
        source: new TileWMS(source)
      });
      if (source.params.VERSION == "1.3.0") {
        //Openlayers stöder ej sweref 99 TM när wms version 1.3.0 används
        //För att komma runt detta har vi skapat en egen getTileUrl funktion.
        this.layer
          .getSource()
          .setTileUrlFunction(customGetTileUrl.bind(this.layer.getSource()));
      }
    }

    // Can't find any references to wmsCallbackName elsewhere...
    // this.set(
    //   "wmsCallbackName",
    //   "wmscallback" + Math.floor(Math.random() * 1000) + 1
    // );
    // global.window[this.get("wmsCallbackName")] = _.bind(
    //   this.getFeatureInformationReponse,
    //   this
    // );

    this.layer.getSource().on("tileloaderror", e => {
      this.tileLoadError();
    });

    this.layer.getSource().on("tileloadend", e => {
      this.tileLoadOk();
    });

    this.layer.on("change:visible", e => {
      if (!this.get("visible")) {
        this.tileLoadOk();
      }
    });

    this.layer.getSource().set("url", this.get("url"));
    this.set("type", "wms");
  }

  getFeatureInformation(args) {
    let sourceConfig = this.get("params");
    let url = customGetFeatureInformationUrl({
      source: this.layer.getSource(),
      layers: this.queryableLayerNames,
      coordinate: args.coordinate,
      resolution: args.resolution,
      projection: args.projection,
      isSingleTile: this.get("singleTile"),
      params: {
        INFO_FORMAT: sourceConfig.INFO_FORMAT,
        feature_count: 100
      }
    });
    //GML
    //Plain text
    if (url) {
      this.featureInformationCallback = args.success;
      if (HAJK2.searchProxy) {
        url = encodeURIComponent(url);
      }

      var request = $.ajax({
        url: HAJK2.searchProxy + url,
        success: (data, status, xhr) => {
          let type = xhr.getResponseHeader("Content-Type").split(";")[0];
          switch (type.toLowerCase()) {
            case "text/xml":
            case "application/vnd.ogc.gml": {
              let features = new ol.format.GML().readFeatures(data);
              this.featureInformationCallback(features, this.getLayer());
              break;
            }
            case "application/geojson":
            case "application/json": {
              let features = new ol.format.GeoJSON().readFeatures(data);
              this.featureInformationCallback(features, this.getLayer());
              break;
            }
            case "text/plain":
              let fakeFeature = new ol.Feature({
                geometry: new ol.geom.Point(args.coordinate)
              });
              fakeFeature.setProperties({
                text: data
              });
              this.featureInformationCallback([fakeFeature], this.getLayer());
              break;
            default:
              console.log("Unsupported response type:", type, data);
              break;
          }
        }
      });
      request.error(args.error);
    }
  }

  /**
   * Triggers when a tile fails to load.
   * @instance
   */
  tileLoadError() {
    this.status = "loaderror";
  }

  /**
   * Triggers when a tile loads.
   * @instance
   */
  tileLoadOk() {
    this.status = "ok";
  }

  /**
   * Parse response and trigger registred feature information callback.
   * @param {XMLDocument} respose
   * @instance
   */
  getFeatureInformationReponse(response) {
    try {
      var features = new ol.format.GeoJSON().readFeatures(response);
      this.featureInformationCallback(features, this.getLayer());
    } catch (e) {
      console.error(e);
    }
  }
}

export default ExtendedWMSLayer;

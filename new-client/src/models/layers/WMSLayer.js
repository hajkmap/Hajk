import TileGrid from "ol/tilegrid/TileGrid";
import ImageLayer from "ol/layer/Image";
import TileLayer from "ol/layer/Tile";
import ImageWMS from "ol/source/ImageWMS";
import TileWMS from "ol/source/TileWMS";
import GeoJSON from "ol/format/GeoJSON";
import LayerInfo from "./LayerInfo.js";
import { equals } from "ol/extent";
import { delay } from "../../utils/Delay";
import { hfetch, overrideLayerSourceParams } from "utils/FetchWrapper";

class WMSLayer {
  constructor(config, proxyUrl, globalObserver) {
    this.proxyUrl = proxyUrl;
    this.globalObserver = globalObserver;
    this.validInfo = true;
    this.legend = config.legend;
    this.attribution = config.attribution;
    this.layerInfo = new LayerInfo(config);
    this.subLayers = config.params["LAYERS"].split(",");

    const source = {
      url: config.url,
      params: config.params,
      projection: config.projection,
      serverType: config.serverType,
      crossOrigin: config.crossOrigin,
      imageFormat: config.imageFormat,
      attributions: config.attribution,
      cacheSize: this.subLayers.length > 1 ? 32 : 2048,
      transition: this.subLayers.length > 1 ? 0 : 100,
    };

    if (config.hidpi !== null) {
      source.hidpi = config.hidpi;
    }

    // If this is layer item has sublayers and only a subset of them
    // should be visible at start, there will be a value in this property.
    if (config.visibleAtStartSubLayers?.length > 0) {
      // In that case, replace the previously prepared LAYERS value (which
      // got set in ConfigMapper and contains all sublayers) with this
      // subset of layers.
      source.params["LAYERS"] = config.visibleAtStartSubLayers.join(",");
      source.params["STYLES"] = Object.entries(config.layersInfo)
        .filter((k) => config.visibleAtStartSubLayers.indexOf(k[0]) !== -1)
        .map((l) => l[1].style)
        .join(",");
    }

    overrideLayerSourceParams(source);

    const minZoom = config?.minZoom >= 0 ? config.minZoom : undefined;
    const maxZoom = config?.maxZoom >= 0 ? config.maxZoom : undefined;

    if (
      config.resolutions &&
      config.resolutions.length > 0 &&
      config.origin &&
      config.origin.length > 0
    ) {
      source.tileGrid = new TileGrid({
        resolutions: config.resolutions,
        origin: config.origin,
      });
      source.extent = config.extent;
    }

    if (config.singleTile) {
      if (config.customRatio >= 1) {
        source.ratio = config.customRatio;
      }
      this.layer = new ImageLayer({
        name: config.name,
        layerType: this.getLayerType(),
        visible: config.visible,
        caption: config.caption,
        opacity: config.opacity,
        zIndex: config.zIndex,
        source: new ImageWMS(source),
        layerInfo: this.layerInfo,
        url: config.url,
        timeSliderStart: config?.timeSliderStart,
        timeSliderEnd: config?.timeSliderEnd,
        minZoom: minZoom,
        maxZoom: maxZoom,
        minMaxZoomAlertOnToggleOnly:
          config.minMaxZoomAlertOnToggleOnly || false,
      });
    } else {
      this.layer = new TileLayer({
        name: config.name,
        layerType: this.getLayerType(),
        visible: config.visible,
        caption: config.caption,
        opacity: config.opacity,
        zIndex: config.zIndex,
        source: new TileWMS(source),
        layerInfo: this.layerInfo,
        url: config.url,
        timeSliderStart: config?.timeSliderStart,
        timeSliderEnd: config?.timeSliderEnd,
        minZoom: minZoom,
        maxZoom: maxZoom,
        minMaxZoomAlertOnToggleOnly:
          config.minMaxZoomAlertOnToggleOnly || false,
      });

      config.useCustomDpiList = config.useCustomDpiList || false;

      if (config.useCustomDpiList) {
        this.applyCustomDpiTileLoader(this.layer.getSource(), config);
      }
    }

    this.layer.layersInfo = config.layersInfo;
    this.layer.subLayers = this.subLayers;
    this.layer.visibleAtStartSubLayers = config.visibleAtStartSubLayers;
    this.layer.getSource().set("url", config.url);
    this.type = "wms";
    this.bindHandlers();
  }

  applyCustomDpiTileLoader(source, config) {
    // Experimental
    //
    // This tileLoader makes it possible to use specific dpi:s for specific ratios.
    // The builtin OpenLayers HiDPI setting will only request dpi depending on the exact pixel ratio
    // which makes it impossible to cache WMS data server side. For example the HiDPI could
    // ask the server for a tile with size 123x123 and dpi 123, which you probably wont
    // have cached server side.
    //
    // Note that the dpi:s above needs to also be configured server side to make the cache work.
    //
    // a pixelRatio of 0 to 2 would return dpi 90 and width and height 256 * 1 = 256
    // a pixelRatio of 2 to 3 would return dpi 180 and width and height 256 * 2 = 512
    // a pixelRatio of 3 to infinity would return dpi 270 and width and height 256 * 3 = 768

    // Layer config example:
    // "useCustomDpiList": true,
    // "customDpiList": [
    //   { "pxRatio": 0, "dpi": 90 },
    //   { "pxRatio": 2, "dpi": 180 },
    //   { "pxRatio": 3, "dpi": 270 }
    // ]

    // Is it properly configured?
    if (!config?.customDpiList?.length) {
      return;
    }

    // Get the list of available ratios from config and sort it correctly.
    const pixelRatios = config.customDpiList.sort((a, b) =>
      a.pxRatio > b.pxRatio ? 1 : b.pxRatio > a.pxRatio ? -1 : 0
    );

    const pxRatio = window.devicePixelRatio;

    // Find the appropriate pixel ratio and dpi for the current device.
    const targetRatio = pixelRatios.reduce((a, b) => {
      return a.pxRatio <= pxRatio && b.pxRatio > pxRatio ? a : b;
    });

    // Calculate the correct tile size. No decimals allowed.
    const wh = Math.round((targetRatio.pxRatio || 1) * 256);

    source.setTileLoadFunction((tile, src) => {
      let url = new URL(src);
      url.searchParams.set("WIDTH", wh);
      url.searchParams.set("HEIGHT", wh);
      url.searchParams.set("FORMAT_OPTIONS", `dpi:${targetRatio.dpi}`); // Support GEOSERVER
      url.searchParams.set("DPI", targetRatio.dpi); // Support QGIS & CARMENTA_SERVER
      url.searchParams.set("MAP_RESOLUTION", targetRatio.dpi); // Support MAPSERVER
      tile.getImage().src = url.toString();
      url = null;
    });
  }

  // If the layerType is set as a base-layer in the config-mapper,
  // it should be kept as a base-layer, *even if it has sub-layers*.
  // The old behavior (before this commit) was that the base-layer was
  // "transformed" to a "group-layer" if it had more than one subLayer.
  // Since base-layers might be constructed with several subLayers, we
  // shouldn't do that transformation... If the baseLayer is transformed
  // to a "group-layer" we will get several errors, since the baseLayers
  // does not contain all necessary information to render a "group-layer".
  getLayerType() {
    // Destruct the layerType from the layerInfo
    const { layerType } = this.layerInfo;
    // Check if the type is set to "base", and if it is,
    // return "base". If it is not, we check if we have more than
    // one subLayer; if we do, we return "group", and otherwise it is
    // a regular "layer".
    return layerType === "base"
      ? "base"
      : this.subLayers.length > 1
      ? "group"
      : "layer";
  }

  /**
   * Bind handlers for TileWMS and ImageWMS
   * @instance
   */
  bindHandlers() {
    const layerSource = this.layer.getSource();
    if (layerSource instanceof TileWMS) {
      layerSource.on("tileloaderror", this.onTileLoadError);
      layerSource.on("tileloadend", this.onTileLoadOk);
    }
    if (layerSource instanceof ImageWMS) {
      layerSource.on("imageloaderror", this.onImageError);
    }
  }

  /**
   * Triggers when a tile fails to load.
   * @instance
   */
  onTileLoadError = () => {
    this.globalObserver.publish("layerswitcher.wmsLayerLoadStatus", {
      id: this.layer.get("name"),
      status: "loaderror",
    });
  };

  /**
   * Triggers when a tile loads.
   * @instance
   */
  onTileLoadOk = () => {
    this.globalObserver.publish("layerswitcher.wmsLayerLoadStatus", {
      id: this.layer.get("name"),
      status: "ok",
    });
  };

  /**
   * If we get an error while loading Image we try to refresh it once per extent.
   * This check is needed because we don't want to get stuck in an endless loop in case image repeatedly fails
   * @instance
   */
  onImageError = async (e) => {
    this.globalObserver.publish("layerswitcher.wmsLayerLoadStatus", {
      id: this.layer.get("name"),
      status: "loaderror",
    });
    const layerSource = this.layer.getSource();
    const previousErrorExtent = e.target.get("previousErrorExtent") || [];
    const currentErrorExtent = e.image.extent;
    if (!equals(previousErrorExtent, currentErrorExtent)) {
      await delay(300); //Delay refresh of layers who caused error to not throttle the canvas and get new errors
      layerSource.refresh();
    }
    e.target.set("previousErrorExtent", currentErrorExtent);
  };

  /**
   * Load feature information.
   * @instance
   * @param {external:"ol.feature"} feature
   * @return {external:"ol.style"} style
   */
  getFeatureInformation(params) {
    try {
      this.validInfo = true;
      this.featureInformationCallback = params.success;

      let url = this.getLayer()
        .getSource()
        .getFeatureInfoUrl(
          params.coordinate,
          params.resolution,
          params.projection,
          {
            INFO_FORMAT:
              this.get("serverType") === "arcgis" ||
              this.get("serverType") === "mapserver"
                ? "application/geojson"
                : "application/json",
            feature_count: 100,
          }
        );

      if (url) {
        if (this.proxyUrl) {
          url = encodeURIComponent(url);
        }

        hfetch(this.proxyUrl + url)
          .then((response) => {
            response.json().then((data) => {
              var features = new GeoJSON().readFeatures(data);
              this.featureInformationCallback(features, this.getLayer());
            });
          })
          .catch((err) => {
            params.error(err);
          });
      }
    } catch (e) {
      params.error(e);
    }
  }

  /**
   * Get legend url.
   * @instance
   * @param {string} layerName
   * @return {object} legend
   */
  getLegendUrl(layerName) {
    var legend = Object.assign({}, this.legend);
    legend[0].Url = legend[0].Url.replace(/LAYER=.*/, "LAYER=" + layerName);
    return legend;
  }
}

/**
 * WmsLayer module.<br>
 * Use <code>require('layer/wmslayer')</code> for instantiation.
 * @module WMSLayer-module
 * @returns {WMSLayer}
 */
export default WMSLayer;

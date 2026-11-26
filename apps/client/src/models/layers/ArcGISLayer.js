import ImageLayer from "ol/layer/Image";
import ImageArcGISRest from "ol/source/ImageArcGISRest";
import LayerInfo from "./LayerInfo";
import {
  TRANSPARENT_PIXEL,
  buildArcGISImageUrl,
} from "../../utils/arcgisHelpers";

class ArcGISLayer {
  constructor(config, proxyUrl, globalObserver) {
    this.proxyUrl = proxyUrl;
    this.globalObserver = globalObserver;
    this.legend = config.legend;
    this.attribution = config.attribution;
    this.layerInfo = new LayerInfo(config);
    this.subLayers = config.params["LAYERS"].split(",");

    const visibleSubLayers =
      config.visibleAtStartSubLayers?.length > 0
        ? config.visibleAtStartSubLayers
        : this.subLayers;

    // Keep LAYERS clean (17,21) so the rest of Hajk (share links, export,
    // print) works. ArcGIS REST requires the "show:" prefix; that is added
    // here when the image request is sent. Image requests go through the
    // Hajk proxy if one is configured (same as WMS layers).
    const source = new ImageArcGISRest({
      url: (proxyUrl || "") + config.url,
      params: { LAYERS: visibleSubLayers.join(",") },
      projection: config.projection,
      crossOrigin: config.crossOrigin,
      attributions: config.attribution,
      ratio: 1,
      imageLoadFunction: (image, src) => {
        // With an empty list of layers ("show:") some ArcGIS servers draw
        // all layers, so don't send a request at all in that case.
        image.getImage().src = buildArcGISImageUrl(src) ?? TRANSPARENT_PIXEL;
      },
    });

    const minZoom = config?.minZoom >= 0 ? config.minZoom : undefined;
    const maxZoom = config?.maxZoom >= 0 ? config.maxZoom : undefined;

    this.layer = new ImageLayer({
      name: config.name,
      layerType: this.getLayerType(),
      visible: config.visible,
      caption: config.caption,
      opacity: config.opacity,
      zIndex: config.zIndex,
      rotateMap: config.rotateMap,
      source: source,
      layerInfo: this.layerInfo,
      url: config.url,
      minZoom: minZoom,
      maxZoom: maxZoom,
      // Used by Export. This is the service's extent in `projection`, which
      // is not necessarily the map's projection. Do NOT pass it as the
      // layer's `extent` option: OpenLayers reads that in the map's
      // projection and would clip the layer away.
      serviceExtent: config.serviceExtent,
      projection: config.projection,
      // Used by Click.js to send the ArcGIS queries through the proxy
      proxyUrl: proxyUrl || "",
    });

    this.layer.layersInfo = config.layersInfo;
    this.layer.subLayers = this.subLayers;
    this.layer.set("allSubLayers", this.subLayers);
    this.layer.visibleAtStartSubLayers = config.visibleAtStartSubLayers;
    this.layer.set("subLayers", visibleSubLayers);
    this.layer.getSource().set("url", config.url);
    // Used by Click.js to query this layer through the ArcGIS REST API
    this.layer.set("arcgis", true);
    this.type = "arcgis";
    this.bindHandlers();
  }

  bindHandlers() {
    // Let the LayerSwitcher show a warning icon if the server fails to
    // deliver an image (same mechanism as for WMS layers).
    this.layer.getSource().on("imageloaderror", () => {
      this.layer.set("wmsLoadStatus", "failure");
      this.globalObserver?.publish("layerswitcher.wmsLayerLoadStatus", {
        id: this.layer.get("name"),
        status: "loaderror",
      });
    });
    this.layer.getSource().on("imageloadend", () => {
      if (this.layer.get("wmsLoadStatus") === "failure") {
        this.layer.set("wmsLoadStatus", "ok");
        this.globalObserver?.publish("layerswitcher.wmsLayerLoadStatus", {
          id: this.layer.get("name"),
          status: "ok",
        });
      }
    });
  }

  getLayerType() {
    const { layerType } = this.layerInfo;
    return layerType === "base"
      ? "base"
      : this.subLayers.length > 1
        ? "group"
        : "layer";
  }
}

export default ArcGISLayer;

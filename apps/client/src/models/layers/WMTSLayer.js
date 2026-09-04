import TileLayer from "ol/layer/Tile";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import LayerInfo from "./LayerInfo";
import { overrideLayerSourceParams } from "../../utils/FetchWrapper";

var wmtsLayerProperties = {
  url: "",
  // Note: OpenLayers defaults to "KVP" when requestEncoding is undefined. Hajk has
  // always ended up in the REST code path (the value never reached the source), so
  // "REST" is the safe default for configs saved before requestEncoding was wired up.
  requestEncoding: "REST",
  projection: "EPSG:3006",
  layer: "",
  opacity: 1,
  matrixSet: "3006",
  style: "",
  origins: [[-1200000, 8500000]],
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

const normalizeLegend = (legend, fallbackDescription) => {
  if (!legend) {
    return [];
  }

  const entries = Array.isArray(legend) ? legend : [legend];

  return entries
    .map((entry) => {
      if (typeof entry === "string") {
        return {
          url: entry,
          description: fallbackDescription || "",
        };
      }

      const url = entry?.url || entry?.Url;
      if (!url) {
        return null;
      }

      return {
        ...entry,
        url,
        description: entry?.description || fallbackDescription || "",
      };
    })
    .filter(Boolean);
};

class WMTSLayer {
  constructor(config, proxyUrl, _map) {
    config = {
      ...wmtsLayerProperties,
      ...config,
    };

    this.proxyUrl = proxyUrl;

    const parsedOrigins = (config.origins || []).map((o) =>
      o.map((v) => Number(v))
    );

    let resolutions = config.resolutions.map((r) => Number(r));
    let sizes =
      Array.isArray(config.sizes) && config.sizes.length > 0
        ? config.sizes
        : undefined;
    let matrixIds = config.matrixIds;

    // If there are multiple origins, use the origins array.
    // Otherwise, use the first origin as the origin.
    const tileGridOrigin =
      parsedOrigins.length > 1
        ? { origins: parsedOrigins }
        : { origin: parsedOrigins[0] };

    // "KVP_TEMPLATE" is a Hajk-only encoding: a KVP query string where TileMatrix,
    // TileRow and TileCol are given as {placeholders}. OpenLayers handles that with
    // its REST substitution, so translate before handing the value over.
    const requestEncoding =
      config.requestEncoding === "KVP_TEMPLATE"
        ? "REST"
        : config.requestEncoding;

    const sourceConfig = {
      attributions: config.attribution,
      format: config.imageFormat || "image/png",
      wrapX: false,
      requestEncoding,
      url: config.url,
      layer: config.layer,
      zDirection: -1,
      matrixSet: config.matrixSet,
      style: config.style,
      projection: config.projection,
      tileGrid: new WMTSTileGrid({
        ...tileGridOrigin,
        resolutions,
        matrixIds,
        sizes,
        tileSize: config.tileSize || undefined,
      }),
    };

    // Dimensions are substituted into both KVP params and REST templates, e.g. the
    // {FORMAT_OPTIONS} placeholder GeoServer's GWC puts in its ResourceURLs. Without
    // this, OpenLayers renders such a placeholder as the string "undefined".
    if (config.dimensions && Object.keys(config.dimensions).length > 0) {
      sourceConfig.dimensions = config.dimensions;
    }

    // Only set crossOrigin when explicitly configured. Some WMTS servers
    // do not return CORS headers, and forcing crossOrigin can cause requests
    // to fail instead of behaving like regular image tile loads.
    if (config.crossOrigin !== undefined && config.crossOrigin !== null) {
      sourceConfig.crossOrigin = config.crossOrigin;
    }

    overrideLayerSourceParams(sourceConfig);

    const minZoom = config?.minZoom >= 0 ? config.minZoom : undefined;
    const maxZoom = config?.maxZoom >= 0 ? config.maxZoom : undefined;
    const layerInfo = new LayerInfo({
      ...config,
      legend: normalizeLegend(config.legend, config.caption),
    });

    this.layer = new TileLayer({
      name: config.name,
      caption: config.caption,
      visible: config.visible,
      queryable: config.queryable,
      opacity: config.opacity,
      zIndex: config.zIndex,
      layerType: config.layerType,
      rotateMap: config.rotateMap,
      source: new WMTS(sourceConfig),
      layerInfo,
      minZoom,
      maxZoom,
    });

    this.type = "wmts";
  }
}

export default WMTSLayer;

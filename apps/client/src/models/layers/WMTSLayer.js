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
  highDpiVariants: [],
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

// OpenLayers' own default, used when a grid doesn't state a tile size at all.
const DEFAULT_TILE_SIZE = 256;

// A tileSize may be a single number or a [width, height] pair (Admin's parseTileSize
// emits either) and may arrive as strings straight from JSON. Returns null when there
// is no usable value, so callers can tell "not configured" from an actual size.
const toTileSizePair = (tileSize) => {
  const [width, height] = (
    Array.isArray(tileSize) ? tileSize : [tileSize, tileSize]
  ).map(Number);

  return Number.isFinite(width) &&
    width > 0 &&
    Number.isFinite(height) &&
    height > 0
    ? [width, height]
    : null;
};

// How many image pixels a high-DPI tier packs into one CSS pixel. GeoServer/GWC's "xN"
// gridsets advertise the *same* resolutions as the base grid but with N-times larger
// tiles, so the factor is readable straight off the tile sizes. Returns 1 whenever the
// tier can't be expressed as a uniform density bump, which leaves the grid untouched.
const highDpiTileFactor = (variant, baseTileSize) => {
  const variantSize = toTileSizePair(variant.tileSize);
  // Without the tier's own tile size we can't tell a denser grid from an identical one,
  // and guessing would put the tiles in the wrong place.
  if (!variantSize) {
    return 1;
  }

  const [baseWidth, baseHeight] = toTileSizePair(baseTileSize) || [
    DEFAULT_TILE_SIZE,
    DEFAULT_TILE_SIZE,
  ];
  const [variantWidth, variantHeight] = variantSize;

  // Both axes must scale by the same amount - a single tilePixelRatio can't express
  // anything else.
  const widthFactor = variantWidth / baseWidth;
  if (widthFactor !== variantHeight / baseHeight) {
    return 1;
  }

  // Larger tiles at the base resolutions state their density through the tile size. A
  // tier with base-sized tiles has to be denser through finer resolutions instead, so
  // there we fall back to the configured tier threshold.
  const factor = widthFactor > 1 ? widthFactor : Number(variant.minPixelRatio);
  if (!Number.isFinite(factor) || factor <= 1) {
    return 1;
  }

  // Whole-number densities only, and the logical (CSS) tile has to stay a whole number
  // of pixels - a fractional factor would leave tileSize * resolution only
  // approximately equal to the real tile extent.
  return Number.isInteger(factor) &&
    Number.isInteger(variantWidth / factor) &&
    Number.isInteger(variantHeight / factor)
    ? factor
    : 1;
};

// Pulls the dpi out of a WMTS dimensions object, e.g. { FORMAT_OPTIONS: "dpi:180" }.
const dpiFromDimensions = (dimensions) => {
  const match = /dpi:(\d+(?:\.\d+)?)/i.exec(
    Object.values(dimensions || {}).join(";")
  );
  return match ? Number(match[1]) : null;
};

class WMTSLayer {
  constructor(config, proxyUrl, _map) {
    config = {
      ...wmtsLayerProperties,
      ...config,
    };

    this.proxyUrl = proxyUrl;

    // A server may publish parallel "highDpi" TileMatrixSets (e.g. GeoServer/GWC's
    // "xN" gridsets) with denser resolutions for retina-class screens. Pick the
    // highest tier whose minPixelRatio the current screen satisfies; a tier is
    // self-contained (its own matrixSet/origins/resolutions/matrixIds/sizes/tileSize),
    // never mixed with the standard grid.
    const pixelRatio = window.devicePixelRatio || 1;
    const highDpiVariant = (config.highDpiVariants || [])
      .filter((v) => v && v.matrixSet && v.minPixelRatio <= pixelRatio)
      .sort((a, b) => b.minPixelRatio - a.minPixelRatio)[0];
    const activeGrid = highDpiVariant || config;

    const parsedOrigins = (activeGrid.origins || []).map((o) =>
      o.map((v) => Number(v))
    );

    let resolutions = activeGrid.resolutions.map((r) => Number(r));
    let sizes =
      Array.isArray(activeGrid.sizes) && activeGrid.sizes.length > 0
        ? activeGrid.sizes
        : undefined;
    let matrixIds = activeGrid.matrixIds;
    let tileSize = activeGrid.tileSize || undefined;

    // Translate a high-DPI grid into the CSS-pixel space OpenLayers renders in: the
    // tile grid describes logical pixels, while tilePixelRatio declares how much denser
    // the fetched image actually is. Without it the renderer just scales the bigger
    // image back up (canvasScale = tileResolution / viewResolution * pixelRatio /
    // tilePixelRatio), leaving the tile exactly as soft as a standard one.
    // The requests are unaffected: logical tileSize * logical resolution still equals
    // the real tile extent, so TILEMATRIX/TILEROW/TILECOL resolve to the same tiles.
    const tileFactor = highDpiVariant
      ? highDpiTileFactor(highDpiVariant, config.tileSize)
      : 1;
    if (tileFactor > 1) {
      const [variantWidth, variantHeight] = toTileSizePair(
        highDpiVariant.tileSize
      );
      resolutions = resolutions.map((r) => r * tileFactor);
      tileSize =
        variantWidth === variantHeight
          ? variantWidth / tileFactor
          : [variantWidth / tileFactor, variantHeight / tileFactor];
    } else if (highDpiVariant && !toTileSizePair(highDpiVariant.tileSize)) {
      console.warn(
        `WMTS layer "${config.caption}": the high-DPI tier "${highDpiVariant.matrixSet}" has no usable tileSize, so its pixel density can't be determined and it will render like the standard matrix set.`
      );
    }

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
      matrixSet: activeGrid.matrixSet,
      style: config.style,
      projection: config.projection,
      tileGrid: new WMTSTileGrid({
        ...tileGridOrigin,
        resolutions,
        matrixIds,
        sizes,
        tileSize,
      }),
    };

    if (tileFactor > 1) {
      sourceConfig.tilePixelRatio = tileFactor;
      // When the layer needs reprojecting, OpenLayers budgets the warping error as
      // sourceResolution * threshold. Our resolutions are now logical, i.e. tileFactor
      // times the true image resolution, so the default 0.5 would permit tileFactor
      // times as much error in real image pixels and soften an otherwise crisp tile.
      sourceConfig.reprojectionErrorThreshold = 0.5 / tileFactor;
    }

    // Dimensions are substituted into both KVP params and REST templates, e.g. the
    // {FORMAT_OPTIONS} placeholder GeoServer's GWC puts in its ResourceURLs. Without
    // this, OpenLayers renders such a placeholder as the string "undefined". A high-dpi
    // tier only needs to override the keys that differ (e.g. FORMAT_OPTIONS=dpi:180).
    const dimensions = {
      ...config.dimensions,
      ...highDpiVariant?.dimensions,
    };
    if (Object.keys(dimensions).length > 0) {
      sourceConfig.dimensions = dimensions;
    }

    // A denser tier only keeps its cartography at the intended size if the server also
    // renders it at tileFactor times the dpi. Left unscaled, the tiles arrive crisp but
    // with half-size lines and labels - which reads as a worse bug than blur.
    if (tileFactor > 1) {
      const baseDpi = dpiFromDimensions(config.dimensions);
      const activeDpi = dpiFromDimensions(dimensions);
      if (baseDpi && activeDpi !== baseDpi * tileFactor) {
        console.warn(
          `WMTS layer "${config.caption}": the high-DPI tier "${highDpiVariant.matrixSet}" renders at dpi:${activeDpi} but is ${tileFactor}x denser than the standard matrix set, so lines and labels will not be drawn at their intended size. Expected dpi:${baseDpi * tileFactor}.`
        );
      }
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

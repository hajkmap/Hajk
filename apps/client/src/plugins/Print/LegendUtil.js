import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
import TileWMS from "ol/source/TileWMS";
import ImageWMS from "ol/source/ImageWMS";
import { hfetch } from "../../utils/FetchWrapper";

// ---------------------------------------------------------------------------
// Layer helpers
// ---------------------------------------------------------------------------

// True for TileWMS or ImageWMS layers.
export const isWmsLayer = (layer) => {
  if (!layer || typeof layer.getSource !== "function") return false;
  const source = layer.getSource();
  return (
    (layer instanceof TileLayer && source instanceof TileWMS) ||
    (layer instanceof ImageLayer && source instanceof ImageWMS)
  );
};

// Get WMS URL from source.
const getSourceUrl = (source) => {
  if (!source) return null;
  if (typeof source.getUrls === "function") {
    const urls = source.getUrls();
    if (Array.isArray(urls) && urls.length > 0) return urls[0];
  }
  if (typeof source.getUrl === "function") {
    const url = source.getUrl();
    if (typeof url === "string") return url;
  }
  return source.get?.("url") ?? null;
};

// Convert param value to array.
const paramToList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(",");
  return [];
};

// ---------------------------------------------------------------------------
// GetLegendGraphic URL builder
// ---------------------------------------------------------------------------

// Default GeoServer legend settings.
// https://docs.geoserver.org/latest/en/user/services/wms/get_legend_graphic/index.html#controlling-legend-appearance-with-legend-options
export const DEFAULT_LEGEND_OPTIONS =
  "forceLabels:on;fontAntiAliasing:true;dpi:180";

// Build a GetLegendGraphic URL for one sublayer.
export const buildGetLegendGraphicUrl = ({
  url,
  layer,
  style = "",
  version = "1.0.0",
  format = "image/png",
  legendOptions = DEFAULT_LEGEND_OPTIONS,
}) => {
  if (!url || !layer) return null;

  // Support both absolute and relative URLs.
  const result = new URL(url, window.location.origin);

  // Override existing params if already present.
  result.searchParams.set("SERVICE", "WMS");
  result.searchParams.set("REQUEST", "GetLegendGraphic");
  result.searchParams.set("VERSION", version);
  result.searchParams.set("FORMAT", format);
  result.searchParams.set("LAYER", layer);
  if (style) result.searchParams.set("STYLE", style);
  if (legendOptions) result.searchParams.set("LEGEND_OPTIONS", legendOptions);

  return result.toString();
};

// ---------------------------------------------------------------------------
// Legend info extraction
// ---------------------------------------------------------------------------

// Build legend metadata for a WMS layer.
export const getLegendInfoForLayer = (layer) => {
  if (!isWmsLayer(layer)) return null;

  const source = layer.getSource();
  const params = source.getParams?.() ?? {};
  const baseUrl = getSourceUrl(source);
  const version = params.VERSION || "1.0.0";

  const visibleSublayers = paramToList(params.LAYERS).filter(Boolean);
  // Keep style indexes aligned with layer indexes.
  const activeStyles = paramToList(params.STYLES);

  // Fallback styles from layer config.
  const layersInfo = layer.layersInfo || layer.get("layersInfo") || {};

  // Preconfigured legend URLs, if available.
  const layerInfo = layer.get("layerInfo");
  const configuredLegend = Array.isArray(layerInfo?.legend)
    ? layerInfo.legend
    : [];

  const entries = visibleSublayers.map((sublayer, index) => {

    const style = activeStyles[index] || layersInfo?.[sublayer]?.style || "";
    const configuredEntry = configuredLegend[index];
    const configuredUrl = configuredEntry?.Url ?? configuredEntry?.url ?? null;
    const generatedUrl = buildGetLegendGraphicUrl({
      url: baseUrl,
      layer: sublayer,
      style,
      version,
    });

    return {
      sublayer,
      style,
      configuredUrl,
      generatedUrl,
      getLegendGraphicUrl: configuredUrl || generatedUrl,
    };
  });

  return {
    name: layer.get("name"),
    caption: layer.get("caption"),
    sourceUrl: baseUrl,
    entries,
  };
};

// ---------------------------------------------------------------------------
// Image loading
// ---------------------------------------------------------------------------

// Convert Blob to data URL.
const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

// Read image size from a data URL.
const measureImage = (dataUrl) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });

// Load legend image and return data URL + size.
// Uses hfetch so auth/proxy headers are applied.
const loadImageAsDataUrl = async (url) => {
  if (!url) return null;
  try {
    const response = await hfetch(url);
    if (!response.ok) {
      console.warn(
        `Failed to load legend image (${response.status} ${response.statusText}): ${url}`
      );
      return null;
    }
    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);
    const { width, height } = await measureImage(dataUrl);
    return { dataUrl, width, height };
  } catch (err) {
    console.warn(`Failed to load legend image: ${url}`, err);
    return null;
  }
};

// ---------------------------------------------------------------------------
// PDF layout
// ---------------------------------------------------------------------------

// Legend PDF layout constants (points).
const LEGEND_LAYOUT = {
  MARGIN: 36,
  TITLE_SIZE: 16,
  CAPTION_SIZE: 11,
  GAP_AFTER_TITLE: 18,
  GAP_AFTER_CAPTION: 6,
  GAP_BETWEEN_IMAGES: 4,
  GAP_BETWEEN_LAYERS: 14,
  IMAGE_SCALE: 0.75,
};

// Helper to build pages from top to bottom.
const createPageBuilder = ({ pageWidth, pageHeight, orientation }) => {
  const { MARGIN } = LEGEND_LAYOUT;
  const contentTop = pageHeight - MARGIN;
  const pages = [];
  let elements = [];
  let cursorY = contentTop;

  const flushPage = () => {
    if (elements.length === 0) return;
    pages.push({ width: pageWidth, height: pageHeight, orientation, elements });
    elements = [];
    cursorY = contentTop;
  };

  return {
    get remainingHeight() {
      return cursorY - MARGIN;
    },
    get cursorY() {
      return cursorY;
    },
    push(element, consumedHeight) {
      elements.push(element);
      cursorY -= consumedHeight;
    },
    advance(amount) {
      cursorY -= amount;
    },
    ensureSpace(needed) {
      if (cursorY - needed < MARGIN) flushPage();
    },
    breakPage: flushPage,
    finish() {
      flushPage();
      return pages;
    },
  };
};

// Compute final draw size for one image.
const computeImageSize = (img, { maxWidth, maxHeight }) => {
  const scale = Math.min(LEGEND_LAYOUT.IMAGE_SCALE, maxWidth / img.width);
  let drawWidth = img.width * scale;
  let drawHeight = img.height * scale;
  // If one legend image is taller than a full page content area, shrink it
  // proportionally so it fits within page height (no cropping).
  if (drawHeight > maxHeight) {
    const shrink = maxHeight / drawHeight;
    drawWidth *= shrink;
    drawHeight *= shrink;
  }
  return { drawWidth, drawHeight };
};

// Load and size all legend images for a layer.
const loadLayerImages = async (entries, sizeConstraints) => {
  const results = await Promise.all(
    entries
      .filter((entry) => Boolean(entry.getLegendGraphicUrl))
      .map(async (entry) => {
        const img = await loadImageAsDataUrl(entry.getLegendGraphicUrl);
        if (!img || !img.width || !img.height) return null;
        return { entry, img, ...computeImageSize(img, sizeConstraints) };
      })
  );
  return results.filter(Boolean);
};

// Normalize input to legend info.
const toLegendInfo = (layerOrInfo) => {
  if (!layerOrInfo) return null;
  if (typeof layerOrInfo.getSource !== "function") return layerOrInfo;
  return isWmsLayer(layerOrInfo) ? getLegendInfoForLayer(layerOrInfo) : null;
};

// Build extra PDF pages with layer legends.
export const buildLegendPdfPages = async (
  layers,
  {
    pageWidth,
    pageHeight,
    orientation,
    textColor = { r: 0, g: 0, b: 0 },
    title = "Teckenförklaring",
  }
) => {
  const legendInfos = (layers || []).map(toLegendInfo).filter(Boolean);
  if (legendInfos.length === 0) return [];

  const {
    MARGIN,
    TITLE_SIZE,
    CAPTION_SIZE,
    GAP_AFTER_TITLE,
    GAP_AFTER_CAPTION,
    GAP_BETWEEN_IMAGES,
    GAP_BETWEEN_LAYERS,
  } = LEGEND_LAYOUT;
  const maxImageWidth = pageWidth - MARGIN * 2;
  const maxImageHeight = pageHeight - MARGIN * 2;
  // Max content height on a blank page.
  const fullPageContentHeight = pageHeight - MARGIN * 2;

  const builder = createPageBuilder({ pageWidth, pageHeight, orientation });

  // Title on first legend page.
  builder.push(
    {
      type: "text",
      text: title,
      x: MARGIN,
      y: builder.cursorY - TITLE_SIZE,
      size: TITLE_SIZE,
      fontStyle: "bold",
      color: textColor,
      maxWidth: maxImageWidth,
    },
    TITLE_SIZE + GAP_AFTER_TITLE
  );

  // Add spacing above captions after the first one.
  let anyCaptionDrawn = false;

  for (const info of legendInfos) {
    const heading = info.caption || info.name || "(unnamed layer)";

    // Load images first so we can estimate total block height.
    const loadedImages = await loadLayerImages(info.entries, {
      maxWidth: maxImageWidth,
      maxHeight: maxImageHeight,
    });

    // Total height for all images in this layer, including gaps between them.
    const imagesHeight = loadedImages.reduce(
      (acc, { drawHeight }, i, arr) =>
        acc + drawHeight + (i < arr.length - 1 ? GAP_BETWEEN_IMAGES : 0),
      0
    );
    const blockHeight = CAPTION_SIZE + GAP_AFTER_CAPTION + imagesHeight;

    // Move to a new page if this block can fit there but not here.
    const fitsOnBlankPage = blockHeight <= fullPageContentHeight;
    if (builder.remainingHeight < blockHeight && fitsOnBlankPage) {
      builder.breakPage();
    }

    if (anyCaptionDrawn) builder.advance(GAP_BETWEEN_LAYERS / 2);

    builder.push(
      {
        type: "text",
        text: heading,
        x: MARGIN,
        y: builder.cursorY - CAPTION_SIZE,
        size: CAPTION_SIZE,
        fontStyle: "bold",
        color: textColor,
        maxWidth: maxImageWidth,
      },
      CAPTION_SIZE + GAP_AFTER_CAPTION
    );
    anyCaptionDrawn = true;

    for (const { img, drawWidth, drawHeight } of loadedImages) {
      // Fallback page break for very tall blocks.
      builder.ensureSpace(drawHeight + GAP_BETWEEN_IMAGES);
      builder.push(
        {
          type: "image",
          src: img.dataUrl,
          x: MARGIN,
          y: builder.cursorY - drawHeight,
          width: drawWidth,
          height: drawHeight,
        },
        drawHeight + GAP_BETWEEN_IMAGES
      );
    }

    builder.advance(GAP_BETWEEN_LAYERS);
  }

  return builder.finish();
};

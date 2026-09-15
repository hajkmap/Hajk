import { delay } from "../../utils/Delay";
import { getPointResolution } from "ol/proj";
import { getCenter } from "ol/extent";

import Vector from "ol/layer/Vector";
import View from "ol/View";
import VectorSource from "ol/source/Vector";
import Polygon from "ol/geom/Polygon";
import Feature from "ol/Feature";
import { Translate } from "ol/interaction";
import Collection from "ol/Collection";
import { Style, Stroke, Fill } from "ol/style";

import ImageLayer from "ol/layer/Image";
import TileLayer from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS";
import ImageWMS from "ol/source/ImageWMS";

import {
  PAPER_DIMS_MM,
  PAPER_SIZE_PT,
  buildScaleBarLengths,
} from "./options/defaults";
import {
  getTextHeight,
  getTextWidth,
  wrapTextToLines,
  getCenteredX,
  getRightAlignedPositions,
} from "./layout/textMeasure";

import {
  getFittingScaleBarLength,
  getLengthText,
  getDivLinesArrayAndDivider,
} from "./layout/scaleBarMath";
import {
  getBoundingBoxFromUrl,
  loadImageTile,
  getTileColumn,
  getVersionThreeBoundingBox,
  getVersionOneBoundingBox,
  appendBoundingBox,
  getTileInformation,
} from "./layers/tileMath";
import {
  getImageDataBlobFromUrl,
  getImageForPdfFromUrl,
  generateQR,
} from "./utils/images";
import { getProxiedUrl, toUrlString } from "./utils/proxyUrl";
import {
  getMapScaleFromView,
  findClosestScale,
  calculateScaleResolution,
  getUserFriendlyScale,
} from "./utils/scale";

import { buildLayout } from "./PrintLayout";
import { renderToPdf } from "./PdfRenderer";
import { renderToPng } from "./PngRenderer";
import { buildLegendPdfPages, getLegendInfoForLayer } from "./LegendUtil";

export default class PrintModel {
  constructor(settings) {
    this.proxy = settings.proxy;
    this.map = settings.map;
    this.dims = settings.dims || PAPER_DIMS_MM;
    this.logoUrl = settings.options.logo || "";
    this.northArrowUrl = settings.options.northArrow || "";
    this.logoMaxWidth = settings.options.logoMaxWidth;
    this.includeImageBorder = settings.options.includeImageBorder;
    this.northArrowMaxWidth = settings.options.northArrowMaxWidth;
    this.scales = settings.options.scales;
    this.scaleMeters = settings.options.scaleMeters;
    this.scaleBarLengths = buildScaleBarLengths(this.scales, this.scaleMeters);
    this.copyright = settings.options.copyright || "";
    this.textFontSize = settings.options.textFontSize || 8;
    this.textFontWeight = settings.options.textFontWeight || "normal";
    this.date = settings.options.date || "";
    this.disclaimer = settings.options.disclaimer || "";
    this.localObserver = settings.localObserver;
    this.mapConfig = settings.mapConfig;
    this.mmPerPoint = 2.83465;
    this.scaleText = "";
    this.scalebarMaxWidth = 0;
    this.saveAsType = "";
    // If we want the printed tiles to have correct styling, we have to use
    // custom loaders to make sure that the requests has all the required parameters.
    // If for some reason these tile-loaders shouldn't be used, a setting is exposed.
    this.useCustomTileLoaders = settings.options.useCustomTileLoaders ?? true;
    // Since the WMS-servers cannot handle enormous requests, we have to
    // limit Image-WMS requests. The size below is the maximum tile-size allowed.
    // This max-size is only used if the custom-tile-loaders are used.
    this.maxTileSize = settings.options.maxTileSize || 4096;
    // Hex color value, libPDF expects rgb colors, so this is converted in places.
    this.textColor = settings.options.mapTextColor;
    // Let's keep track of the original view, since we're gonna change the view
    // under the print-process. (And we want to be able to change back to the original one).
    this.originalView = this.map.getView();
    this.originalMapSize = null; // Needed to restore view. It is set when print().

    // Since we will be hiding all tile-layers during the print-process, and add image-layers
    // instead, we have to keep track of what we hide and show.
    this.hiddenLayers = new Set(); // Contains all tile-layers that have been exchanged with image-layers.
    this.addedLayers = new Set(); // Contains the tile-layer-replacements.

    // We must initiate a "print-view" that includes potential "hidden" resolutions.
    // These "hidden" resolutions allows the print-process to zoom more than what the
    // users are allowed (which is required if we want to print in high resolutions).
    this.printView = new View({
      center: this.originalView.getCenter(),
      constrainOnlyCenter: this.mapConfig.constrainOnlyCenter,
      constrainResolution: false,
      maxZoom: 24,
      minZoom: 0,
      projection: this.originalView.getProjection(),
      resolutions: this.mapConfig.allResolutions, // allResolutions includes the "hidden" resolutions
      zoom: this.originalView.getZoom(),
    });
  }

  previewLayer = null;
  previewFeature = null;

  // Used to calculate the margin around the map-image. Change this value to get
  // more or less margin.
  marginAmount = 0.03;

  // Used to store the calculated margin.
  margin = 0;
  textIconsMargin = 0;

  // A flag that's used in "rendercomplete" to ensure that user has not cancelled the request
  pdfCreationCancelled = null;

  // Gets the height in points or pixels of the combined texts in the array with newlines, or just a string.
  getTextHeight = (text, fontSize) => {
    return getTextHeight(text, fontSize, this.saveAsType);
  };

  getRightAlignedPositions = (
    text,
    fontSize,
    xmargin,
    ymargin,
    paperWidth,
    options,
    fontWeight,
    maxWidth
  ) => {
    return getRightAlignedPositions(
      {
        text,
        fontSize,
        xmargin,
        ymargin,
        paperWidth,
        fontWeight,
        maxWidth,
        saveAsType: this.saveAsType,
        northArrowMaxWidth: this.northArrowMaxWidth,
        logoMaxWidth: this.logoMaxWidth,
        mmPerPoint: this.mmPerPoint,
        scalebarMaxWidth: this.scalebarMaxWidth,
      },
      options
    );
  };

  /** Word-wrap text to maxWidth. Honours explicit newlines. */
  wrapTextToLines = (text, fontSize, maxWidth, fontWeight = "normal") => {
    return wrapTextToLines(text, fontSize, maxWidth, fontWeight);
  };

  /** Centred x for text within paperWidth. */
  getCenteredX = (text, fontSize, paperWidth, fontWeight = "normal") => {
    return getCenteredX(text, fontSize, paperWidth, fontWeight);
  };

  getTextWidth = (text, size) => {
    return getTextWidth(text, size);
  };

  /**
   * @summary Returns a Promise which resolves if image loading succeeded.
   * @description The Promise will contain an object with data blob of the loaded image. If loading fails, the Promise rejects
   *
   * @param {*} url
   * @returns {Promise}
   */
  getImageDataBlobFromUrl = (url) => {
    return getImageDataBlobFromUrl(url);
  };

  generateQR = async (url, qrSize) => {
    return generateQR(url, qrSize);
  };

  addPreviewLayer() {
    if (this.previewLayer) return;
    this.previewLayer = new Vector({
      source: new VectorSource(),
      layerType: "system",
      zIndex: 5000,
      name: "pluginPrint",
      caption: "Print layer",
      style: new Style({
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.7)",
          width: 2,
        }),
        fill: new Fill({
          color: "rgba(255, 145, 20, 0.4)",
        }),
      }),
    });
    this.map.addLayer(this.previewLayer);
  }

  getMapScale = () => {
    // We have to make sure to get (and set on the printView) the current zoom
    // of the "original" view. Otherwise, the scale calculation could be wrong
    // since it depends on the static zoom of the printView.
    this.printView.setZoom(this.originalView.getZoom());
    // When this is updated, we're ready to calculate the scale, which depends on the
    // dpi, mpu, inchPerMeter, and resolution.
    return getMapScaleFromView(this.printView);
  };

  getFittingScale = () => {
    //Get map scale
    const proposedScale = this.getMapScale();

    //Get the scale closest to the proposed scale.
    return findClosestScale(proposedScale, this.scales);
  };

  removePreview = () => {
    this.previewFeature = undefined;
    this.previewLayer.getSource().clear();
    this.map.removeInteraction(this.translate);
  };

  getPreviewCenter = () => {
    const extent = this.previewFeature.getGeometry().getExtent();
    return getCenter(extent);
  };

  // Calculates the margin around the map-image depending on
  // the paper dimensions
  getMargin = (paperDim) => {
    const longestSide = Math.max(...paperDim);
    return this.marginAmount * longestSide;
  };

  // Returns an array with the paper dimensions with the selected
  // format and orientation.
  getPaperDim = (format, orientation) => {
    return orientation === "portrait"
      ? [...this.dims[format]].reverse()
      : this.dims[format];
  };

  addPreview(options) {
    const scale = options.scale;
    const format = options.format;
    const orientation = options.orientation;
    const useMargin = options.useMargin;

    // If the user wants text and icons in the margins and outside the map image
    // we should only allow that if margins are used
    const useTextIconsInMargin = useMargin
      ? options.useTextIconsInMargin
      : false;

    const dim = this.getPaperDim(format, orientation);

    this.margin = useMargin ? this.getMargin(dim) : 0;

    //We need a different margin value for text and icons to be placed in the margins,
    //because "this.margin" (above) is sometimes used independently.
    // When useMargin is true but content should NOT go in the margins, the total
    // offset (textIconsMargin + margin) must exceed the white stroke's inward extent
    // (2.75 * margin), requiring textIconsMargin >= 1.75 * margin.
    this.textIconsMargin = useTextIconsInMargin
      ? 0
      : Math.max(6, Math.ceil(1.75 * this.margin));

    const inchInMillimeter = 25.4;
    // We should take pixelRatio into account? What happens when we have
    // pr=2? PixelSize will be 0.14?
    const defaultPixelSizeInMillimeter = 0.28;

    const dpi = inchInMillimeter / defaultPixelSizeInMillimeter; // ~90

    // Here we calculate height and width of preview window based on user and admin selection
    // (ex. if admin wants image border or if user wants margins).
    const calculatedWidth =
      this.includeImageBorder && !options.useMargin ? 1 : this.margin * 2;

    // Match preview to the wider top margin band in PrintLayout (20 vs 16 * margin).
    const calculatedHeight =
      this.includeImageBorder && !options.useMargin
        ? 1
        : options.useTextIconsInMargin && format === "a5"
          ? this.margin * 9
          : options.useTextIconsInMargin
            ? this.margin * 7
            : this.margin * 2;

    //We set the size of preview window based on the calculated heights and widths.
    const size = {
      width: (dim[0] - calculatedWidth) / 25.4,
      height: (dim[1] - calculatedHeight) / 25.4,
    };

    const paper = {
      width: size.width * dpi,
      height: size.height * dpi,
    };

    const center = this.previewFeature
      ? getCenter(this.previewFeature.getGeometry().getExtent())
      : this.map.getView().getCenter();

    // Let's account for projection distortion: in projections like EPSG:3857,
    // 1 map unit != 1 meter (except at the equator).
    // We can grab the resolution at the center point, using getPointResolution,
    // and then use it to scale the width and height of the preview feature (see
    // how we calculate w and y below).
    const pointResolution = getPointResolution(
      this.map.getView().getProjection(),
      1,
      center
    );

    const ipu = 39.37,
      sf = 1,
      w = (((paper.width / dpi / ipu) * scale) / 2 / pointResolution) * sf,
      y = (((paper.height / dpi / ipu) * scale) / 2 / pointResolution) * sf,
      coords = [
        [
          [center[0] - w, center[1] - y],
          [center[0] - w, center[1] + y],
          [center[0] + w, center[1] + y],
          [center[0] + w, center[1] - y],
          [center[0] - w, center[1] - y],
        ],
      ],
      feature = new Feature({
        geometry: new Polygon(coords),
      });

    // Each time print settings change, we actually render a new preview feature,
    // so first let's remove the old one.
    this.removePreview();

    // Now re-add feature, source and interaction to map.
    this.previewFeature = feature;
    this.previewLayer.getSource().addFeature(feature);
    this.translate = new Translate({
      features: new Collection([feature]),
    });
    this.map.addInteraction(this.translate);
  }

  renderPreviewFeature = (previewLayerVisible, options) => {
    if (previewLayerVisible) {
      this.addPreview(options);
    } else {
      this.removePreview();
    }
  };

  /**
   * @summary Helper function that takes a URL and max width and returns the ready data blob as well as width/height which fit into the specified max value.
   *
   * @param {*} url
   * @param {*} maxWidth
   * @returns {Promise<Object>} image data blob, image width, image height
   */
  getImageForPdfFromUrl = async (url, maxWidth) => {
    return getImageForPdfFromUrl(url, maxWidth);
  };

  /**
   * @summary Returns an object stating the x and y position
   * @description Helper function that takes some content and calculates where it should be placed on the canvas
   *
   * @param {*} placement chosen placement on the canvas
   * @param {*} contentWidth
   * @param {*} contentHeight
   * @param {*} pdfWidth
   * @param {*} pdfHeight
   * @returns {Object} x-axis and y-axis placement in mm
   */
  getPlacement = (
    placement,
    contentWidth,
    contentHeight,
    pdfWidth,
    pdfHeight,
    contentType
  ) => {
    // We must take the potential margin around the map-image into account (this.margin)
    // And the extra margin for textIconsMargin.
    // And the extra extra margin for qrcode image
    //
    // The white border is drawn as a stroke centered on the page edge, so its visible
    // inner width = 2.75 * this.margin (half of lineWidth 5.5 * margin in PrintLayout).
    // Using 2.75 * this.margin as the base aligns elements with the map's edge boundary.
    // textIconsMargin adds extra inward padding when elements should NOT be in the margin
    // (textIconsMargin=6); it is 0 when elements intentionally go in the margin.
    const margin = 2.75 * this.margin + this.textIconsMargin;
    // Here we simply say if content that is going to be placed is a qr code...
    // we need to adjust it slightly because the qr code is bigger than the other icons.
    const qrMargin =
      (contentType === "qrCode" && this.textIconsMargin) === 0 ? 3 : 0;

    let pdfPlacement = { x: 0, y: 0 };
    if (placement === "bottomLeft") {
      pdfPlacement.x = margin;
      pdfPlacement.y = margin - qrMargin;
    } else if (placement === "bottomRight") {
      if (contentType === "scaleBar") {
        // Check if the text is longer than the scalebar to get the one with most width.
        const textLength = this.getTextWidth(this.scaleText, this.fontSize);
        // If the contentWidth aka the scalebar and not the text, add some extra padding.
        this.scalebarMaxWidth =
          contentWidth > this.scalebarMaxWidth ? contentWidth + 25 : textLength;
        pdfPlacement.x = pdfWidth - margin - this.scalebarMaxWidth;
        pdfPlacement.y = margin;
      } else {
        pdfPlacement.x = pdfWidth - contentWidth - margin;
        pdfPlacement.y = margin - qrMargin + 10;
      }
    } else if (placement === "topRight") {
      if (contentType === "scaleBar") {
        // Check if the text is longer than the scalebar to get the one with most width.
        const scaleTextWidth = this.getTextWidth(this.scaleText, this.fontSize);
        // If the contentWidth aka the scalebar and not the text, add some extra padding.
        const scalebarMaxWidth =
          contentWidth > scaleTextWidth ? contentWidth + 25 : scaleTextWidth;
        pdfPlacement.x = pdfWidth - margin - scalebarMaxWidth;
        pdfPlacement.y = pdfHeight - contentHeight - margin - 20;
      } else {
        pdfPlacement.x = pdfWidth - contentWidth - margin;
        pdfPlacement.y = pdfHeight - contentHeight - margin + qrMargin;
      }
    } else {
      pdfPlacement.x = margin;
      pdfPlacement.y = pdfHeight - contentHeight - margin + qrMargin;
    }
    return pdfPlacement;
  };

  /**
   * @summary Returns fitting scale bar length depending on the scale
   * @description Helper function that returns a fitting number of meters for the supplied scale.
   *
   * @param {*} scale
   * @returns {Float} Fitting number of meters for current scale.
   */
  getFittingScaleBarLength = (scale) => {
    return getFittingScaleBarLength(this.scaleBarLengths, scale);
  };

  //Formats the text for the scale bar
  getLengthText = (scaleBarLengthMeters) => {
    return getLengthText(scaleBarLengthMeters);
  };

  getDivLinesArrayAndDivider = (scaleBarLengthMeters, scaleBarLength) => {
    return getDivLinesArrayAndDivider(scaleBarLengthMeters, scaleBarLength);
  };

  // Make sure the desired resolution (depending on scale and dpi)
  // works with the current map-setup.
  desiredPrintOptionsOk = (options) => {
    const resolution = options.resolution;
    const scale = options.scale / 1000;
    const desiredResolution = this.getScaleResolution(
      scale,
      resolution,
      this.map.getView().getCenter()
    );

    // The desired options are OK if they result in a resolution bigger than the minimum
    // resolution of the print-view.
    return desiredResolution >= this.printView.getMinResolution();
  };

  getScaleResolution = (scale, resolution, center) => {
    return calculateScaleResolution(
      scale,
      resolution,
      this.map.getView().getProjection(),
      center
    );
  };

  // If the user has selected one of the "special" backgroundLayers (white or black)
  // the backgroundColor of the mapCanvas has changed. We must keep track of this
  // to make sure that the print-results has the same appearance.
  getMapBackgroundColor = () => {
    const currentBackgroundColor =
      document.getElementById("map").style.backgroundColor;
    return currentBackgroundColor !== "" ? currentBackgroundColor : "white";
  };

  // Returns all currently active tile-, and image-layers as an array
  getVisibleTileAndImageLayers = () => {
    return this.map
      .getLayers()
      .getArray()
      .filter((layer) => {
        return layer.getVisible() && this.layerIsTileOrImageLayer(layer);
      });
  };

  // Returns true if the supplied layer is a tiled or an image-based layer.
  layerIsTileOrImageLayer = (layer) => {
    return (
      (layer instanceof TileLayer && layer.getSource() instanceof TileWMS) ||
      (layer instanceof ImageLayer && layer.getSource() instanceof ImageWMS)
    );
  };

  // Returns all currently active image-layers as an array
  getVisibleImageLayers = () => {
    return this.map
      .getLayers()
      .getArray()
      .filter((layer) => {
        return (
          layer.getVisible() &&
          layer instanceof ImageLayer &&
          layer.getSource() instanceof ImageWMS
        );
      });
  };

  // Returns the layer placement (index) in the array of map-layers.
  // The placement is generally the draw-order (unless z-index is set on the layer).
  getLayerPlacementIndex = (layer) => {
    return this.map
      .getLayers()
      .getArray()
      .map((l) => l.get("name"))
      .indexOf(layer.get("name"));
  };

  // Hides the supplied layer and adds another layer with appropriate settings for
  // printing. The added layer is always an image-layer. Why exchange the sources
  // with only image sources? Well, it seems as if OL does some funky stuff with all the tiled sources,
  // leading to an excess of loaded tiles. By making sure to only use image-layers during print, we can
  // make sure we're not requesting too many tiles, and also that the wms-style is applied properly.
  exchangeLayer = (layer) => {
    // Let's run this in a try-catch just in case
    try {
      // Since we're adding a "print-layer", we want to make sure to hide
      // the "real" layer so that we don't show the same information twice.
      layer.setVisible(false);
      // We have to keep track of all the layers that we have hidden, so that
      // we can show them again when the printing is done.
      this.hiddenLayers.add(layer);
      // When we create the new layer, we're gonna need the original source!
      const source = layer.getSource();
      // Let's create a new image-source containing all the options from the supplied source
      // along with some additional settings. We make sure to set the ratio to one (1) so that
      // OL does not load more data than necessary, and we also make sure to disable hiDpi!
      // (Otherwise the print-process will fetch more pixels than necessary).
      const imageSource = new ImageWMS({
        ...source.getProperties(),
        projection: source.getProjection(),
        crossOrigin: source.crossOrigin || source.crossOrigin_ || "anonymous", // `crossOrigin` is not always publicly available for some reason... Had to use the private property as fallback
        params: { ...source.getParams() },
        ratio: 1,
        hidpi: false,
      });
      // We have to make sure to check the current layer-opacity and use that
      // opacity-value on the new layer.
      const layerOpacity = layer.getOpacity() ?? 1;
      // Then we can create the new image-layer with the new image-source.
      const imageLayer = new ImageLayer({
        opacity: layerOpacity,
        source: imageSource,
        zIndex: layer.getZIndex(),
      });
      // Finally we add the new layer to the map... First we have to check where
      // the original layer was placed (so that it keeps its draw-order).
      const layerPlacement = this.getLayerPlacementIndex(layer);
      // Then we can add the layer...
      this.map.getLayers().insertAt(layerPlacement, imageLayer);
      // ... and update the array containing the added layers so that we can remove
      // them when the printing process is completed.
      this.addedLayers.add(imageLayer);
    } catch (error) {
      console.error(
        `Failed to exchange the supplied layer with a print-layer! Error: ${error}`
      );
    }
  };

  // Returns a string representing the bounding-box found in the 'BBOX'
  // query-parameter in the supplied url.
  getBoundingBoxFromUrl = (url) => {
    return getBoundingBoxFromUrl(url);
  };

  // Loads an image (tile) and draws it on the supplied canvas-context
  loadImageTile = (canvas, tileOptions) => {
    return loadImageTile(canvas, tileOptions);
  };

  // Creates tile-information-objects for a column (all tiles needed to fill
  // up to the target-height).
  getTileColumn = (targetHeight, x, tileWidth) => {
    return getTileColumn(targetHeight, x, tileWidth, this.maxTileSize);
  };

  // Returns a string representing the bounding-box for the supplied tile.
  // (WMS-version 1.3.0, see layers/tileMath.js for details.)
  getVersionThreeBoundingBox = (tile, bBox, height, width) => {
    return getVersionThreeBoundingBox(tile, bBox, height, width);
  };

  // Returns a string representing the bounding-box for the supplied tile.
  // (WMS-version 1.1.1, see layers/tileMath.js for details.)
  getVersionOneBoundingBox = (tile, bBox, height, width) => {
    return getVersionOneBoundingBox(tile, bBox, height, width);
  };

  // Appends a bounding-box to each tile-information-object.
  appendBoundingBox = (tiles, bBox, height, width, wmsVersion) => {
    return appendBoundingBox(tiles, bBox, height, width, wmsVersion);
  };

  // Returns an URL object from the src string, prepended with proxy if any.
  getURL = (src) => {
    return getProxiedUrl(this.proxy, src);
  };

  // Returns a string with the complete URL, removing fake base if any.
  toURLString = (url) => {
    return toUrlString(url);
  };

  // Returns an array of objects containing information regarding the tiles
  // that should be created to comply with the 'MAX_TILE_SIZE' and also
  // 'fill' the image.
  getTileInformation = (height, width, url) => {
    return getTileInformation(height, width, url, this.maxTileSize);
  };

  // Updates the parameters of the supplied layer to make sure we
  // request the images in the correct DPI for the print! This function
  // only handles image-layers.
  prepareImageLayer = (layer, options) => {
    // Let's run this in a try-catch just in case
    try {
      // We're gonna need to grab the layer-source
      const source = layer.getSource();
      // We have to update the image-loading-function (so that the current print-DPI is taken
      // into consideration).
      source.setImageLoadFunction((image, src) => {
        // Let's create an URL-object so that we can easily grab and alter search-parameters.
        const url = this.getURL(src);
        const searchParams = url.searchParams;
        // We have to make sure to update the search-parameters to include dpi-settings.
        searchParams.set("DPI", options.resolution);
        searchParams.set("MAP_RESOLUTION", options.resolution);
        searchParams.set("FORMAT_OPTIONS", `dpi:${options.resolution}`);
        // We're gonna need to grab the width and height so that we can make sure the
        // requested image is not too large for the WMS-server to render. (If we're requesting
        // too many pixels at a high DPI the server will not be able to create the image).
        const height = parseFloat(searchParams.get("HEIGHT")) || 1;
        const width = parseFloat(searchParams.get("WIDTH")) || 1;
        // What will be too complex for the WMS-servers? Good question. For now,
        // we say that the image is too complex if either the height or width is larger than
        // 'this.maxTileSize' (around 4096 probably).
        if (Math.max(height, width) > this.maxTileSize) {
          // If the image is too complex, we have to create tiles that are no more than 'this.maxTileSize'
          // wide or high. Let's gather some tile-information to begin with.
          const tiles = this.getTileInformation(height, width, url);
          // Then we'll create a canvas that we can use to draw the tile-images on.
          const canvas = document.createElement("canvas");
          // The canvas must be as big as the originally requested image was.
          canvas.width = width;
          canvas.height = height;
          // Let's declare an array that we can use to store all the promises created when
          // requesting the tile-images.
          const promises = [];
          // Then, for each tile-information-object, we'll create a request-url containing the
          // information that we've gathered (such as the size and bounding-box).
          for (const tile of tiles) {
            const tileUrl = this.getURL(url.toString());
            tileUrl.searchParams.set("BBOX", tile.bBox);
            tileUrl.searchParams.set("HEIGHT", tile.tileHeight);
            tileUrl.searchParams.set("WIDTH", tile.tileWidth);
            // Then we'll fetch the images from the WMS-server
            promises.push(
              this.loadImageTile(canvas, {
                ...tile,
                url: this.toURLString(tileUrl),
              })
            );
          }
          // When all image-promises has settled, we can set the image to the canvas on which we've
          // added all the tile-images.
          Promise.allSettled(promises).then(() => {
            image.getImage().src = canvas.toDataURL();
          });
        } else {
          // If the request is not too complex, we can fetch it right away.
          image.getImage().src = this.toURLString(url);
        }
      });
    } catch (error) {
      console.error(
        `Failed to update the DPI-options while creating print-image (Single-tile WMS). Error: ${error}`
      );
    }
  };

  // Since we're allowing the user to print the map with different DPI-options,
  // the layers that are about to be printed must be prepared. The preparation consists
  // of settings the DPI-parameters so that we ensure that we are sending proper WMS-requests.
  // (If we would print with 300 dpi, and just let OL send an ordinary request, the images returned
  // from the server would not show the correct layout for 300 DPI usage).
  // To do this, we first make sure to exchange all visible layers with "prepared image-layers". This is done since
  // OL seems to do some funky stuff to the tile-layers, and image-layers gives us more control.
  // TODO: Vector-layers, for example from the draw-plugin, must be handled as well. Otherwise, the text
  // on vector-layers will be very small when printing with high DPI.
  prepareActiveLayersForPrint = (options) => {
    // First we have to exchange all visible tile-, and image-layers for "print-image-layers".
    for (const layer of this.getVisibleTileAndImageLayers()) {
      this.exchangeLayer(layer, options);
    }
    // Then we have to "prepare" all currently visible image-layers. Note that all currently
    // visible image-layers will be layers created in the method above! (Since all other image-layers
    // has been turned off. They will be turned back on when the printing is complete).
    for (const imageLayer of this.getVisibleImageLayers()) {
      this.prepareImageLayer(imageLayer, options);
    }
  };

  // Since we've been adding and hiding layers while printing, we have to make sure to reset
  // everything back to normal!
  resetPrintLayers = () => {
    // Since we have been hiding all tile- and image-layers and exchanged them with
    // "print-image-layers", we have to make sure to:
    // 1. Show the original layers again
    for (const layer of this.hiddenLayers) {
      layer.setVisible(true);
    }
    // 2. Remove the added image-layers
    for (const layer of this.addedLayers) {
      this.map.removeLayer(layer);
    }
    // When all layers has been reset and so on, we'll have to reset the collections
    // containing the added/hidden layers.
    this.hiddenLayers = new Set();
    this.addedLayers = new Set();
  };

  // Renders every canvas found in OpenLayer's viewport onto a single,
  // print-sized canvas and returns it as a PNG data URL.
  snapshotMapCanvas = (width, height) => {
    // Create the map canvas that will hold all of our map tiles
    const mapCanvas = document.createElement("canvas");

    // Set canvas dimensions to the newly calculated ones that take user's desired resolution etc into account
    mapCanvas.width = width;
    mapCanvas.height = height;

    const mapContext = mapCanvas.getContext("2d");
    const backgroundColor = this.getMapBackgroundColor(); // Make sure we use the same background-color as the map
    mapContext.fillStyle = backgroundColor;
    mapContext.fillRect(0, 0, width, height);

    // Each canvas element inside OpenLayer's viewport should get printed
    document.querySelectorAll(".ol-viewport canvas").forEach((canvas) => {
      if (canvas.width > 0) {
        const opacity = canvas.parentNode.style.opacity;
        mapContext.globalAlpha = opacity === "" ? 1 : Number(opacity);
        // Get the transform parameters from the style's transform matrix
        if (canvas.style.transform) {
          const matrix = canvas.style.transform
            .match(/^matrix\(([^(]*)\)$/)[1]
            .split(",")
            .map(Number);
          // Apply the transform to the export map context
          CanvasRenderingContext2D.prototype.setTransform.apply(
            mapContext,
            matrix
          );
        }
        mapContext.drawImage(canvas, 0, 0);
      }
    });

    return mapCanvas.toDataURL("image/png");
  };

  // Returns the page size (in PDF points) for the selected format, flipped
  // according to the selected orientation. Falls back to A4.
  resolvePageSizeInPoints = (format, orientation) => {
    // Assign our pagewidth and heights
    let pageWidth = PAPER_SIZE_PT[format]?.width ?? PAPER_SIZE_PT.a4.width;
    let pageHeight = PAPER_SIZE_PT[format]?.height ?? PAPER_SIZE_PT.a4.height;

    // Flip depending on orientation
    return {
      pageWidth: orientation === "landscape" ? pageWidth : pageHeight,
      pageHeight: orientation === "landscape" ? pageHeight : pageWidth,
    };
  };

  // Renders the layout elements using the renderer matching the selected
  // output type. For PDF, the resulting file is downloaded and null is
  // returned; for PNG/BLOB a blob is returned.
  saveOutput = async ({
    elements,
    options,
    width,
    height,
    fileName,
    legendInfosForPdf,
    pageWidth,
    pageHeight,
    orientation,
  }) => {
    if (options.saveAsType === "PDF") {
      // Build one or more extra pages listing the WMS legends for
      // each visible layer, appended after the map page.
      // Note: we intentionally don't pass `options.mapTextColorNormRgb`
      // here – that color is chosen by the user for text overlaid on
      // the map image (often white, so it pops on dark aerial
      // backgrounds), which would be invisible on the plain white
      // legend page. Let the helper's default (black) take over.
      const legendPages = await buildLegendPdfPages(legendInfosForPdf, {
        pageWidth,
        pageHeight,
        orientation,
      });
      const pdf = await renderToPdf(
        elements,
        pageWidth,
        pageHeight,
        orientation,
        legendPages
      );
      const bytes = await pdf.save();
      const pdfBlob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      return null;
    } else {
      // PNG or BLOB
      return await renderToPng(
        elements,
        pageWidth,
        pageHeight,
        width,
        height,
        fileName,
        options.saveAsType
      );
    }
  };

  print = async (options) => {
    return new Promise((resolve, reject) => {
      this.saveAsType = options.saveAsType;
      const windowUrl = window.location.href;
      const format = options.format;
      const orientation = options.orientation;
      const resolution = options.resolution;
      const scale = options.scale / 1000;

      this.textColor = options.mapTextColorNormRgb;

      // Snapshot the legend info for the layers that are about to be
      // printed. We resolve it *now* (before `prepareActiveLayersForPrint`
      // swaps originals for temporary image layers and hides the source
      // layers) so the legend set matches what the user actually sees on
      // the map – otherwise the originals would have `visible=false` by the
      // time the PDF renderer runs.
      const legendInfosForPdf = options.includeLegendsInPdf
        ? this.getVisibleTileAndImageLayers()
            .map((layer) => getLegendInfoForLayer(layer))
            .filter(Boolean)
        : [];

      // Our dimensions are for landscape orientation by default. Flip the values if portrait orientation requested.
      const dim =
        orientation === "portrait"
          ? [...this.dims[format]].reverse()
          : this.dims[format];

      const width = Math.round((dim[0] * resolution) / 25.4);
      const height = Math.round((dim[1] * resolution) / 25.4);

      // Since we're allowing the users to choose which DPI they want to print the map
      // in, we have to make sure to prepare the layers so that they are fetched with
      // the correct DPI-settings! We're only doing this if we're supposed to. An admin
      // might choose not to use this functionality (useCustomTileLoaders set to false).
      this.useCustomTileLoaders && this.prepareActiveLayersForPrint(options);

      // Before we're printing we must make sure to change the map-view from the
      // original one, to the print-view.
      this.printView.setCenter(this.originalView.getCenter());
      this.map.setView(this.printView);

      // Store mapsize, it's needed when map is restored after print or cancel.
      this.originalMapSize = this.map.getSize();

      const scaleResolution = this.getScaleResolution(
        scale,
        resolution,
        this.map.getView().getCenter()
      );

      // Save some of our values that are necessary to use if user want to cancel the process

      this.map.once("rendercomplete", async () => {
        if (this.pdfCreationCancelled === true) {
          this.pdfCreationCancelled = false;
          resolve(null);
          return false;
        }

        // This is needed to prevent some buggy output from some browsers
        // when a lot of tiles are being rendered (it could result in black
        // canvas PDF)
        await delay(500);

        const dataUrl = this.snapshotMapCanvas(width, height);
        const { pageWidth, pageHeight } = this.resolvePageSizeInPoints(
          format,
          orientation
        );

        try {
          // Build the shared layout (renderer-agnostic element list)
          const elements = await buildLayout(
            this,
            dataUrl,
            options,
            pageWidth,
            pageHeight,
            scaleResolution,
            windowUrl
          );

          const fileName = `Kartexport - ${new Date().toLocaleString()}`;
          const blob = await this.saveOutput({
            elements,
            options,
            width,
            height,
            fileName,
            legendInfosForPdf,
            pageWidth,
            pageHeight,
            orientation,
          });

          this.localObserver.publish("print-completed");
          resolve(blob);
        } catch (error) {
          console.error("Error processing print:", error);
          this.localObserver.publish("print-failed-to-save");
          reject(error);
        } finally {
          // Reset the DPI-prepared print layers back to the originals.
          // Must happen here (after render) rather than before the render,
          // otherwise the WMS layers never receive the DPI parameters.
          this.useCustomTileLoaders && this.resetPrintLayers();
          this.restoreOriginalView();
        }
      });

      // Get print center from preview feature's center coordinate
      const printCenter = getCenter(
        this.previewFeature.getGeometry().getExtent()
      );

      // Hide our preview feature so it won't get printed
      this.previewLayer.setVisible(false);

      // Set map size and resolution, this will initiate print, as we have a listener for renderComplete.
      // (Which will fire when the new size and resolution has been set and the new tiles has been loaded).
      this.map.getTargetElement().style.width = `${width}px`;
      this.map.getTargetElement().style.height = `${height}px`;
      this.map.updateSize();
      this.map.getView().setCenter(printCenter);
      this.map.getView().setResolution(scaleResolution);
    });
  };

  restoreOriginalView = () => {
    this.previewLayer.setVisible(true);
    this.map.setSize(this.originalMapSize);
    this.map.getTargetElement().style.width = "";
    this.map.getTargetElement().style.height = "";
    this.map.updateSize();
    this.map.setView(this.originalView);
  };

  cancelPrint = () => {
    // Set this flag to prevent "rendercomplete" from firing
    this.pdfCreationCancelled = true;

    // Reset map to how it was before print
    this.restoreOriginalView();
    // Reset the layer-settings to how it was before print.
    // (Should only be done if custom loaders has been used).
    this.useCustomTileLoaders && this.resetPrintLayers();
  };

  /**
   * @description Using toLocalString for sv-SE is the easiest way to get space as thousand separator.
   *
   * @param {*} scale Number that will be prefixed with "1:"
   * @returns {string} Input parameter, prefixed by "1:" and with spaces as thousands separator, e.g "5000" -> "1:5 000".
   */
  getUserFriendlyScale = (scale) => {
    return getUserFriendlyScale(scale);
  };
}

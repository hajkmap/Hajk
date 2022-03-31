import { delay } from "../../utils/Delay";
import { getPointResolution } from "ol/proj";
import { getCenter } from "ol/extent";
import jsPDF from "jspdf";
import * as PDFjs from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

import Vector from "ol/layer/Vector.js";
import View from "ol/View";
import VectorSource from "ol/source/Vector.js";
import Polygon from "ol/geom/Polygon";
import Feature from "ol/Feature.js";
import { Translate } from "ol/interaction.js";
import Collection from "ol/Collection";
import { Style, Stroke, Fill } from "ol/style.js";
import { saveAs } from "file-saver";
import ImageLayer from "ol/layer/Image";
import TileLayer from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS";
import ImageWMS from "ol/source/ImageWMS";

export default class PrintModel {
  constructor(settings) {
    this.map = settings.map;
    this.dims = settings.dims;
    this.logoUrl = settings.options.logo ?? "";
    this.northArrowUrl = settings.options.northArrow ?? "";
    this.logoMaxWidth = settings.options.logoMaxWidth;
    this.scales = settings.options.scales;
    this.copyright = settings.options.copyright ?? "";
    this.disclaimer = settings.options.disclaimer ?? "";
    this.localObserver = settings.localObserver;
    this.mapConfig = settings.mapConfig;
    // Since the WMS-servers cannot handle enormous requests, we have to
    // limit Image-WMS requests. The size below is the maximum tile-size allowed.
    this.maxTileSize = 4096;

    // Let's keep track of the original view, since we're gonna change the view
    // under the print-process. (And we want to be able to change back to the original one).
    this.originalView = this.map.getView();
    this.originalMapSize = null; // Needed to restore view. It is set when print().

    // We're gonna need to keep a map containing the original layer parameters (since we will
    // change some parameters such as requested dpi and so on).
    this.originalLayerParams = new Map();

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

  scaleBarLengths = {
    100: 2.5,
    200: 5,
    250: 10,
    400: 20,
    500: 25,
    1000: 50,
    2000: 75,
    2500: 100,
    5000: 250,
    10000: 500,
    25000: 1000,
    50000: 2500,
    100000: 5000,
    200000: 10000,
  };

  previewLayer = null;
  previewFeature = null;

  // Used to calculate the margin around the map-image. Change this value to get
  // more or less margin.
  marginAmount = 0.03;

  // Used to store the calculated margin.
  margin = 0;
  // A flag that's used in "rendercomplete" to ensure that user has not cancelled the request
  pdfCreationCancelled = null;

  addPreviewLayer() {
    this.previewLayer = new Vector({
      source: new VectorSource(),
      name: "preview-layer",
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
    //  of the "original" view. Otherwise, the scale calculation could be wrong
    // since it depends on the static zoom of the printView.
    this.printView.setZoom(this.originalView.getZoom());
    // When this is updated, we're ready to calculate the scale, which depends on the
    // dpi, mpu, inchPerMeter, and resolution. (TODO: (@hallbergs) Clarify these calculations).
    const dpi = 25.4 / 0.28,
      mpu = this.printView.getProjection().getMetersPerUnit(),
      inchesPerMeter = 39.37,
      res = this.printView.getResolution();

    return res * mpu * inchesPerMeter * dpi;
  };

  getFittingScale = () => {
    //Get map scale
    const proposedScale = this.getMapScale();

    //Get the scale closest to the proposed scale.
    return this.scales.reduce((prev, curr) => {
      return Math.abs(curr - proposedScale) < Math.abs(prev - proposedScale)
        ? curr
        : prev;
    });
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
    const dim = this.getPaperDim(format, orientation);

    this.margin = useMargin ? this.getMargin(dim) : 0;

    const inchInMillimeter = 25.4;
    // We should take pixelRatio into account? What happens when we have
    // pr=2? PixelSize will be 0.14?
    const defaultPixelSizeInMillimeter = 0.28;
    const dpi = inchInMillimeter / defaultPixelSizeInMillimeter; // ~90

    const size = {
      width: (dim[0] - this.margin * 2) / 25.4,
      height: (dim[1] - this.margin * 2) / 25.4,
    };

    const paper = {
      width: size.width * dpi,
      height: size.height * dpi,
    };

    const center = this.previewFeature
      ? getCenter(this.previewFeature.getGeometry().getExtent())
      : this.map.getView().getCenter();

    const ipu = 39.37,
      sf = 1,
      w = (((paper.width / dpi / ipu) * scale) / 2) * sf,
      y = (((paper.height / dpi / ipu) * scale) / 2) * sf,
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
   * @summary Returns a Promise which resolves if image loading succeeded.
   * @description The Promise will contain an object with data blob of the loaded image. If loading fails, the Promise rejects
   *
   * @param {*} url
   * @returns {Promise}
   */
  getImageDataBlobFromUrl = (url) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.setAttribute("crossOrigin", "anonymous"); //getting images from external domain

      // We must resolve the promise even if
      image.onerror = function (err) {
        reject(err);
      };

      // When load succeeds
      image.onload = function () {
        const imgCanvas = document.createElement("canvas");
        imgCanvas.width = this.naturalWidth;
        imgCanvas.height = this.naturalHeight;

        // Draw the image on canvas so that we can read the data blob later on
        imgCanvas.getContext("2d").drawImage(this, 0, 0);

        resolve({
          data: imgCanvas.toDataURL("image/png"), // read data blob from canvas
          width: imgCanvas.width, // also return dimensions so we can use them later
          height: imgCanvas.height,
        });
      };

      // Go, load!
      image.src = url;
    });
  };
  /**
   * @summary Helper function that takes a URL and max width and returns the ready data blob as well as width/height which fit into the specified max value.
   *
   * @param {*} url
   * @param {*} maxWidth
   * @returns {Object} image data blob, image width, image height
   */
  getImageForPdfFromUrl = async (url, maxWidth) => {
    // Use the supplied logo URL to get img data blob and dimensions
    const {
      data,
      width: sourceWidth,
      height: sourceHeight,
    } = await this.getImageDataBlobFromUrl(url);

    // We must ensure that the logo will be printed with a max width of X, while keeping the aspect ratio between width and height
    const ratio = maxWidth / sourceWidth;
    const width = sourceWidth * ratio;
    const height = sourceHeight * ratio;
    return { data, width, height };
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
    pdfHeight
  ) => {
    // We must take the potential margin around the map-image into account (this.margin)
    const margin = 6 + this.margin;
    let pdfPlacement = { x: 0, y: 0 };
    if (placement === "topLeft") {
      pdfPlacement.x = margin;
      pdfPlacement.y = margin;
    } else if (placement === "topRight") {
      pdfPlacement.x = pdfWidth - contentWidth - margin;
      pdfPlacement.y = margin;
    } else if (placement === "bottomRight") {
      pdfPlacement.x = pdfWidth - contentWidth - margin;
      pdfPlacement.y = pdfHeight - contentHeight - margin;
    } else {
      pdfPlacement.x = margin;
      pdfPlacement.y = pdfHeight - contentHeight - margin;
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
    const length = this.scaleBarLengths[scale];
    if (length) {
      return length;
    } else {
      if (scale < 250) {
        return 5;
      } else if (scale < 2500) {
        return scale * 0.02;
      } else {
        return scale * 0.05;
      }
    }
  };

  //Formats the text for the scale bar
  getLengthText = (scaleBarLengthMeters) => {
    let units = "m";
    if (scaleBarLengthMeters > 1000) {
      scaleBarLengthMeters /= 1000;
      units = "km";
    }
    return `${Number(scaleBarLengthMeters).toLocaleString("sv-SE")} ${units}`;
  };

  drawScaleBar = (
    pdf,
    scaleBarPosition,
    color,
    scaleBarLength,
    scale,
    scaleBarLengthMeters,
    format,
    orientation
  ) => {
    const lengthText = this.getLengthText(scaleBarLengthMeters);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(color);
    pdf.setLineWidth(0.25);
    pdf.text(
      lengthText,
      scaleBarPosition.x + scaleBarLength + 1,
      scaleBarPosition.y + 4
    );
    pdf.setFontSize(10);
    pdf.text(
      `Skala: ${this.getUserFriendlyScale(
        scale
      )} (vid ${format.toUpperCase()} ${
        orientation === "landscape" ? "liggande" : "stående"
      })`,
      scaleBarPosition.x,
      scaleBarPosition.y + 1
    );

    pdf.setDrawColor(color);
    pdf.line(
      scaleBarPosition.x,
      scaleBarPosition.y + 3,
      scaleBarPosition.x + scaleBarLength,
      scaleBarPosition.y + 3
    );
    pdf.line(
      scaleBarPosition.x,
      scaleBarPosition.y + 2,
      scaleBarPosition.x,
      scaleBarPosition.y + 4
    );
    pdf.line(
      scaleBarPosition.x + scaleBarLength,
      scaleBarPosition.y + 2,
      scaleBarPosition.x + scaleBarLength,
      scaleBarPosition.y + 4
    );
    pdf.line(
      scaleBarPosition.x + scaleBarLength / 2,
      scaleBarPosition.y + 2.5,
      scaleBarPosition.x + scaleBarLength / 2,
      scaleBarPosition.y + 3.5
    );
  };

  addScaleBar = (
    pdf,
    color,
    scale,
    resolution,
    scaleBarPlacement,
    scaleResolution,
    format,
    orientation
  ) => {
    const millimetersPerInch = 25.4;
    const pixelSize = millimetersPerInch / resolution / scaleResolution;
    const scaleBarLengthMeters = this.getFittingScaleBarLength(scale);

    const scaleBarLength = scaleBarLengthMeters * pixelSize;
    const scaleBarHeight = 6;

    const scaleBarPosition = this.getPlacement(
      scaleBarPlacement,
      scaleBarLength + 9,
      scaleBarHeight,
      pdf.internal.pageSize.width,
      pdf.internal.pageSize.height
    );

    this.drawScaleBar(
      pdf,
      scaleBarPosition,
      color,
      scaleBarLength,
      scale,
      scaleBarLengthMeters,
      format,
      orientation
    );
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
    return (
      scale /
      getPointResolution(
        this.map.getView().getProjection(),
        resolution / 25.4,
        center
      )
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

  // Returns all currently active tile-layers as an array
  getVisibleTileLayers = () => {
    return this.map
      .getLayers()
      .getArray()
      .filter((layer) => {
        return (
          layer.getVisible() &&
          layer instanceof TileLayer &&
          layer.getSource() instanceof TileWMS
        );
      });
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

  // Updates the parameters of the supplied layer to make sure we
  // request the images in the correct DPI for the print! This function
  // only handles tile-layers.
  prepareTileLayer = (layer, options) => {
    // Let's run this in a try-catch just in case
    try {
      // We're gonna need to grab the layer-source
      const source = layer.getSource();
      // Let's also grab the layer id, so that we can use that as a key in the map
      // containing all the original layer parameters. The id is stored in the name-
      // property, wonderful!
      const layerId = layer.get("name");
      // Get the original DPI-source-parameters
      const { DPI, MAP_RESOLUTION, FORMAT_OPTIONS } = source.getParams();
      // and store them (so that we can reset the source params when the printing is done).
      this.originalLayerParams.set(layerId, {
        DPI,
        MAP_RESOLUTION,
        FORMAT_OPTIONS,
      });
      // Then we'll update the DPI-parameters to match the user-chosen DPI.
      // Why three different options? Well, each server-type has chosen a different implementation,
      // and to make sure we send requests that work for all these servers, we just pile all settings
      // on each request (this is how Qgis does it as well, so it cant be that bad, right?).
      source.updateParams({
        DPI: options.resolution,
        MAP_RESOLUTION: options.resolution,
        FORMAT_OPTIONS: `dpi:${options.resolution}`,
      });
    } catch (error) {
      console.error(
        `Failed to update the DPI-options while creating print-image (Tiled WMS). Error: ${error}`
      );
    }
  };

  // Resets (applies the original parameters on) the supplied tile-layer.
  resetTileLayer = (layer) => {
    // Let's run this in a try-catch just in case
    try {
      // We're gonna need to grab the layer-source
      const source = layer.getSource();
      // We're gonna need the id so that we can grab the original parameters from
      // the map.
      const layerId = layer.get("name");
      // Let's grab the original parameters...
      const originalParams = this.originalLayerParams.get(layerId);
      // ...and update the source with them!
      source.updateParams(originalParams);
    } catch (error) {
      console.warn(
        `Failed to reset a tile-layer after printing. Error: {error}`
      );
    }
  };

  // Returns an array of floats representing the bounding box found
  // in the 'BBOX' query-parameter in the supplied url.
  getBoundingBoxFromUrl = (url) => {
    return url.searchParams
      .get("BBOX")
      .split(",")
      .map((coord) => parseFloat(coord));
  };

  // Loads an image (tile) and draws it on the supplied canvas-context
  loadImageTile = (canvas, tileOptions) => {
    // We have to get the context so that we can draw the image
    const ctx = canvas.getContext("2d");
    // Then we need some tile-information
    const { url, x, y, tileWidth, tileHeight } = tileOptions;
    // Let's return a promise...
    return new Promise((resolve, reject) => {
      // Let's create an image-element
      const tile = document.createElement("img");
      tile.onload = () => {
        // When the tile has loaded, we can draw the tile on the canvas.
        ctx.drawImage(tile, x, y, tileWidth, tileHeight);
        // The promise can be resolved when the tile has been fetched and
        // drawn on the canvas.
        resolve();
      };
      // If the fetch fails, we have to reject the promise.
      tile.onerror = () => {
        reject();
      };
      // Let's set the cross-origin-attribute to prevent cors-problems
      tile.crossOrigin = "anonymous";
      // Then we'll set the url so that the image can be fetched.
      tile.src = url;
    });
  };

  // Creates tile-information-objects for a column (all tiles needed to fill
  // up to the target-height).
  getTileColumn = (targetHeight, x, tileWidth) => {
    // We're gonna need to store the tile-information in an array
    const tiles = [];
    // We'll iterate (and push tiles to the tile-array) until...
    while (true) {
      // ... we've reached the target-height. Let's summarize all tile-height
      // so that we can check if we're done.
      const accHeight = tiles.reduce((acc, curr) => acc + curr.tileHeight, 0);
      // If we are, we can return the array of tile-information
      if (accHeight >= targetHeight) return tiles;
      // Otherwise we'll calculate how many pixels are left...
      const remainingHeight = targetHeight - accHeight;
      // And either create a tile with that height (or the max-height if the remainder is too large).
      const tileHeight =
        remainingHeight > this.maxTileSize ? this.maxTileSize : remainingHeight;
      // Then we have to calculate where the tile is to be placed on the canvas later.
      const y = targetHeight - accHeight - tileHeight;
      // And finally we'll push the information to the array.
      tiles.push({
        x,
        y,
        tileWidth,
        tileHeight,
      });
    }
  };

  // Appends a bounding-box to each tile-information-object.
  appendBoundingBox = (tiles, bBox, height, width, wmsVersion) => {
    // We have to know how much the northing and easting change per pixel, so that we
    // can calculate proper bounding-boxes for the new tiles.
    const northingChangePerPixel = (bBox[3] - bBox[1]) / height;
    const eastingChangePerPixel = (bBox[2] - bBox[0]) / width;
    // Then we can calculate the bounding box for each tile. The calculations might seem
    // a bit messy. One reason for this is that the x- and y-values for the tiles are
    // set to match how images are added to a canvas, and those coordinates go the opposite
    // direction compared to the map-coordinate-axels.
    // See: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
    for (const tile of tiles) {
      if (typeof wmsVersion === "string" && wmsVersion.includes("3")) {
        tile.bBox = `${
          bBox[1] + northingChangePerPixel * (height - tile.y - tile.tileHeight)
        },${bBox[0] + eastingChangePerPixel * tile.x},${
          bBox[1] + (height - tile.y) * northingChangePerPixel
        }, ${bBox[0] + (tile.x + tile.tileWidth) * eastingChangePerPixel}`;
      } else {
        tile.bBox = `${bBox[0] + eastingChangePerPixel * tile.x},${
          bBox[1] + northingChangePerPixel * (height - tile.y - tile.tileHeight)
        },${bBox[0] + (tile.x + tile.tileWidth) * eastingChangePerPixel},${
          bBox[1] + (height - tile.y) * northingChangePerPixel
        }`;
      }
    }
  };

  // Returns an array of objects containing information regarding the tiles
  // that should be created to comply with the supplied 'MAX_TILE_SIZE' and
  // also 'fill' the image.
  getTileInformation = (height, width, url) => {
    // We're gonna want to return an array containing the tile-objects
    const tiles = [];
    // We're also gonna need to keep track of the original bounding box. This bounding-box
    // will be used to calculate the new bounding-boxes for each tile that we're about to create.
    const bBox = this.getBoundingBoxFromUrl(url);
    // Since the northing and easting axels are flipped in version 1.1.0 vs 1.3.0 we
    // have to make sure to check which WMS-version we are dealing with.
    const wmsVersion = url.searchParams.get("VERSION");
    // To gather all the required tile-information we will work with 'columns'. This means
    // we will create all necessary images at a fixed width, and then move to the next width.
    // We'll do this until we've created enough columns to fill the entire width.
    let accWidth = 0;
    while (true) {
      // If we've created enough columns to fill the supplied width, we can break.
      if (accWidth >= width) break;
      // Otherwise we'll check how many pixels remain until we do...
      const remainingWidth = width - accWidth;
      // We'll use a tile-width that is either:
      // - The remaining amount of pixels
      // - The max tile-size
      const tileWidth =
        remainingWidth > this.maxTileSize ? this.maxTileSize : remainingWidth;
      // Then we'll create a column of tiles
      tiles.push(...this.getTileColumn(height, accWidth, tileWidth));
      // And bump the current width
      accWidth += tileWidth;
    }
    // When the tile-information is created, we can append the bounding-box-information
    // to each tile. The bounding-box-information will be used to fetch the tiles later.
    this.appendBoundingBox(tiles, bBox, height, width, wmsVersion);
    // Finally we can return the tile-information.
    return tiles;
  };

  // Updates the parameters of the supplied layer to make sure we
  // request the images in the correct DPI for the print! This function
  // only handles image-layers.
  prepareImageLayer = (layer, options) => {
    // Let's run this in a try-catch just in case
    try {
      // We're gonna need to grab the layer-source
      const source = layer.getSource();
      // Let's also grab the layer id, so that we can use that as a key in the map
      // containing all the original load-functions. The id is stored in the name-
      // property, wonderful!
      const layerId = layer.get("name");
      // Then we'll need to fetch the original image-load-function (so that we can make sure
      // to re-apply that function when the printing is done).
      const originalLoadFunction = source.getImageLoadFunction();
      // Then we'll store the original function
      this.originalLayerParams.set(layerId, originalLoadFunction);
      // When the original function is stored, we can create a new load-function
      // (which takes the current print-DPI into consideration) and update the source function with this one.
      source.setImageLoadFunction((image, src) => {
        // TODO: Here we're gonna have some fun with the image-requests.
        const url = new URL(src);
        const searchParams = url.searchParams;
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
            const tileUrl = new URL(url.toString());
            tileUrl.searchParams.set("BBOX", tile.bBox);
            tileUrl.searchParams.set("HEIGHT", tile.tileHeight);
            tileUrl.searchParams.set("WIDTH", tile.tileWidth);
            // Then we'll fetch the images from the WMS-server
            promises.push(
              this.loadImageTile(canvas, { ...tile, url: tileUrl.toString() })
            );
          }
          // When all image-promises has settled, we can set the image to the canvas on which we've
          // added all the tile-images.
          Promise.allSettled(promises).then(() => {
            image.getImage().src = canvas.toDataURL();
          });
        } else {
          // If the request is not too complex, we can fetch it right away.
          image.getImage().src = url.toString();
        }
      });
    } catch (error) {
      console.error(
        `Failed to update the DPI-options while creating print-image (Single-tile WMS). Error: ${error}`
      );
    }
  };

  // Resets (applies the original image-load-function on) the supplied image-layer.
  resetImageLayer = (layer) => {
    // Let's run this in a try-catch just in case
    try {
      // We're gonna need to grab the layer-source
      const source = layer.getSource();
      // We're gonna need the id so that we can grab the original parameters from
      // the map.
      const layerId = layer.get("name");
      // Let's grab the original image-load-function
      const originalLoadFunction = this.originalLayerParams.get(layerId);
      // ...and update the source-function!
      source.setImageLoadFunction(originalLoadFunction);
    } catch (error) {
      console.warn(
        `Failed to reset an image-layer after printing. Error: {error}`
      );
    }
  };

  // Since we're allowing the user to print the map with different DPI-options,
  // the layers that are about to be printed must be prepared. The preparation consists
  // of settings the DPI-parameters so that we ensure that we are sending proper WMS-requests.
  // (If we would print with 300 dpi, and just let OL send an ordinary request, the images returned
  // from the server would not show the correct layout for 300 DPI usage).
  prepareActiveLayersForPrint = (options) => {
    // First we have to grab all currently visible tile-layers (Remember that this
    // function call only returns layers that are based on TileWMS)!
    const tileLayers = this.getVisibleTileLayers();
    // We're also gonna have to grab all currently visible image-layers. An image-layer
    // is a layer that has been added by an admin as a "single-tile" layer. (Remember that
    // this function call only returns layers that are based on ImageWMS)!
    const imageLayers = this.getVisibleImageLayers();
    // We're gonna need to mess with all the tile-layers...
    for (const tileLayer of tileLayers) {
      this.prepareTileLayer(tileLayer, options);
    }
    // We're also gonna need to mess with all the image-layers...
    for (const imageLayer of imageLayers) {
      this.prepareImageLayer(imageLayer, options);
    }
  };

  // Since we've been messing with the tile-layers parameters while printing, we have to provide
  // a method to reset the parameters. This method gets the original parameters, and sets these.
  resetActiveLayers = () => {
    // First we'll have to grab all currently visible tile-layers.
    const tileLayers = this.getVisibleTileLayers();
    // We're also gonna have to grab all currently visible image-layers.
    const imageLayers = this.getVisibleImageLayers();
    // We're gonna need to reset all of the tile-layers
    for (const tileLayer of tileLayers) {
      this.resetTileLayer(tileLayer);
    }
    // We're also gonna have to reset all the image-layers.
    for (const imageLayer of imageLayers) {
      this.resetImageLayer(imageLayer);
    }
    // When all layers has been reset, we'll have to reset the map containing the
    // original settings!
    this.originalLayerParams = new Map();
  };

  print = (options) => {
    const format = options.format;
    const orientation = options.orientation;
    const resolution = options.resolution;
    const scale = options.scale / 1000;

    // Our dimensions are for landscape orientation by default. Flip the values if portrait orientation requested.
    const dim =
      orientation === "portrait"
        ? [...this.dims[format]].reverse()
        : this.dims[format];

    const width = Math.round((dim[0] * resolution) / 25.4);
    const height = Math.round((dim[1] * resolution) / 25.4);

    // Since we're allowing the users to choose which DPI they want to print the map
    // in, we have to make sure to prepare the layers so that they are fetched with
    // the correct DPI-settings!
    // TODO: Make sure to handle Image-WMS (non-tiled WMS-sources) as well! As of now,
    // we only handle tiled sources!
    this.prepareActiveLayersForPrint(options);

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
        return false;
      }

      // This is needed to prevent some buggy output from some browsers
      // when a lot of tiles are being rendered (it could result in black
      // canvas PDF)
      await delay(500);

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

      // Initiate the PDF object
      const pdf = new jsPDF({
        orientation,
        format,
        putOnlyUsedFonts: true,
        compress: true,
      });

      // Add our map canvas to the PDF, start at x/y=0/0 and stretch for entire width/height of the canvas
      pdf.addImage(mapCanvas, "JPEG", 0, 0, dim[0], dim[1]);

      // Add potential margin around the image
      if (this.margin > 0) {
        // The lineWidth increases the line width equally to "both sides",
        // therefore, we must have a line width two times the margin we want.
        pdf.setLineWidth(this.margin * 2);
        // We always want a white margin
        pdf.setDrawColor("white");
        // Draw the border (margin) around the entire image
        pdf.rect(0, 0, dim[0], dim[1], "S");
      }

      // If logo URL is provided, add the logo to the map
      if (options.includeLogo && this.logoUrl.trim().length >= 5) {
        try {
          const {
            data: logoData,
            width: logoWidth,
            height: logoHeight,
          } = await this.getImageForPdfFromUrl(this.logoUrl, this.logoMaxWidth);

          let logoPlacement = this.getPlacement(
            options.logoPlacement,
            logoWidth,
            logoHeight,
            dim[0],
            dim[1]
          );

          pdf.addImage(
            logoData,
            "PNG",
            logoPlacement.x,
            logoPlacement.y,
            logoWidth,
            logoHeight
          );
        } catch (error) {
          // The image loading may fail due to e.g. wrong URL, so let's catch the rejected Promise
          this.localObserver.publish("error-loading-logo-image");
        }
      }

      if (options.includeNorthArrow && this.northArrowUrl.trim().length >= 5) {
        try {
          const {
            data: arrowData,
            width: arrowWidth,
            height: arrowHeight,
          } = await this.getImageForPdfFromUrl(this.northArrowUrl, 10);

          const arrowPlacement = this.getPlacement(
            options.northArrowPlacement,
            arrowWidth,
            arrowHeight,
            dim[0],
            dim[1]
          );

          pdf.addImage(
            arrowData,
            "PNG",
            arrowPlacement.x,
            arrowPlacement.y,
            arrowWidth,
            arrowHeight
          );
        } catch (error) {
          // The image loading may fail due to e.g. wrong URL, so let's catch the rejected Promise
          this.localObserver.publish("error-loading-arrow-image");
        }
      }

      if (options.includeScaleBar) {
        this.addScaleBar(
          pdf,
          options.mapTextColor,
          options.scale,
          options.resolution,
          options.scaleBarPlacement,
          scaleResolution,
          options.format,
          options.orientation
        );
      }

      // Add map title if user supplied one
      if (options.mapTitle.trim().length > 0) {
        pdf.setFontSize(24);
        pdf.setTextColor(options.mapTextColor);
        pdf.text(options.mapTitle, dim[0] / 2, 12 + this.margin, {
          align: "center",
        });
      }

      // Add print comment if user supplied one
      if (options.printComment.trim().length > 0) {
        pdf.setFontSize(11);
        pdf.setTextColor(options.mapTextColor);
        pdf.text(options.printComment, dim[0] / 2, 18 + this.margin, {
          align: "center",
        });
      }

      // Add potential copyright text
      if (this.copyright.length > 0) {
        pdf.setFontSize(8);
        pdf.setTextColor(options.mapTextColor);
        pdf.text(
          this.copyright,
          dim[0] - 4 - this.margin,
          dim[1] - 4 - this.margin,
          {
            align: "right",
          }
        );
      }

      // Add potential disclaimer text
      if (this.disclaimer.length > 0) {
        pdf.setFontSize(8);
        pdf.setTextColor(options.mapTextColor);
        let textLines = pdf.splitTextToSize(
          this.disclaimer,
          dim[0] / 2 - this.margin - 8
        );
        let textLinesDims = pdf.getTextDimensions(textLines, { fontSize: 8 });
        pdf.text(
          textLines,
          dim[0] - 4 - this.margin,
          dim[1] - 6 - this.margin - textLinesDims.h,
          {
            align: "right",
          }
        );
      }

      // Since we've been messing with the layer-settings while printing, we have to
      // make sure to reset these settings.
      this.resetActiveLayers();

      // Finally, save the PDF (or PNG)
      this.saveToFile(pdf, width, options.saveAsType)
        .then(() => {
          this.localObserver.publish("print-completed");
        })
        .catch((error) => {
          console.warn(error);
          this.localObserver.publish("print-failed-to-save");
        })
        .finally(() => {
          // Reset map to how it was before print
          this.restoreOriginalView();
        });
    });

    // Set print size, resolution and center.
    // This will initiate print, as we have a listener for renderComplete.
    const printSize = [width, height];

    // Get print center from preview feature's center coordinate
    const printCenter = getCenter(
      this.previewFeature.getGeometry().getExtent()
    );

    // Hide our preview feature so it won't get printed
    this.previewLayer.setVisible(false);

    // Set map size and resolution
    this.map.setSize(printSize);
    this.map.getView().setCenter(printCenter);
    this.map.getView().setResolution(scaleResolution);
  };

  restoreOriginalView = () => {
    this.previewLayer.setVisible(true);
    this.map.setSize(this.originalMapSize);
    this.map.setView(this.originalView);
  };

  saveToFile = (pdf, width, type) => {
    const fileName = `Hajk - ${new Date().toLocaleString()}`;
    return new Promise((resolve, reject) => {
      try {
        if (type === "PDF") {
          pdf.save(`${fileName}.pdf`);
          resolve();
        } else {
          const ab = pdf.output("arraybuffer");
          PDFjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
          PDFjs.getDocument({ data: ab }).promise.then((pdf) => {
            pdf.getPage(1).then((page) => {
              let canvas = document.createElement("canvas");
              let ctx = canvas.getContext("2d");

              //Scale viewport to match current resolution
              const viewport = page.getViewport({ scale: 1 });
              const scale = width / viewport.width;
              const scaledViewport = page.getViewport({ scale: scale });

              const renderContext = {
                canvasContext: ctx,
                viewport: scaledViewport,
              };

              canvas.height = scaledViewport.height;
              canvas.width = scaledViewport.width;

              page.render(renderContext).promise.then(() => {
                canvas.toBlob((blob) => {
                  saveAs(blob, `${fileName}.png`);
                  resolve();
                });
              });
            });
          });
        }
      } catch (error) {
        reject(`Failed to save file... ${error}`);
      }
    });
  };

  cancelPrint = () => {
    // Set this flag to prevent "rendercomplete" from firing
    this.pdfCreationCancelled = true;

    // Reset map to how it was before print
    this.restoreOriginalView();
    // Reset the layer-settings to how it was before print
    this.resetActiveLayers();
  };

  /**
   * @description Using toLocalString for sv-SE is the easiest way to get space as thousand separator.
   *
   * @param {*} scale Number that will be prefixed with "1:"
   * @returns {string} Input parameter, prefixed by "1:" and with spaces as thousands separator, e.g "5000" -> "1:5 000".
   */
  getUserFriendlyScale = (scale) => {
    return `1:${Number(scale).toLocaleString("sv-SE")}`;
  };
}

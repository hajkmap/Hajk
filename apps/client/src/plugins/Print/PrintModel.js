import { delay } from "../../utils/Delay";
import { getPointResolution } from "ol/proj";
import { getCenter } from "ol/extent";
import { PDF, rgb } from "@libpdf/core";
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
import { PDFiumLibrary } from "@hyzyla/pdfium/browser/base64";
import wasmUrl from "@hyzyla/pdfium/pdfium.wasm?url";

import QRCode from "qrcode";

import { ROBOTO_NORMAL, ROBOTO_BOLD } from "./constants";

const DEFAULT_DIMS = {
  a0: [1189, 841],
  a1: [841, 594],
  a2: [594, 420],
  a3: [420, 297],
  a4: [297, 210],
  a5: [210, 148],
};

// Paper sizes in points assuming landscape
const DEFAULT_PAPER_SIZE = {
  a2: { width: 1684, height: 1190 },
  a3: { width: 1190, height: 842 },
  a4: { width: 842, height: 595 },
};

export default class PrintModel {
  constructor(settings) {
    this.proxy = settings.proxy;
    this.map = settings.map;
    this.dims = settings.dims || DEFAULT_DIMS;
    this.logoUrl = settings.options.logo || "";
    this.northArrowUrl = settings.options.northArrow || "";
    this.logoMaxWidth = settings.options.logoMaxWidth;
    this.includeImageBorder = settings.options.includeImageBorder;
    this.northArrowMaxWidth = settings.options.northArrowMaxWidth;
    this.scales = settings.options.scales;
    this.scaleMeters = settings.options.scaleMeters;
    this.scaleBarLengths = this.calculateScaleBarLengths();
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

  defaultScaleBarLengths = {
    200: 10,
    500: 50,
    1000: 100,
    2000: 200,
    5000: 500,
    10000: 1000,
    20000: 2000,
    50000: 5000,
    100000: 10000,
    200000: 20000,
    300000: 20000,
  };

  fakeBase = "https://hajk.js.internal";

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

  hexToRgb = (hex) => {
    hex = hex.replace(/^#/, "");
    let r = parseInt(hex.slice(0, 2), 16);
    let g = parseInt(hex.slice(2, 4), 16);
    let b = parseInt(hex.slice(4, 6), 16);

    r = r > 127.5 ? 1 : 0;
    g = g > 127.5 ? 1 : 0;
    b = b > 127.5 ? 1 : 0;

    return rgb(r, g, b);
  };

  getRightAlignedPositions = (
    text,
    fontSize,
    xmargin,
    ymargin,
    paperWidth,
    options
  ) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = `${fontSize}px roboto`;
    const textWidth = context.measureText(text).width;

    // If QrCode is placed in the bottom right corner, move text to the left of it (its wider)
    // Otherwise its a logo or northarrow, needs less text movement.
    // Also take care of scalebar placement bottomRight
    let x;
    if (options.includeQrCode && options.qrCodePlacement === "bottomRight") {
      x = paperWidth - textWidth - xmargin - 90;
    } else if (
      options.includeNorthArrow &&
      options.northArrowPlacement === "bottomRight"
    ) {
      x = paperWidth - textWidth - xmargin - this.northArrowMaxWidth * 3 - 10;
    } else if (
      options.includeScaleBar &&
      options.scaleBarPlacement === "bottomRight"
    ) {
      // Use the scalebarMaxWidth that either is the text or the scalebar length, to align ex copyright
      // and disclaimer/date correctly to the left of the scalebar when bottomRight
      x = paperWidth - textWidth - xmargin - this.scalebarMaxWidth - 10;
    } else if (options.includeLogo && options.logoPlacement === "bottomRight") {
      x =
        paperWidth -
        textWidth -
        xmargin -
        this.logoMaxWidth * this.mmPerPoint -
        10;
    } else {
      x = paperWidth - textWidth - xmargin;
    }
    const y = ymargin;
    return { x, y };
  };

  getCenterAlignedPositions = (
    text,
    fontSize,
    ymargin,
    paperWidth,
    paperHeight
  ) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = `${fontSize}px roboto`;
    const textWidth = context.measureText(text).width;

    const x = (paperWidth - textWidth) / 2;
    const y = paperHeight - ymargin;
    return { x, y };
  };

  generateQR = async (url, qrSize) => {
    try {
      return {
        data: await QRCode.toDataURL(url),
        width: qrSize * 4,
        height: qrSize * 4,
      };
    } catch (err) {
      console.warn(err);
      return "";
    }
  };

  calculateScaleBarLengths() {
    if (this.scales.length === this.scaleMeters.length) {
      return this.scales.reduce((acc, curr, index) => {
        acc[curr] = this.scaleMeters[index];
        return acc;
      }, {});
    } else {
      return this.defaultScaleBarLengths;
    }
  }

  addPreviewLayer() {
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

    // If the user wants text and icons in the margins and outside the map image
    // we should only allow that if margins are used
    const useTextIconsInMargin = useMargin
      ? options.useTextIconsInMargin
      : false;

    const dim = this.getPaperDim(format, orientation);

    this.margin = useMargin ? this.getMargin(dim) : 0;

    //We need a different margin value for text and icons to be placed in the margins,
    //because "this.margin" (above) is sometimes used independently
    this.textIconsMargin = useTextIconsInMargin ? 0 : 6;

    const inchInMillimeter = 25.4;
    // We should take pixelRatio into account? What happens when we have
    // pr=2? PixelSize will be 0.14?
    const defaultPixelSizeInMillimeter = 0.28;

    const dpi = inchInMillimeter / defaultPixelSizeInMillimeter; // ~90

    // Here we calculate height and width of preview window based on user and admin selection
    // (ex. if admin wants image border or if user wants margins).
    const calculatedWidth =
      this.includeImageBorder && !options.useMargin ? 1 : this.margin * 2;

    const calculatedHeight =
      this.includeImageBorder && !options.useMargin
        ? 1
        : options.useTextIconsInMargin && format === "a5"
          ? this.margin * 8
          : options.useTextIconsInMargin
            ? this.margin * 6
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
    const ratio = (maxWidth * 3) / sourceWidth;
    const width = sourceWidth * ratio;
    const height = sourceHeight * ratio;
    return { data, width, height };
  };

  getTextWidth = (text, size) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = `${size}px roboto`;
    return context.measureText(text).width;
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
    const margin = this.textIconsMargin + this.margin;
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
    return `${Number(scaleBarLengthMeters).toLocaleString()} ${units}`;
  };

  // Divides scaleBarLength with correct number to get divisions lines every 1, 10 or 100 m or km.
  // Example 1: If scaleBarLengthMeters is 1000 we divide by 10 to get 10 division lines every 100 meters.
  // Example 2: If _scaleBarLengthMeters is 500 we divide by 5 to get 5 division lines every 10 meters.
  getDivLinesArrayAndDivider = (scaleBarLengthMeters, scaleBarLength) => {
    const scaleBarLengthMetersStr = scaleBarLengthMeters.toString();
    // Here we get the lengthMeters first two numbers.
    const scaleBarFirstDigits = parseInt(
      scaleBarLengthMetersStr.substring(0, 2)
    );
    // We want to check if lengthMeters starts with 10 through 19 to make sure we divide correctly later.
    const startsWithDoubleDigits =
      scaleBarFirstDigits >= 10 && scaleBarFirstDigits <= 19;

    // Here we set the scaleLength variable to the length of lengthMeters.
    // For example, if lengthMeters is 1000 we want the scaleLength to be 10.
    // And if lengthMeters is 500 we want the scaleLength to be 5.
    const scaleLength = startsWithDoubleDigits
      ? scaleBarLengthMetersStr.length - 2
      : scaleBarLengthMetersStr.length - 1;

    // Here we set the divider by dividing lengthMeters with 10 to the power of scaleLength...
    // For example, if lengthMeters is 500 we want to divide it by 5 to get 5 division lines, each 100 meters...
    // and if lengthMeters is 1 000 we want to divide it by 100.
    const divider = scaleBarLengthMeters / Math.pow(10, scaleLength);
    // Finally, we want to calculate the number of pixels between each division line on the scalebar
    const divLinePixelsCount = scaleBarLength / divider;

    // We loop through and fill the divLinesArray with the divLinePixelsCount...
    // to get the correct division line distribution on the scalebar
    let divLinesArray = [];
    for (
      let divLine = divLinePixelsCount;
      divLine <= scaleBarLength;
      divLine += divLinePixelsCount
    ) {
      divLinesArray.push(divLine);
    }

    return { divLinesArray, divider };
  };

  addDividerLinesAndTexts = (props) => {
    this.drawDividerLines(props);

    // We want to make sure that given scale is a set scale in our admin settings...
    // to ensure the text has correct spacing
    if (this.scaleBarLengths[props.scale]) this.addDividerTexts(props);
  };

  drawDividerLines({
    page,
    scaleBarPosition,
    scaleBarLength,
    color,
    scaleBarLengthMeters,
  }) {
    page.drawLine({
      start: { x: scaleBarPosition.x, y: scaleBarPosition.y + 9 },
      end: {
        x: scaleBarPosition.x + scaleBarLength,
        y: scaleBarPosition.y + 9,
      },
      color,
      thickness: 1,
    });
    page.drawLine({
      start: { x: scaleBarPosition.x, y: scaleBarPosition.y + 3 },
      end: {
        x: scaleBarPosition.x,
        y: scaleBarPosition.y + 15,
      },
      color,
      thickness: 1,
    });
    page.drawLine({
      start: {
        x: scaleBarPosition.x + scaleBarLength,
        y: scaleBarPosition.y + 3,
      },
      end: {
        x: scaleBarPosition.x + scaleBarLength,
        y: scaleBarPosition.y + 15,
      },
      color,
      thickness: 1,
    });

    // Here we get number of lines we will draw below
    const { divLinesArray } = this.getDivLinesArrayAndDivider(
      scaleBarLengthMeters,
      scaleBarLength
    );

    // Here we draw the dividing lines marking 10 (or 100) meters each
    divLinesArray.forEach((divLine) => {
      const largerMiddleLineValue =
        divLinesArray.length === 10 && divLine === divLinesArray[4] ? 2.1 : 0;
      page.drawLine({
        start: {
          x: scaleBarPosition.x + divLine,
          y: scaleBarPosition.y + 5.7 - largerMiddleLineValue,
        },
        end: {
          x: scaleBarPosition.x + divLine,
          y: scaleBarPosition.y + 12.3 + largerMiddleLineValue,
        },
        color,
        thickness: 1,
      });
    });

    // If the space between 0 and the first number on the scalebar is long enough...
    // we draw additional lines between 0 and the first number
    if (divLinesArray[0] > 10) {
      const numLine = divLinesArray[0] / 5;
      for (
        let divLine = numLine;
        divLine < divLinesArray[0];
        divLine += numLine
      ) {
        page.drawLine({
          start: {
            x: scaleBarPosition.x + divLine,
            y: scaleBarPosition.y + 6.75,
          },
          end: {
            x: scaleBarPosition.x + divLine,
            y: scaleBarPosition.y + 11.55,
          },
          color,
          thickness: 1,
        });
      }
    }
  }

  addDividerTexts = ({
    page,
    scaleBarPosition,
    scaleBarLength,
    scaleBarLengthMeters,
    color,
    font,
  }) => {
    // Here we set the number 0 at the start of the scalebar
    page.drawText("0", {
      x: scaleBarPosition.x - 2,
      y: scaleBarPosition.y - 5,
      size: 8,
      font,
    });

    // Here we convert the scaleBarLengthMeters to km if above 1000
    const calculatedScaleBarLengthMeters =
      scaleBarLengthMeters > 1000
        ? (scaleBarLengthMeters / 1000).toString()
        : scaleBarLengthMeters;

    // Here we get number of lines we will draw below
    const { divLinesArray, divider } = this.getDivLinesArrayAndDivider(
      scaleBarLengthMeters,
      scaleBarLength
    );

    const scaleBarHasSpace = divLinesArray[0] > 10 && scaleBarLengthMeters > 10;

    let divNr = calculatedScaleBarLengthMeters / divider;
    let divNrString = divNr.toLocaleString();

    // Here we add the middle number or if no middle exists...
    // a number that's close to the middle

    // let midIndex =
    //   divLinesArray.length % 2 === 0
    //     ? divLinesArray.length / 2
    //     : Math.floor(divLinesArray.length / 2);

    const midIndex = Math.round(divLinesArray.length / 2);

    divNr = (calculatedScaleBarLengthMeters / divider) * midIndex;
    divNrString = divNr.toLocaleString();
    page.drawText(divNrString, {
      x:
        scaleBarPosition.x +
        divLinesArray[midIndex - 1] -
        divNrString.length -
        2,
      y: scaleBarPosition.y - 5,
      size: 8,
      font,
    });

    // Here we add a number to the first additional division line but only if scaleBar has space
    if (scaleBarHasSpace) {
      const dividerNrPosition = divLinesArray[0] / 5;
      divNr = calculatedScaleBarLengthMeters / divider / 5;
      divNrString = divNr.toLocaleString();

      // We need to check if this number would be a decimal number, and skip drawing it in that case
      // so the beginning of the scalebar doesn't get cramped for space
      const dividerStrLength =
        divNr % 1 !== 0 ? divNrString.length - 1 : divNrString.length;
      if (dividerStrLength === 1) {
        page.drawText(divNrString, {
          x: scaleBarPosition.x + dividerNrPosition - dividerStrLength - 2,
          y: scaleBarPosition.y - 5,
          size: 8,
          font,
        });
      }
    }
  };

  drawScaleBar = (
    page,
    scaleBarPosition,
    color,
    scaleBarLength,
    scale,
    scaleBarLengthMeters,
    format,
    orientation,
    font
  ) => {
    const lengthText = this.getLengthText(scaleBarLengthMeters);
    page.drawText(lengthText, {
      x: scaleBarPosition.x + scaleBarLength + 2,
      y: scaleBarPosition.y + 6,
      size: 8,
      font,
    });

    page.drawText(this.scaleText, {
      x: scaleBarPosition.x,
      y: scaleBarPosition.y + 20,
      size: 10,
      font,
    });

    this.addDividerLinesAndTexts({
      page,
      scale,
      scaleBarLengthMeters,
      scaleBarPosition,
      scaleBarLength,
      color,
      font,
    });
  };

  addScaleBar = (
    page,
    color,
    scale,
    resolution,
    scaleBarPlacement,
    scaleResolution,
    format,
    orientation,
    font,
    pageWidth,
    pageHeight
  ) => {
    const mPerInch = 0.0254;
    const pointsPerInch = 72;
    // Get the length that the scalebar should represent
    const scaleBarLengthMeters = this.getFittingScaleBarLength(scale);
    // Convert those meters to inches for the scale
    const lengthInInches = scaleBarLengthMeters / scale / mPerInch;

    // Convert inches to points
    const scaleBarLength = lengthInInches * pointsPerInch;
    const scaleBarHeight = 6;

    this.scaleText = `Skala: ${this.getUserFriendlyScale(
      scale
    )} (vid ${format.toUpperCase()} ${
      orientation === "landscape" ? "liggande" : "stående"
    })`;

    let scaleBarPosition = this.getPlacement(
      scaleBarPlacement,
      scaleBarLength,
      scaleBarHeight,
      pageWidth,
      pageHeight,
      "scaleBar"
    );

    if (
      scaleBarPlacement === "bottomLeft" ||
      scaleBarPlacement === "bottomRight"
    ) {
      scaleBarPosition.y += 2;
    }

    this.drawScaleBar(
      page,
      scaleBarPosition,
      color,
      scaleBarLength,
      scale,
      scaleBarLengthMeters,
      format,
      orientation,
      font
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

  // Returns a string representing the bounding-box for the supplied tile.
  // (WMS-version 1.3.0)
  // If the WMS-version is set to 1.3.0 the axis-orientation should be set by the
  // definition of the projection. However, in 'ConfigMapper.js' we specify the
  // axis-direction as 'NEU' (northing, easting, up). This means we can assume
  // that the axis-direction is 'NEU' when dealing with version 1.3.0.
  getVersionThreeBoundingBox = (tile, bBox, height, width) => {
    // We have to know how much the northing and easting change per pixel, so that we
    // can calculate proper bounding-boxes for the new tiles.
    const northingChangePerPixel = (bBox[2] - bBox[0]) / height;
    const eastingChangePerPixel = (bBox[3] - bBox[1]) / width;
    // Then we can construct the bounding-box-string:
    // The bounding-box is calculated by combining how much the bounding-box
    // changes per pixel, along with the supplied tile height, width, and position
    // (presented as pixel-values). For information regarding x, and y, see:
    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
    return `${
      bBox[0] + northingChangePerPixel * (height - tile.y - tile.tileHeight)
    },${bBox[1] + eastingChangePerPixel * tile.x},${
      bBox[0] + northingChangePerPixel * (height - tile.y)
    }, ${bBox[1] + eastingChangePerPixel * (tile.x + tile.tileWidth)}`;
  };

  // Returns a string representing the bounding-box for the supplied tile.
  // (WMS-version 1.1.1)
  // In version 1.1.1 the axis orientation is always 'ENU' (easting-northing-up).
  getVersionOneBoundingBox = (tile, bBox, height, width) => {
    // We have to know how much the northing and easting change per pixel, so that we
    // can calculate proper bounding-boxes for the new tiles.
    const northingChangePerPixel = (bBox[3] - bBox[1]) / height;
    const eastingChangePerPixel = (bBox[2] - bBox[0]) / width;
    // Then we can construct the bounding-box-string:
    // The bounding-box is calculated by combining how much the bounding-box
    // changes per pixel, along with the supplied tile height, width, and position
    // (presented as pixel-values). For information regarding x, and y, see:
    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
    return `${bBox[0] + eastingChangePerPixel * tile.x},${
      bBox[1] + northingChangePerPixel * (height - tile.y - tile.tileHeight)
    },${bBox[0] + eastingChangePerPixel * (tile.x + tile.tileWidth)},${
      bBox[1] + northingChangePerPixel * (height - tile.y)
    }`;
  };

  // Appends a bounding-box to each tile-information-object.
  appendBoundingBox = (tiles, bBox, height, width, wmsVersion) => {
    // The bounding-box calculations might seem a bit messy... One reason for that
    // is that the x- and y-values for the tiles are set to match how images are added
    // to a canvas, and those coordinates go the opposite direction compared to the map-coordinate-axels.
    // See: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage for more info.
    // Let's calculate and set the bounding-box for each tile-information-object.
    for (const tile of tiles) {
      // We have to make sure to check if we're dealing with version 1.3.0 or 1.1.1
      // so that we can handle the axis-orientation properly.
      if (wmsVersion === "1.3.0") {
        tile.bBox = this.getVersionThreeBoundingBox(tile, bBox, height, width);
      } else {
        // If we're not dealing with version 1.3.0, we're probably dealing with 1.1.1
        tile.bBox = this.getVersionOneBoundingBox(tile, bBox, height, width);
      }
    }
  };

  // Returns an URL object from the src string, prepended with proxy if any.
  // Uses a fake base for resolving relative URL:s so we can detect this when
  // resolving the final URL to string (and remove it).
  // This let's us work with NodeJS URL API with relative URL:s.
  getURL = (src) => {
    const location = (this.proxy || "") + src;
    return new URL(location, this.fakeBase);
  };

  // Returns a string with the complete URL, removing fake base if any.
  toURLString = (url) => {
    const urlString = url.toString();
    return urlString.replace(this.fakeBase, "");
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

  // Decode the base64 font to Uint8Array
  async base64ToUint8Array(input) {
    const binaryString = atob(input);
    const length = binaryString.length;
    const uint8Array = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }

    return uint8Array;
  }

  // Fetch image and return it as Uint8Array
  async fetchImage(url) {
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    } catch (error) {
      console.error(`Error fetching image from ${url}:`, error);
      throw error;
    }
  }

  print = async (options) => {
    return new Promise((resolve, reject) => {
      const windowUrl = window.location.href;
      const format = options.format;
      const orientation = options.orientation;
      const resolution = options.resolution;
      const scale = options.scale / 1000;

      // Convert hex color provided to rgb since libPDF uses that instead, should probably be handled earlier.
      this.textColor = this.hexToRgb(options.mapTextColor);

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

        const dataUrl = mapCanvas.toDataURL("image/png");
        let pageHeight = 0;
        let pageWidth = 0;

        // Assign our pagewidth and heights
        switch (options.format) {
          case "a4":
            pageWidth = DEFAULT_PAPER_SIZE.a4.width;
            pageHeight = DEFAULT_PAPER_SIZE.a4.height;
            break;
          case "a3":
            pageWidth = DEFAULT_PAPER_SIZE.a3.width;
            pageHeight = DEFAULT_PAPER_SIZE.a3.height;
            break;
          case "a2":
            pageWidth = DEFAULT_PAPER_SIZE.a2.width;
            pageHeight = DEFAULT_PAPER_SIZE.a2.height;
            break;
          default:
            // Defult to a4
            pageWidth = DEFAULT_PAPER_SIZE.a4.width;
            pageHeight = DEFAULT_PAPER_SIZE.a4.height;
        }

        // Flip depending on orientation
        const originalPageWidth = pageWidth;
        const originalPageHeight = pageHeight;

        pageWidth =
          orientation === "landscape" ? originalPageWidth : originalPageHeight;
        pageHeight =
          orientation === "landscape" ? originalPageHeight : originalPageWidth;

        const pdf = PDF.create();
        let page = pdf.addPage({
          orientation,
          width: pageWidth,
          height: pageHeight,
        });

        let fontNormalBytes = null;
        let fontBoldBytes = null;
        await this.base64ToUint8Array(ROBOTO_NORMAL).then(
          (result) => (fontNormalBytes = result)
        );
        await this.base64ToUint8Array(ROBOTO_BOLD).then(
          (result) => (fontBoldBytes = result)
        );
        const fontNormal = pdf.embedFont(fontNormalBytes);
        const fontBold = pdf.embedFont(fontBoldBytes);

        // Canvas to dataUrl to ArrayBuffer, since libPDF embedImage expects a Uint8Array
        try {
          const mapBuffer = await this.fetchImage(dataUrl);
          const mapImage = pdf.embedImage(mapBuffer);

          // Draw image on the PDF
          page.drawImage(mapImage, {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
          });

          // Add potential margin around the image
          if (this.margin > 0) {
            // We want to check if user has chosen to put icons and text
            // in the margins, which if so, must be larger than usual
            // Note that we first check if user has NOT chosen this (!).
            if (!options.useTextIconsInMargin) {
              page
                .drawPath()
                .moveTo(0, 0)
                .lineTo(pageWidth, 0)
                .lineTo(pageWidth, pageHeight)
                .lineTo(0, pageHeight)
                .lineTo(0, 0)
                .close()
                .stroke({
                  borderColor: rgb(255, 255, 255),
                  borderWidth: 5.5 * this.margin,
                });
              // Now we check if user did choose text in margins
            } else {
              page
                .drawPath()
                .moveTo(0, 0)
                .lineTo(pageWidth, 0)
                .close()
                .stroke({
                  borderColor: rgb(255, 255, 255),
                  borderWidth: 16 * this.margin,
                });
              page
                .drawPath()
                .moveTo(pageWidth, 0)
                .lineTo(pageWidth, pageHeight)
                .close()
                .stroke({
                  borderColor: rgb(255, 255, 255),
                  borderWidth: 5.5 * this.margin,
                });
              page
                .drawPath()
                .moveTo(pageWidth, pageHeight)
                .lineTo(0, pageHeight)
                .close()
                .stroke({
                  borderColor: rgb(255, 255, 255),
                  borderWidth: 16 * this.margin,
                });
              page
                .drawPath()
                .moveTo(0, pageHeight)
                .lineTo(0, 0)
                .close()
                .stroke({
                  borderColor: rgb(255, 255, 255),
                  borderWidth: 5.5 * this.margin,
                });
            }
          }

          if (options.includeQrCode && this.mapConfig.enableAppStateInHash) {
            try {
              const qrCode = await this.generateQR(windowUrl, 20);
              let qrCodePlacement = this.getPlacement(
                options.qrCodePlacement,
                qrCode.width,
                qrCode.height,
                pageWidth,
                pageHeight,
                "qrCode"
              );

              // Fetch the logoData in base64 and recieve it as a Uint8Array
              const qrBuffer = await this.fetchImage(qrCode.data);
              const qrImage = pdf.embedImage(qrBuffer);

              // Draw logo on the PDF
              page.drawImage(qrImage, {
                x: qrCodePlacement.x,
                y: qrCodePlacement.y,
                width: qrCode.width,
                height: qrCode.height,
              });
            } catch (error) {
              const imgLoadingError = { error: error, type: "QR-koden" };
              // The image loading may fail due to e.g. wrong URL, so let's catch the rejected Promise
              this.localObserver.publish(
                "error-loading-image",
                imgLoadingError
              );
            }
          }

          // Check if logo should be added
          if (options.includeLogo && this.logoUrl.trim().length >= 5) {
            try {
              const {
                data: logoData,
                width: logoWidth,
                height: logoHeight,
              } = await this.getImageForPdfFromUrl(
                this.logoUrl,
                this.logoMaxWidth
              );
              let logoPlacement = this.getPlacement(
                options.logoPlacement,
                logoWidth,
                logoHeight,
                pageWidth,
                pageHeight
              );

              // Fetch the logoData in base64 and recieve it as a Uint8Array
              const logoBuffer = await this.fetchImage(logoData);
              const logoImage = pdf.embedImage(logoBuffer);

              // Draw logo on the PDF
              page.drawImage(logoImage, {
                x: logoPlacement.x - 5,
                y: logoPlacement.y - 5,
                width: logoWidth,
                height: logoHeight,
              });
            } catch (error) {
              const imgLoadingError = { error: error, type: "Logotypbilden" };
              // The image loading may fail due to e.g. wrong URL, so let's catch the rejected Promise
              this.localObserver.publish(
                "error-loading-image",
                imgLoadingError
              );
            }
          }

          if (
            options.includeNorthArrow &&
            this.northArrowUrl.trim().length >= 5
          ) {
            try {
              const {
                data: arrowData,
                width: arrowWidth,
                height: arrowHeight,
              } = await this.getImageForPdfFromUrl(
                this.northArrowUrl,
                this.northArrowMaxWidth
              );

              const arrowPlacement = this.getPlacement(
                options.northArrowPlacement,
                arrowWidth,
                arrowHeight,
                pageWidth,
                pageHeight
              );

              // Fetch the arrow image in base64 and recieve it as a Uint8Array
              const arrowBuffer = await this.fetchImage(arrowData);
              const arrowImage = pdf.embedImage(arrowBuffer);

              // Draw logo on the PDF
              page.drawImage(arrowImage, {
                x: arrowPlacement.x,
                y: arrowPlacement.y,
                width: arrowWidth,
                height: arrowHeight,
              });
            } catch (error) {
              const imgLoadingError = { error: error, type: "Norrpilen" };
              // The image loading may fail due to e.g. wrong URL, so let's catch the rejected Promise
              this.localObserver.publish(
                "error-loading-image",
                imgLoadingError
              );
            }
          }

          if (options.includeScaleBar) {
            this.addScaleBar(
              page,
              rgb(0, 0, 0),
              options.scale,
              options.resolution,
              options.scaleBarPlacement,
              scaleResolution,
              options.format,
              options.orientation,
              fontNormal,
              pageWidth,
              pageHeight
            );
          }

          // Add map title if user supplied one
          if (options.mapTitle.trim().length > 0) {
            let verticalMargin = options.useTextIconsInMargin
              ? this.margin + 35
              : 50;
            const position = this.getCenterAlignedPositions(
              options.mapTitle,
              28,
              verticalMargin,
              pageWidth,
              pageHeight
            );
            page.drawText(options.mapTitle, {
              x: position.x,
              y: position.y,
              size: 28,
              font: fontNormal,
              color: this.textColor,
            });
          }

          // Add print comment if user supplied one
          if (options.printComment.trim().length > 0) {
            let verticalMargin = options.useTextIconsInMargin
              ? this.margin + 50
              : 60;
            const position = this.getCenterAlignedPositions(
              options.printComment,
              11,
              verticalMargin,
              pageWidth,
              pageHeight
            );
            page.drawText(options.printComment, {
              x: position.x,
              y: position.y - 5,
              size: 11,
              font: fontNormal,
              color: this.textColor,
            });
          }

          // Add potential date text
          if (this.date.length > 0) {
            const date = this.date.replace(
              "{date}",
              new Date().toLocaleDateString()
            );
            const position = this.getRightAlignedPositions(
              this.date,
              this.textFontSize,
              23,
              5,
              pageWidth,
              options
            );
            page.drawText(date, {
              x: position.x,
              y: position.y,
              size: this.textFontSize,
              color: this.textColor,
              font: fontNormal,
            });
          }

          //  Add potential copyright text
          const position = this.getRightAlignedPositions(
            this.copyright,
            this.textFontSize,
            5,
            15,
            pageWidth,
            options
          );
          if (this.copyright.length > 0) {
            page.drawText(this.copyright, {
              x: position.x,
              y: position.y,
              size: this.textFontSize,
              color: this.textColor,
              font: fontNormal,
            });
          }

          // Add potential disclaimer text
          if (this.disclaimer.length > 0) {
            const position = this.getRightAlignedPositions(
              this.disclaimer,
              this.textFontSize,
              5,
              25,
              pageWidth,
              options
            );
            page.drawText(this.disclaimer, {
              x: position.x,
              y: position.y,
              size: this.textFontSize,
              color: this.textColor,
              font: fontNormal,
            });
          }
        } catch (error) {
          console.error("Error processing pdf:", error);
          this.localObserver.publish("print-failed-to-save");
          reject(error);
        } finally {
          // Save as pdf or png
          // Finally, save the PDF (or PNG)
          this.saveToFile(pdf, options.resolution, options.saveAsType)
            .then((blob) => {
              this.localObserver.publish("print-completed");
              resolve(blob);
            })
            .catch((error) => {
              console.warn(error);
              this.localObserver.publish("print-failed-to-save");
              reject(error);
            })
            .finally(() => {
              // Reset map to how it was before print
              this.restoreOriginalView();
            });
        }
      });

      // Since we've been messing with the layer-settings while printing, we have to
      // make sure to reset these settings. (Should only be done if custom loaders has been used).
      this.useCustomTileLoaders && this.resetPrintLayers();

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

  // Imports and returns the dependencies required to create a PNG-print-export.
  // #getPngDependencies = async () => {
  //   try {
  //     const pdfjs = await import("pdfjs-dist/build/pdf");
  //     return { pdfjs };
  //   } catch (error) {
  //     throw new Error(
  //       `Failed to import required dependencies. Error: ${error}`
  //     );
  //   }
  // };

  // Saves the supplied PDF with the supplied file-name.
  #saveToPdf = async (pdf, fileName) => {
    try {
      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Failed to save PDF. Error: ${error}`);
    }
  };

  // Saves the supplied PDF *as a PNG* with the supplied file-name.
  // The width of the document has to be supplied since some calculations
  // must be done in order to create a PNG with the correct resolution etc.
  #saveToPng = async (pdf, resolution, fileName) => {
    try {
      // Use max resolution by default.
      let selectedRes;
      switch (resolution) {
        case 72:
          selectedRes = 1;
          break;
        case 150:
          selectedRes = 2;
          break;
        case 300:
          selectedRes = 3;
          break;
        default:
          // Use max as defalut.
          selectedRes = 3;
          break;
      }
      const bytes = await pdf.save();
      // Initialize the library and load the web assembly
      const library = await PDFiumLibrary.init({
        wasmUrl: wasmUrl,
      });
      const doc = await library.loadDocument(bytes);
      const page = await doc.getPage(0);
      // Library only supports bitmap out of the box.
      const image = await page.render({
        scale: selectedRes,
        render: "bitmap",
      });

      // Create a canvas that we will render the image on.
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set canvas dimensions
      canvas.width = image.width;
      canvas.height = image.height;

      // Draw the image on the canvas
      const imageData = new ImageData(
        new Uint8ClampedArray(image.data),
        image.width,
        image.height
      );
      ctx.putImageData(imageData, 0, 0);

      // Download the image
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, "image/png");
      library.destroy();
    } catch (error) {
      throw new Error(`Failed to save PNG. Error: ${error}`);
    }
  };

  // Saves the print-contents to file, either PDF, or PNG (depending on supplied type).
  saveToFile = async (pdf, resolution, type) => {
    // We're gonna need to create a file-name.
    const fileName = `Kartexport - ${new Date().toLocaleString()}`;
    // Then we'll try to save the contents in the format the user requested.
    try {
      switch (type) {
        case "PDF":
          return await this.#saveToPdf(pdf, fileName);
        case "PNG":
        case "BLOB":
          return await this.#saveToPng(pdf, resolution, fileName);
        default:
          throw new Error(
            `Supplied type could not be handled. The supplied type was ${type} and currently only PDF, PNG, and BLOB is supported.`
          );
      }
    } catch (error) {
      throw new Error(`Failed to save file... ${error}`);
    }
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
    return `1:${Number(scale).toLocaleString()}`;
  };
}

import { delay } from "../../utils/Delay";
import { getPointResolution } from "ol/proj";
import { getCenter } from "ol/extent";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";

import Vector from "ol/layer/Vector.js";
import View from "ol/View";
import VectorSource from "ol/source/Vector.js";
import Polygon from "ol/geom/Polygon";
import Feature from "ol/Feature.js";
import { Translate } from "ol/interaction.js";
import Collection from "ol/Collection";
import { Style, Stroke, Fill } from "ol/style.js";

import ImageLayer from "ol/layer/Image";
import TileLayer from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS";
import ImageWMS from "ol/source/ImageWMS";

import { ROBOTO_NORMAL } from "./constants";

const DEFAULT_DIMS = {
  a0: [1189, 841],
  a1: [841, 594],
  a2: [594, 420],
  a3: [420, 297],
  a4: [297, 210],
  a5: [210, 148],
};
export default class PrintModel {
  constructor(settings) {
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
    this.date = settings.options.date || "";
    this.disclaimer = settings.options.disclaimer || "";
    this.localObserver = settings.localObserver;
    this.mapConfig = settings.mapConfig;
    // If we want the printed tiles to have correct styling, we have to use
    // custom loaders to make sure that the requests has all the required parameters.
    // If for some reason these tile-loaders shouldn't be used, a setting is exposed.
    this.useCustomTileLoaders = settings.options.useCustomTileLoaders ?? true;
    // Since the WMS-servers cannot handle enormous requests, we have to
    // limit Image-WMS requests. The size below is the maximum tile-size allowed.
    // This max-size is only used if the custom-tile-loaders are used.
    this.maxTileSize = settings.options.maxTileSize || 4096;
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

    const margin = this.textIconsMargin + this.margin;

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
    pdf,
    scaleBarPosition,
    scaleBarLength,
    color,
    scaleBarLengthMeters,
  }) {
    // Set line width and color
    pdf.setLineWidth(0.25).setDrawColor(color);

    // Draw starting, finish, and through lines
    pdf.line(
      scaleBarPosition.x,
      scaleBarPosition.y + 3,
      scaleBarPosition.x + scaleBarLength,
      scaleBarPosition.y + 3
    );
    pdf.line(
      scaleBarPosition.x,
      scaleBarPosition.y + 1,
      scaleBarPosition.x,
      scaleBarPosition.y + 5
    );
    pdf.line(
      scaleBarPosition.x + scaleBarLength,
      scaleBarPosition.y + 1,
      scaleBarPosition.x + scaleBarLength,
      scaleBarPosition.y + 5
    );

    // Here we get number of lines we will draw below
    const { divLinesArray } = this.getDivLinesArrayAndDivider(
      scaleBarLengthMeters,
      scaleBarLength
    );

    // Here we draw the dividing lines marking 10 (or 100) meters each
    divLinesArray.forEach((divLine) => {
      const largerMiddleLineValue =
        divLinesArray.length === 10 && divLine === divLinesArray[4] ? 0.7 : 0;
      pdf.line(
        scaleBarPosition.x + divLine,
        scaleBarPosition.y + 1.9 - largerMiddleLineValue,
        scaleBarPosition.x + divLine,
        scaleBarPosition.y + 4.1 + largerMiddleLineValue
      );
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
        pdf.line(
          scaleBarPosition.x + divLine,
          scaleBarPosition.y + 2.25,
          scaleBarPosition.x + divLine,
          scaleBarPosition.y + 3.85
        );
      }
    }
  }

  addDividerTexts = ({
    pdf,
    scaleBarPosition,
    scaleBarLength,
    scaleBarLengthMeters,
    color,
  }) => {
    pdf.setFontSize(8);
    pdf.setTextColor(color);

    // Here we set the number 0 at the start of the scalebar
    pdf.text("0", scaleBarPosition.x - 0.7, scaleBarPosition.y + 8);

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

    // Here we add the first number after 0
    let divNr = calculatedScaleBarLengthMeters / divider;
    let divNrString = divNr.toLocaleString();
    pdf.text(
      divNrString,
      scaleBarPosition.x + divLinesArray[0] - divNrString.length,
      scaleBarPosition.y + 8
    );

    // Here we add the middle number or if no middle exists...
    // a number that's close to the middle

    // let midIndex =
    //   divLinesArray.length % 2 === 0
    //     ? divLinesArray.length / 2
    //     : Math.floor(divLinesArray.length / 2);

    const midIndex = Math.round(divLinesArray.length / 2);

    divNr = (calculatedScaleBarLengthMeters / divider) * midIndex;
    divNrString = divNr.toLocaleString();
    pdf.text(
      divNrString,
      scaleBarPosition.x + divLinesArray[midIndex - 1] - divNrString.length,
      scaleBarPosition.y + 8
    );

    // Here we add a number to the first additional division line but only if scaleBar has space
    if (scaleBarHasSpace) {
      const dividerNrPosition = divLinesArray[0] / 5;
      divNr = calculatedScaleBarLengthMeters / divider / 5;
      divNrString = divNr.toLocaleString();

      // We need to make sure correct placement if divNr is a decimal number
      const dividerStrLength =
        divNr % 1 !== 0 ? divNrString.length - 1 : divNrString.length;

      pdf.text(
        divNrString,
        scaleBarPosition.x + dividerNrPosition - dividerStrLength,
        scaleBarPosition.y + 8
      );
    }
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
      scaleBarPosition.y - 1
    );

    this.addDividerLinesAndTexts({
      pdf,
      scale,
      scaleBarLengthMeters,
      scaleBarPosition,
      scaleBarLength,
      color,
    });
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
        crossOrigin: source.crossOrigin ?? "anonymous",
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
        const url = new URL(src);
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

  // Adds fonts needed to properly render necessary characters. (The default jsPDF fonts does not support all characters).
  // Also enables a font (in the future we could provide a possibility for the user to select font).
  setupFonts = (pdf, font = "ROBOTO_NORMAL") => {
    // First we'll add the available fonts
    pdf.addFileToVFS("roboto-normal.ttf", ROBOTO_NORMAL);
    pdf.addFont("roboto-normal.ttf", "roboto-normal", "normal");
    // Then we'll set the font we want to use now. (The switch below is unnecessary but
    // added for possible future use cases).
    switch (font) {
      case "ROBOTO_NORMAL":
        pdf.setFont("roboto-normal");
        break;
      default:
        break;
    }
  };

  print = async (options) => {
    return new Promise((resolve, reject) => {
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

        // Make sure to add necessary fonts and enable the font we want to use.
        this.setupFonts(pdf, "ROBOTO_NORMAL");

        // Add our map canvas to the PDF, start at x/y=0/0 and stretch for entire width/height of the canvas
        pdf.addImage(mapCanvas, "JPEG", 0, 0, dim[0], dim[1]);

        if (this.includeImageBorder) {
          // Frame color is set to dark gray
          pdf.setDrawColor(this.textColor);
          pdf.setLineWidth(0.5);
          pdf.rect(0.3, 0.3, dim[0] - 0.5, dim[1] - 0, "S");
        }

        // Add potential margin around the image
        if (this.margin > 0) {
          // We always want a white margin
          pdf.setDrawColor("white");
          // We want to check if user has chosen to put icons and text
          // in the margins, which if so, must be larger than usual
          // Note that we first check if user has NOT chosen this (!).
          if (!options.useTextIconsInMargin) {
            // The lineWidth increases the line width equally to "both sides",
            // therefore, we must have a line width two times the margin we want.
            pdf.setLineWidth(this.margin * 2);
            // Draw the border (margin) around the entire image
            pdf.rect(0, 0, dim[0], dim[1], "S");
            // If selected as feature in Admin, we draw a frame around the map image
            if (this.includeImageBorder) {
              // Frame color is set to dark gray
              pdf.setDrawColor(this.textColor);
              pdf.setLineWidth(0.5);
              pdf.rect(
                this.margin,
                this.margin,
                dim[0] - this.margin * 2,
                dim[1] - this.margin * 2,
                "S"
              );
            }
            // Now we check if user did choose text in margins
          } else {
            // We do a special check for a5-format and set the dimValue
            // to get the correct margin values when drawing the rectangle
            let dimValue =
              options.format === "a5" ? this.margin + 2 : this.margin;
            // This lineWidth needs to be larger if user has chosen text in margins
            pdf.setLineWidth(dimValue * 6);
            // Draw the increased border (margin) around the entire image
            // here with special values for larger margins.
            pdf.rect(-(dimValue * 2), 0, dim[0] + dimValue * 4, dim[1], "S");
            // If selected as feature in Admin, we draw a frame around the map image
            if (this.includeImageBorder) {
              // Frame color is set to dark gray
              pdf.setDrawColor(this.textColor);
              pdf.setLineWidth(0.5);
              pdf.rect(
                dimValue,
                dimValue * 3,
                dim[0] - dimValue * 2,
                dim[1] - dimValue * 6,
                "S"
              );
            }
          }
        }
        // If logo URL is provided, add the logo to the map
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
          let verticalMargin = options.useTextIconsInMargin
            ? 8 + this.margin
            : 12 + this.margin;
          pdf.setFontSize(24);
          pdf.setTextColor(options.mapTextColor);
          pdf.text(options.mapTitle, dim[0] / 2, verticalMargin, {
            align: "center",
          });
        }

        // Add print comment if user supplied one
        if (options.printComment.trim().length > 0) {
          let yPos = options.useTextIconsInMargin
            ? 13 + this.margin
            : 18 + this.margin;
          pdf.setFontSize(11);
          pdf.setTextColor(options.mapTextColor);
          pdf.text(options.printComment, dim[0] / 2, yPos, {
            align: "center",
          });
        }

        // Add potential copyright text
        if (this.copyright.length > 0) {
          let yPos = options.useTextIconsInMargin
            ? this.textIconsMargin + this.margin / 2
            : this.margin;
          pdf.setFontSize(8);
          pdf.setTextColor(options.mapTextColor);
          pdf.text(this.copyright, dim[0] - 4 - yPos, dim[1] - 5.5 - yPos, {
            align: "right",
          });
        }

        // Add potential date text
        if (this.date.length > 0) {
          const date = this.date.replace(
            "{date}",
            new Date().toLocaleDateString()
          );
          let yPos = options.useTextIconsInMargin
            ? this.textIconsMargin + this.margin / 2
            : this.margin;
          pdf.setFontSize(8);
          pdf.setTextColor(options.mapTextColor);
          pdf.text(date, dim[0] - 4 - yPos, dim[1] - 2 - yPos, {
            align: "right",
          });
        }

        // Add potential disclaimer text
        if (this.disclaimer.length > 0) {
          let yPos = options.useTextIconsInMargin
            ? this.textIconsMargin + this.margin / 2
            : this.margin;
          pdf.setFontSize(8);
          pdf.setTextColor(options.mapTextColor);
          let textLines = pdf.splitTextToSize(
            this.disclaimer,
            dim[0] / 2 - this.margin - 8
          );
          let textLinesDims = pdf.getTextDimensions(textLines, { fontSize: 8 });
          pdf.text(
            textLines,
            dim[0] - 4 - yPos,
            dim[1] - 6 - yPos - textLinesDims.h,
            {
              align: "right",
            }
          );
        }

        // Since we've been messing with the layer-settings while printing, we have to
        // make sure to reset these settings. (Should only be done if custom loaders has been used).
        this.useCustomTileLoaders && this.resetPrintLayers();

        // Finally, save the PDF (or PNG)
        this.saveToFile(pdf, width, options.saveAsType)
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

  // Imports and returns the dependencies required to create a PNG-print-export.
  #getPngDependencies = async () => {
    try {
      const pdfjs = await import("pdfjs-dist/build/pdf");
      return { pdfjs };
    } catch (error) {
      throw new Error(
        `Failed to import required dependencies. Error: ${error}`
      );
    }
  };

  // Saves the supplied PDF with the supplied file-name.
  #saveToPdf = async (pdf, fileName) => {
    try {
      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      throw new Error(`Failed to save PDF. Error: ${error}`);
    }
  };

  // Saves the supplied PDF *as a PNG* with the supplied file-name.
  // The width of the document has to be supplied since some calculations
  // must be done in order to create a PNG with the correct resolution etc.
  #saveToPng = async (pdf, fileName, width, type) => {
    try {
      // First we'll dynamically import the required dependencies.
      const { pdfjs } = await this.#getPngDependencies();
      // Then we'll set up the pdfJS-worker. TODO: Terrible?! PDF-js does not seem to have a better solution for the
      // source-map-errors that occur from setting the worker the ordinary way.
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
      // We'll output the PDF as an array-buffer that can be used to create the PNG.
      const ab = pdf.output("arraybuffer");
      // We'll use the PDF-JS library to create a new "PDF-JS-PDF". (Wasteful? Yes very, but the JS-PDF-library
      // does not support export to any other format than PDF, and the PDF-JS-library does.) Notice that
      // JS-PDF and PDF-JS are two different libraries, both with their pros and cons.
      // - PDF-JS: Pro => Can export to PNG, Con: Cannot create as nice of an image as JS-PDF.
      // - JS-PDF: Pro => Creates good-looking PDFs, Con: Cannot export to PNG.
      // - Conclusion: We use both...
      return new Promise((resolve) => {
        pdfjs.getDocument({ data: ab }).promise.then((pdf) => {
          // So, when the PDF-JS-PDF is created, we get the first page, and then render
          // it on a canvas so that we can export it as a PNG.
          pdf.getPage(1).then((page) => {
            // We're gonna need a canvas and its context.
            let canvas = document.createElement("canvas");
            let ctx = canvas.getContext("2d");
            // Scale the viewport to match current resolution
            const viewport = page.getViewport({ scale: 1 });
            const scale = width / viewport.width;
            const scaledViewport = page.getViewport({ scale: scale });
            // Create the render-context-object.
            const renderContext = {
              canvasContext: ctx,
              viewport: scaledViewport,
            };
            // Set the canvas dimensions to the correct width and height.
            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;
            // Then we'll render and save!
            page.render(renderContext).promise.then(() => {
              canvas.toBlob((blob) => {
                type !== "BLOB" && saveAs(blob, `${fileName}.png`);
                resolve(blob);
              });
            });
          });
        });
      });
    } catch (error) {
      throw new Error(`Failed to save PNG. Error: ${error}`);
    }
  };

  // Saves the print-contents to file, either PDF, or PNG (depending on supplied type).
  saveToFile = async (pdf, width, type) => {
    return new Promise((resolve) => {
      // We're gonna need to create a file-name.
      const fileName = `Kartexport - ${new Date().toLocaleString()}`;
      // Then we'll try to save the contents in the format the user requested.
      try {
        switch (type) {
          case "PDF":
            return this.#saveToPdf(pdf, fileName);
          case "PNG":
          case "BLOB":
            console.log("in correct switch");
            return resolve(this.#saveToPng(pdf, fileName, width, type));
          default:
            throw new Error(
              `Supplied type could not be handled. The supplied type was ${type} and currently only PDF and PNG is supported.`
            );
        }
      } catch (error) {
        throw new Error(`Failed to save file... ${error}`);
      }
    });
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

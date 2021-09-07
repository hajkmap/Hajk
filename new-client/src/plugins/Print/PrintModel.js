import { delay } from "../../utils/Delay";
import { getPointResolution } from "ol/proj";
import { getCenter } from "ol/extent";
import jsPDF from "jspdf";
import * as PDFjs from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

import Vector from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import Polygon from "ol/geom/Polygon";
import Feature from "ol/Feature.js";
import { Translate } from "ol/interaction.js";
import Collection from "ol/Collection";
import { Style, Stroke, Fill } from "ol/style.js";
import { saveAs } from "file-saver";

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

  // Used to store some values that will be needed for resetting the map
  valuesToRestoreFrom = {};

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
    const dpi = 25.4 / 0.28,
      mpu = this.map.getView().getProjection().getMetersPerUnit(),
      inchesPerMeter = 39.37,
      res = this.map.getView().getResolution();

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
    // resolution of the map.
    return desiredResolution >= this.map.getView().getMinResolution();
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
    const size = this.map.getSize();
    const originalResolution = this.map.getView().getResolution();
    const originalCenter = this.map.getView().getCenter();

    // We must check if the resolution is constrained, if it is, we must
    // turn it off while printing so that the map can be zoomed to the correct extent.
    // Saving the value so that we can put everything back to normal when done.
    const resolutionConstrained = this.map.getView().getConstrainResolution();
    resolutionConstrained && this.map.getView().setConstrainResolution(false);

    const scaleResolution = this.getScaleResolution(
      scale,
      resolution,
      originalCenter
    );

    // Save some of our values that are necessary to use if user want to cancel the process
    this.valuesToRestoreFrom = {
      size,
      originalCenter,
      originalResolution,
      scaleResolution,
      resolutionConstrained,
    };

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
          this.previewLayer.setVisible(true);
          resolutionConstrained &&
            this.map.getView().setConstrainResolution(true);
          this.map.setSize(size);
          this.map.getView().setResolution(originalResolution);
          this.map.getView().setCenter(originalCenter);
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
    this.previewLayer.setVisible(true);
    this.map.setSize(this.valuesToRestoreFrom.size);
    this.map
      .getView()
      .setResolution(this.valuesToRestoreFrom.originalResolution);
    this.map.getView().setCenter(this.valuesToRestoreFrom.originalCenter);
    this.valuesToRestoreFrom.resolutionConstrained &&
      this.map.getView().setConstrainResolution(true);
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

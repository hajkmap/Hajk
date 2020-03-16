import React from "react";
import { createPortal } from "react-dom";
import { delay } from "../../utils/Delay";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Popover,
  Tooltip,
  IconButton,
  FormControlLabel
} from "@material-ui/core";
import PaletteIcon from "@material-ui/icons/Palette";

import * as jsPDF from "jspdf";
import { TwitterPicker as ColorPicker } from "react-color";

import { getPointResolution } from "ol/proj";
import { getCenter } from "ol/extent";
import Vector from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import Polygon from "ol/geom/Polygon";
import Feature from "ol/Feature.js";
import { Translate } from "ol/interaction.js";
import Collection from "ol/Collection";
import { Style, Stroke, Fill } from "ol/style.js";

import "ol-ext/dist/ol-ext.css";

const styles = theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 225
  },
  mapTextColorLabel: {
    margin: 0
  }
});

class PrintView extends React.PureComponent {
  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    enqueueSnackbar: PropTypes.func.isRequired,
    closeSnackbar: PropTypes.func.isRequired
  };

  static defaultProps = {};

  state = {
    format: "a4", // a0-a5
    orientation: "landscape",
    resolution: 150, // 72, 150, 300,
    scale: 10000, // 10000 means scale of 1:10000
    mapTitle: "", // User can set a title that will get printed on the map
    mapTextColor: "#ffffff", // Default color of text printed on the map
    printInProgress: false,
    previewLayerVisible: false
  };

  previewLayer = null;
  previewFeature = null;

  // Paper dimensions: Array[width, height]
  dims = {
    a0: [1189, 841],
    a1: [841, 594],
    a2: [594, 420],
    a3: [420, 297],
    a4: [297, 210],
    a5: [210, 148]
  };

  // Default scales, used if none supplied in options
  scales = [
    100,
    250,
    500,
    1000,
    2500,
    5000,
    10000,
    25000,
    50000,
    100000,
    200000,
    500000
  ];

  // Default colors for color picker used to set text color (used in map title, scale, etc)
  mapTextAvailableColors = [
    "#FFFFFF",
    "#D0021B",
    "#F5A623",
    "#F8E71C",
    "#8B572A",
    "#7ED321",
    "#417505",
    "#9013FE",
    "#4A90E2",
    "#50E3C2",
    "#B8E986",
    "#000000",
    "#4A4A4A",
    "#9B9B9B"
  ];

  // Used to store some values that will be needed for resetting the map
  valuesToRestoreFrom = {};

  // A flag that's used in "rendercomplete" to ensure that user has not cancelled the request
  pdfCreationCancelled = null;

  /**
   * @description Using toLocalString for sv-SE is the easiest way to get space as thousand separator.
   *
   * @param {*} scale Number that will be prefixed with "1:"
   * @returns {string} Input parameter, prefixed by "1:" and with spaces as thousands separator, e.g "5000" -> "1:5 000".
   */
  getUserFriendlyScale = scale => {
    return `1:${Number(scale).toLocaleString("sv-SE")}`;
  };

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
    this.map = this.props.map;

    // Prepare scales from admin options, fallback to default if needed
    if (typeof props?.options?.scales !== "string") {
      // We expect a string from admin, if we don't get it, use hard-coded defaults
      props.options.scales = this.scales;
    } else {
      // If we have a string, remove all whitespace in it and split into an Array
      props.options.scales = props.options.scales.replace(/\s/g, "").split(",");
    }

    // If no valid max logo width is supplied, use a hard-coded default
    props.options.logoMaxWidth =
      typeof props.options?.logoMaxWidth === "number"
        ? props.options.logoMaxWidth
        : 40;

    this.options = props.options;

    // Add the preview layer to map (it doesn't contain any features yet!)
    this.addPreviewLayer();

    // If plugin is visible at start, ensure we show the preview feature too
    if (props.options.visibleAtStart === true)
      this.state.previewLayerVisible = true;

    props.localObserver.subscribe("showPrintPreview", () => {
      this.setState({ previewLayerVisible: true });
    });

    props.localObserver.subscribe("hidePrintPreview", () => {
      this.setState({ previewLayerVisible: false });
    });
  }

  addPreviewLayer() {
    this.previewLayer = new Vector({
      source: new VectorSource(),
      name: "preview-layer",
      style: new Style({
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.7)",
          width: 2
        }),
        fill: new Fill({
          color: "rgba(255, 145, 20, 0.4)"
        })
      })
    });
    this.map.addLayer(this.previewLayer);
  }

  removePreview = () => {
    this.previewFeature = undefined;
    this.previewLayer.getSource().clear();
    this.map.removeInteraction(this.translate);
  };

  getPreviewCenter = () => {
    const extent = this.previewFeature.getGeometry().getExtent();
    return getCenter(extent);
  };

  addPreview() {
    const scale = this.state.scale;
    const format = this.state.format;
    const orientation = this.state.orientation;

    const dim =
      orientation === "portrait"
        ? [...this.dims[format]].reverse()
        : this.dims[format];

    const size = { width: dim[0] / 25.4, height: dim[1] / 25.4 },
      inchInMillimeter = 25.4,
      defaultPixelSizeInMillimeter = 0.28,
      dpi = inchInMillimeter / defaultPixelSizeInMillimeter; // ~90

    const paper = {
      width: size.width * dpi,
      height: size.height * dpi
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
          [center[0] - w, center[1] - y]
        ]
      ],
      feature = new Feature({
        geometry: new Polygon(coords)
      });

    // Each time print settings change, we actually render a new preview feature,
    // so first let's remove the old one.
    this.removePreview();

    // Now re-add feature, source and interaction to map.
    this.previewFeature = feature;
    this.previewLayer.getSource().addFeature(feature);
    this.translate = new Translate({
      features: new Collection([feature])
    });
    this.map.addInteraction(this.translate);
  }

  renderPreviewFeature = () => {
    if (this.state.previewLayerVisible === true) {
      this.addPreview();
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
  getImageDataBlogFromUrl = url => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.setAttribute("crossOrigin", "anonymous"); //getting images from external domain

      // We must resolve the promise even if
      image.onerror = function(err) {
        reject(err);
      };

      // When load succeeds
      image.onload = function() {
        const imgCanvas = document.createElement("canvas");
        imgCanvas.width = this.naturalWidth;
        imgCanvas.height = this.naturalHeight;

        // Draw the image on canvas so that we can read the data blob later on
        imgCanvas.getContext("2d").drawImage(this, 0, 0);

        resolve({
          data: imgCanvas.toDataURL("image/png"), // read data blob from canvas
          width: imgCanvas.width, // also return dimensions so we can use them later
          height: imgCanvas.height
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
      height: sourceHeight
    } = await this.getImageDataBlogFromUrl(url);

    // We must ensure that the logo will be printed with a max width of X, while keeping the aspect ratio between width and height
    const ratio = maxWidth / sourceWidth;
    const width = sourceWidth * ratio;
    const height = sourceHeight * ratio;
    return { data, width, height };
  };

  initiatePrint = e => {
    // Print can be initiated by submitting the <form>. In that case, we must prevent default behavior.
    e.preventDefault();
    // Print starts, tell the user
    this.setState({ printInProgress: true });
    const snackbarKey = this.props.enqueueSnackbar(
      "Utskrift pågår – var god vänta…",
      {
        variant: "info",
        persist: true
      }
    );

    // Read current dropdown values
    const format = this.state.format;
    const orientation = this.state.orientation;
    const resolution = this.state.resolution;
    const scale = this.state.scale / 1000;

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
    const scaleResolution =
      scale /
      getPointResolution(
        this.map.getView().getProjection(),
        resolution / 25.4,
        originalCenter
      );

    // Save some of our values that are necessary to use if user want to cancel the process
    this.valuesToRestoreFrom = {
      size,
      originalCenter,
      originalResolution,
      scaleResolution,
      snackbarKey
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

      // Each canvas element inside OpenLayer's viewport should get printed
      document.querySelectorAll(".ol-viewport canvas").forEach(canvas => {
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
        compress: true
      });

      // Add our map canvas to the PDF, start at x/y=0/0 and stretch for entire width/height of the canvas
      pdf.addImage(mapCanvas, "JPEG", 0, 0, dim[0], dim[1]);

      // If logo URL is provided, add the logo to the map
      if (this.options.logo.trim().length >= 5) {
        try {
          const {
            data: logoData,
            width: logoWidth,
            height: logoHeight
          } = await this.getImageForPdfFromUrl(
            this.options.logo,
            this.options.logoMaxWidth
          );
          pdf.addImage(
            logoData,
            "PNG",
            pdf.internal.pageSize.width - logoWidth - 6,
            4,
            logoWidth,
            logoHeight
          );
        } catch (error) {
          // The image loading may fail due to e.g. wrong URL, so let's catch the rejected Promise
          this.props.enqueueSnackbar(
            "Felaktiga inställningar för logotyp. Var god meddela administratören.",
            { variant: "warning" }
          );
        }
      }

      // Add scale text
      pdf.setFontStyle("bold");
      pdf.setFontSize(8);
      pdf.setTextColor(this.state.mapTextColor);
      pdf.text(
        `Skala: ${this.getUserFriendlyScale(scale * 1000)}`,
        6,
        pdf.internal.pageSize.height - 4
      );

      // Add map title if user supplied one
      if (this.state.mapTitle.trim().length > 0) {
        pdf.setFontSize(24);
        pdf.text(this.state.mapTitle, 6, 12);
      }

      // Finally, save the PDF, add a timestamp to filename
      pdf.save(`Hajk - ${new Date().toLocaleString()}.pdf`);

      // Reset map to how it was before print
      this.previewLayer.setVisible(true);
      this.map.setSize(size);
      this.map.getView().setResolution(originalResolution);
      this.map.getView().setCenter(originalCenter);

      // Print done, hide messages
      this.props.closeSnackbar(snackbarKey);
      this.props.enqueueSnackbar("Din utskrift är klar!", {
        variant: "success"
      });
      this.setState({ printInProgress: false });
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

  /**
   * @summary Make it possible to cancel a printout by clicking a button.
   *
   */
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

    // Print done, hide messages
    this.props.closeSnackbar(this.valuesToRestoreFrom.snackbarKey);
    this.props.enqueueSnackbar(
      "Du avbröt utskriften – ingen data har sparats",
      {
        variant: "warning"
      }
    );
    this.setState({ printInProgress: false });
  };

  /**
   * @summary Take care of handling state of our resolution and format dropdowns.
   *
   * @param {Object} event
   */
  handleChange = event => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  toggleColorPicker = e => {
    this.setState({ anchorEl: e.currentTarget });
  };

  hideColorPicker = e => {
    this.setState({ anchorEl: null });
  };

  handleMapTextColorChangeComplete = color => {
    this.hideColorPicker();
    this.setState({ mapTextColor: color.hex });
  };

  render() {
    const { classes } = this.props;

    this.renderPreviewFeature();

    return (
      <>
        {createPortal(
          <Dialog
            disableBackdropClick={true}
            disableEscapeKeyDown={true}
            open={this.state.printInProgress}
          >
            <LinearProgress />
            <DialogTitle>Din PDF skapas</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Det här kan ta en stund, speciellt om du har valt ett stort
                format (A2-A3) och hög upplösning (>72 dpi). Men när allt är
                klart kommer PDF-filen att laddas ner till din dator.
                <br />
                <br />
                Om du inte vill vänta längre kan du avbryta utskriften genom att
                trycka på knappen nedan.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button variant="contained" onClick={this.cancelPrint}>
                Avbryt
              </Button>
            </DialogActions>
          </Dialog>,
          document.getElementById("root")
        )}
        <form
          className={classes.root}
          autoComplete="off"
          onSubmit={this.initiatePrint}
        >
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="format">Format</InputLabel>
            <Select
              value={this.state.format}
              onChange={this.handleChange}
              inputProps={{
                name: "format",
                id: "format"
              }}
            >
              <MenuItem value={"a2"}>A2</MenuItem>
              <MenuItem value={"a3"}>A3</MenuItem>
              <MenuItem value={"a4"}>A4</MenuItem>
              <MenuItem value={"a5"}>A5</MenuItem>
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="orientation">Orientering</InputLabel>
            <Select
              value={this.state.orientation}
              onChange={this.handleChange}
              inputProps={{
                name: "orientation",
                id: "orientation"
              }}
            >
              <MenuItem value={"landscape"}>Liggande</MenuItem>
              <MenuItem value={"portrait"}>Stående</MenuItem>
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="resolution">Upplösning (DPI)</InputLabel>
            <Select
              value={this.state.resolution}
              onChange={this.handleChange}
              inputProps={{
                name: "resolution",
                id: "resolution"
              }}
            >
              <MenuItem value={72}>72</MenuItem>
              <MenuItem value={150}>150</MenuItem>
              <MenuItem value={300}>300</MenuItem>
            </Select>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="scale">Skala</InputLabel>
            <Select
              value={this.state.scale}
              onChange={this.handleChange}
              inputProps={{
                name: "scale",
                id: "scale"
              }}
            >
              {this.options.scales.map((scale, i) => {
                // Note: it is crucial to keep the scale value (in state) divided by 1000 from what is shown to user!
                return (
                  <MenuItem key={i} value={scale}>
                    {this.getUserFriendlyScale(scale)}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl className={classes.formControl}>
            <TextField
              value={this.state.mapTitle}
              onChange={this.handleChange}
              label="Valfri titel"
              placeholder="Kan lämnas tomt"
              variant="standard"
              inputProps={{
                id: "mapTitle",
                name: "mapTitle"
              }}
            />
          </FormControl>
          <FormControl className={classes.formControl}>
            <Tooltip title="Textfärg påverkar inte kartans etiketter utan styr endast färgen för kringliggande texter, så som titel, copyrighttext, etc.">
              <FormControlLabel
                value="mapTextColor"
                className={classes.mapTextColorLabel}
                control={
                  <IconButton
                    id="mapTextColor"
                    onClick={this.toggleColorPicker}
                    style={{
                      backgroundColor: this.state.mapTextColor,
                      marginRight: 4
                    }}
                    size="small"
                    edge="start"
                  >
                    <PaletteIcon />
                  </IconButton>
                }
                label="Textfärg"
              />
            </Tooltip>
          </FormControl>

          <Popover
            id="color-picker-menu"
            anchorEl={this.state.anchorEl}
            open={Boolean(this.state.anchorEl)}
            onClose={this.hideColorPicker}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center"
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "center"
            }}
          >
            <ColorPicker
              color={this.state.mapTextColor}
              colors={this.mapTextAvailableColors}
              onChangeComplete={this.handleMapTextColorChangeComplete}
            />
          </Popover>
          <FormControl className={classes.formControl}>
            <Button
              variant="contained"
              fullWidth={true}
              color="primary"
              onClick={this.initiatePrint}
              disabled={this.state.printInProgress}
            >
              Skriv ut
            </Button>
          </FormControl>
        </form>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(PrintView));

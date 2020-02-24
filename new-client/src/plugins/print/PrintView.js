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
  Backdrop,
  CircularProgress,
  Typography
} from "@material-ui/core";

import * as jsPDF from "jspdf";
import { getPointResolution } from "ol/proj";
import { getCenter } from "ol/extent";

import Vector from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import Polygon from "ol/geom/Polygon";
import Feature from "ol/Feature.js";
import { Translate } from "ol/interaction.js";
import Collection from "ol/Collection";
import { Style, Stroke, Fill } from "ol/style.js";

const styles = theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff",
    display: "flex",
    flexDirection: "column"
  },
  backdropText: {
    marginTop: theme.spacing(3),
    fontStyle: "italic"
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 150
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
    scale: 10, // 0.5, 1, 2.5, 5, 10, 25, 50, 100, 200 (e.g. 1:10 000, 1:25 000, etc)
    printInProgress: false,
    previewLayerVisible: false
  };

  previewFeature = null;
  previewLayer = null;

  // Paper dimensions: Array[width, height]
  dims = {
    a0: [1189, 841],
    a1: [841, 594],
    a2: [594, 420],
    a3: [420, 297],
    a4: [297, 210],
    a5: [210, 148]
  };

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
    this.map = this.props.map;

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
    const scale = this.state.scale * 1000;
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

  initiatePrint = () => {
    // Print star, tell the user
    this.setState({ printInProgress: true });
    const snackbarKey = this.props.enqueueSnackbar(
      "Utskrift pågår – var god vänta…",
      {
        variant: "info",
        persist: true
      }
    );

    // Read current dropdown values)
    const format = this.state.format;
    const orientation = this.state.orientation;
    const resolution = this.state.resolution;
    const scale = this.state.scale;

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

    this.map.once("rendercomplete", async () => {
      // This is needed to prevent some buggy output from some browsers
      // when a lot of tiles are being rendered (it could result in black
      // canvas PDF)
      await delay(500);

      const mapCanvas = document.createElement("canvas");
      mapCanvas.width = width;
      mapCanvas.height = height;
      const mapContext = mapCanvas.getContext("2d");

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

      const pdf = new jsPDF({
        orientation,
        format,
        putOnlyUsedFonts: true,
        compress: true
      });

      pdf.addImage(
        // mapCanvas.toDataURL("image/jpeg"),
        mapCanvas,
        "JPEG",
        0,
        0,
        dim[0],
        dim[1]
      );

      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(
        `Skala: 1:${Number(scale * 1000).toLocaleString("sv-SE")}`,
        10,
        pdf.internal.pageSize.height - 10
      );
      pdf.text("Test string", 0, 0);
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

    this.map.setSize(printSize);
    this.map.getView().setCenter(printCenter);
    this.map.getView().setResolution(scaleResolution);
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

  render() {
    const { classes } = this.props;

    this.renderPreviewFeature();

    return (
      <>
        {createPortal(
          <Backdrop
            open={this.state.printInProgress}
            className={classes.backdrop}
          >
            <CircularProgress color="inherit" />
            <Typography className={classes.backdropText} variant="h5">
              Din PDF skapas…
            </Typography>
          </Backdrop>,
          document.getElementById("root")
        )}
        <form className={classes.root} autoComplete="off">
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
              <MenuItem value={0.1}>1:100</MenuItem>
              <MenuItem value={0.25}>1:250</MenuItem>
              <MenuItem value={0.5}>1:500</MenuItem>
              <MenuItem value={1}>1:1 000</MenuItem>
              <MenuItem value={2.5}>1:2 500</MenuItem>
              <MenuItem value={5}>1:5 000</MenuItem>
              <MenuItem value={10}>1:10 000</MenuItem>
              <MenuItem value={25}>1:25 000</MenuItem>
              <MenuItem value={50}>1:50 000</MenuItem>
              <MenuItem value={100}>1:100 000</MenuItem>
              <MenuItem value={200}>1:200 000</MenuItem>
            </Select>
          </FormControl>
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

import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select
} from "@material-ui/core";

import * as jsPDF from "jspdf";
import { getPointResolution } from "ol/proj";

import Vector from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import { Style, Stroke, Fill, Icon, Circle } from "ol/style.js";

const styles = theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 150
  }
});

class DummyView extends React.PureComponent {
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
    format: "a5", // a0-a5
    orientation: "landscape",
    resolution: 150, // 72, 150, 300,
    scale: 100, // 10, 25, 50, 100, 200 (e.g. 1:10 000, 1:25 000, etc)
    printInProgress: false,
    previewLayerVisible: false
  };

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
    // TODO: Also add a preview layer
    // this.addPreviewLayer();

    // props.localObserver.subscribe("showPrintPreview", () => {
    //   this.setState({ previewLayerVisible: true });
    //   this.addPreview();
    // });

    // props.localObserver.subscribe("hidePrintPreview", () => {
    //   this.setState({ previewLayerVisible: false });
    //   this.removePreview();
    // });
  }

  // addPreviewLayer() {
  //   this.previewLayer = new Vector({
  //     source: new VectorSource(),
  //     name: "preview-layer",
  //     style: new Style({
  //       stroke: new Stroke({
  //         color: "rgba(0, 0, 0, 0.7)",
  //         width: 2
  //       }),
  //       fill: new Fill({
  //         color: "rgba(255, 145, 20, 0.4)"
  //       })
  //     })
  //   });
  //   this.map.addLayer(this.previewLayer);
  // }

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
        ? this.dims[format].reverse()
        : this.dims[format];

    const width = Math.round((dim[0] * resolution) / 25.4);
    const height = Math.round((dim[1] * resolution) / 25.4);
    const size = this.map.getSize();
    const viewResolution = this.map.getView().getResolution();

    var scaleResolution =
      scale /
      getPointResolution(
        this.map.getView().getProjection(),
        resolution / 25.4,
        this.map.getView().getCenter()
      );

    this.map.once("rendercomplete", () => {
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

      const pdf = new jsPDF({ orientation, format });
      pdf.addImage(
        mapCanvas.toDataURL("image/jpeg"),
        "JPEG",
        0,
        0,
        dim[0],
        dim[1]
      );
      pdf.save("map.pdf");

      // Reset map size
      this.map.setSize(size);
      this.map.getView().setResolution(viewResolution);

      // Print done, hide messages
      this.props.closeSnackbar(snackbarKey);
      this.props.enqueueSnackbar("Din utskrift är klar!", {
        variant: "success"
      });
      this.setState({ printInProgress: false });
    });

    // Set print size (this will initiate print, as we have a listener for renderComplete)
    const printSize = [width, height];
    this.map.setSize(printSize);
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

    return (
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
    );
  }
}

export default withStyles(styles)(withSnackbar(DummyView));

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
  state = {
    format: "a5", // a0-a5
    resolution: "150", // 72, 150, 300,
    printInProgress: false,
    previewLayerVisible: false
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    enqueueSnackbar: PropTypes.func.isRequired,
    closeSnackbar: PropTypes.func.isRequired
  };

  static defaultProps = {};

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

    props.localObserver.subscribe("showPrintPreview", () => {
      this.setState({ previewLayerVisible: true });
      // this.addPreview(props.model.map);
    });

    props.localObserver.subscribe("hidePrintPreview", () => {
      this.setState({ previewLayerVisible: false });
      // this.removePreview();
    });
  }

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

    const format = this.state.format;
    const resolution = this.state.resolution;
    const dim = this.dims[format];
    const width = Math.round((dim[0] * resolution) / 25.4);
    const height = Math.round((dim[1] * resolution) / 25.4);
    const size = this.map.getSize();
    const viewResolution = this.map.getView().getResolution();
    // console.log(dim, width, height, size, viewResolution);
    this.map.once("rendercomplete", () => {
      const mapCanvas = document.createElement("canvas");
      mapCanvas.width = width;
      mapCanvas.height = height;
      const mapContext = mapCanvas.getContext("2d");

      document.querySelectorAll(".ol-layer canvas").forEach(canvas => {
        if (canvas.width > 0) {
          const opacity = canvas.parentNode.style.opacity;
          mapContext.globalAlpha = opacity === "" ? 1 : Number(opacity);
          const transform = canvas.style.transform;
          // Get the transform parameters from the style's transform matrix
          const matrix = transform
            .match(/^matrix\(([^(]*)\)$/)[1]
            .split(",")
            .map(Number);
          // Apply the transform to the export map context
          CanvasRenderingContext2D.prototype.setTransform.apply(
            mapContext,
            matrix
          );
          mapContext.drawImage(canvas, 0, 0);
        }
      });

      const pdf = new jsPDF({ orientation: "landscape", format: format });
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

    // Set print size (this will initiate print, as we have a listiner for renderComplete)
    const printSize = [width, height];
    this.map.setSize(printSize);
    const scaling = Math.min(width / size[0], height / size[1]);
    this.map.getView().setResolution(viewResolution / scaling);
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
          <InputLabel htmlFor="resolution">Upplösning</InputLabel>
          <Select
            value={this.state.resolution}
            onChange={this.handleChange}
            inputProps={{
              name: "resolution",
              id: "resolution"
            }}
          >
            <MenuItem value={72}>Låg</MenuItem>
            <MenuItem value={150}>Normal</MenuItem>
            <MenuItem value={300}>Hög</MenuItem>
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

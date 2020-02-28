import React from "react";
import propTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";

import {
  Paper,
  FormControl,
  Button,
  Input,
  InputLabel,
  NativeSelect,
  LinearProgress
} from "@material-ui/core";
import ArrowDownward from "@material-ui/icons/ArrowDownward";
import PictureAsPdf from "@material-ui/icons/PictureAsPdf";

import { getCenter } from "ol/extent.js";
const styles = theme => ({
  root: {
    display: "flex",
    flexGrow: 1,
    flexWrap: "wrap"
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120
  },
  selectEmpty: {
    marginTop: theme.spacing(2)
  },
  loader: {
    opacity: 1,
    transition: "opacity 2s ease-in"
  },
  icon: {
    marginRight: theme.spacing(1)
  }
});

class ExportPdfSettings extends React.PureComponent {
  static propTypes = {
    classes: propTypes.object.isRequired,
    localObserver: propTypes.object.isRequired,
    model: propTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.resolutions = [72, 96, 150, 200, 300];
    this.paperFormats = ["A2", "A3", "A4"];
    this.state = {
      selectFormat: "A4",
      selectOrientation: "S",
      selectScale:
        props.model.scales[Math.floor(props.model.scales.length / 2)], // Start with the scale in the middle of array
      manualScale: "10000",
      selectResolution: "72",
      center: props.model.getPreviewFeature()
        ? props.model.getPreviewCenter()
        : props.model.map.getView().getCenter(),
      loading: false,
      previewLayerVisible: false
    };

    props.localObserver.subscribe("showPreviewLayer", () => {
      this.setState({ previewLayerVisible: true });
      this.addPreview(props.model.map);
    });

    props.localObserver.subscribe("hidePreviewLayer", () => {
      this.setState({ previewLayerVisible: false });
      this.removePreview();
    });
  }

  getPaperMeasures() {
    var pageSize = format => {
      switch (format) {
        case "A4":
          return {
            width: this.getOrientation() === "L" ? 297 : 210,
            height: this.getOrientation() === "L" ? 210 : 297
          };
        case "A3":
          return {
            width: this.getOrientation() === "L" ? 420 : 297,
            height: this.getOrientation() === "L" ? 297 : 420
          };
        case "A2":
          return {
            width: this.getOrientation() === "L" ? 594 : 420,
            height: this.getOrientation() === "L" ? 420 : 594
          };
        default: {
          return {
            width: 0,
            height: 0
          };
        }
      }
    };

    var width = pageSize(this.getFormat()).width,
      height = pageSize(this.getFormat()).height;

    return {
      width: width / 25.4,
      height: height / 25.4
    };
  }

  getPreviewPaperMeasures() {
    var size = this.getPaperMeasures(),
      inchInMillimeter = 25.4,
      defaultPixelSizeInMillimeter = 0.28,
      dpi = inchInMillimeter / defaultPixelSizeInMillimeter; // ~90
    return {
      width: size.width * dpi,
      height: size.height * dpi
    };
  }

  getScale() {
    return this.state.selectScale === "other"
      ? !Number.isNaN(Number(this.state.manualScale))
        ? this.state.manualScale
        : 0
      : this.state.selectScale;
  }

  getResolution() {
    return this.state.selectResolution;
  }

  getOrientation() {
    return this.state.selectOrientation;
  }

  getFormat() {
    return this.state.selectFormat;
  }

  setFormat = e => {
    this.setState({
      selectFormat: e.target.value
    });
  };

  setResolution = e => {
    this.setState({
      selectResolution: e.target.value
    });
  };

  setScale = e => {
    this.setState({
      selectScale: e.target.value
    });
  };

  setCenter = val => {
    this.setState({
      center: val
    });
  };

  setManualScale = e => {
    var v = e.target.value.startsWith("1:")
      ? e.target.value.split(":")[1]
      : e.target.value;
    this.setState({
      manualScale: v
    });
  };

  setOrientation = e => {
    this.setState({
      selectOrientation: e.target.value
    });
  };

  removePreview() {
    this.props.model.removePreview();
  }

  addPreview(map) {
    var scale = this.getScale(),
      paper = this.getPreviewPaperMeasures(),
      center = this.props.model.getPreviewFeature()
        ? getCenter(
            this.props.model
              .getPreviewFeature()
              .getGeometry()
              .getExtent()
          )
        : map.getView().getCenter();

    this.props.model.addPreview(scale, paper, center);

    var preScale = undefined;

    switch (scale) {
      case "250":
        preScale = 6;
        break;
      case "500":
        preScale = 6;
        break;
      case "1000":
        preScale = 5;
        break;
      case "2500":
        preScale = 4;
        break;
      case "5000":
        preScale = 3;
        break;
      case "10000":
        preScale = 2;
        break;
      case "25000":
        preScale = 1;
        break;
      case "50000":
        preScale = 1;
        break;
      case "100000":
        preScale = 0;
        break;
      case "250000":
        preScale = 0;
        break;
      default:
        preScale = map.getView().getZoom();
        break;
    }

    if (this.props.model.autoScale && preScale < map.getView().getZoom()) {
      map.getView().setZoom(preScale);
    }
  }

  exportPDF = e => {
    this.setState({
      url: false,
      loading: true
    });
    var options = {
      size: this.getPaperMeasures(),
      format: this.getFormat(),
      orientation: this.getOrientation(),
      scale: this.getScale(),
      resolution: this.getResolution()
    };

    this.props.model.exportPDF(options, pdfUrl => {
      let newState = {
        loading: false
      };

      // Set URL in state only if respons ends with ".pdf"
      if (pdfUrl.trimEnd().substr(-4) === ".pdf") {
        newState["url"] = pdfUrl;
      } else {
        this.props.enqueueSnackbar(
          "Utskriften kunde inte skapas. Prova med lägre upplösning, mindre område eller färre lager i kartan.",
          {
            variant: "error"
          }
        );
      }

      this.setState(newState);
    });
  };

  render() {
    const { classes } = this.props;

    var scales = this.props.model.scales;

    const scalesOptions = scales.map((s, i) => (
      <option key={i} value={s}>
        1:
        {s}
      </option>
    ));

    const resolutionOptions = this.resolutions.map((s, i) => {
      if (this.state.selectFormat === "A2") {
        return s !== 300 ? (
          <option key={i} value={s}>
            {s}
          </option>
        ) : (
          <option key={i} value={s} disabled>
            {s}
          </option>
        );
      } else {
        return (
          <option key={i} value={s}>
            {s}
          </option>
        );
      }
    });

    const paperFormatOptions = this.paperFormats.map((s, i) => {
      if (this.state.selectResolution === "300") {
        return s !== "A2" ? (
          <option key={i} value={s}>
            {s}
          </option>
        ) : (
          <option key={i} value={s} disabled>
            {s}
          </option>
        );
      } else {
        return (
          <option key={i} value={s}>
            {s}
          </option>
        );
      }
    });

    if (this.state.previewLayerVisible === true) {
      this.addPreview(this.props.model.map);
    } else {
      this.removePreview();
    }

    return (
      <>
        {this.state.loading && (
          <Paper className={classes.loader}>
            <LinearProgress />
          </Paper>
        )}
        <div className={classes.root}>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="paper-size-native-helper">
              Pappersstorlek
            </InputLabel>
            <NativeSelect
              onChange={this.setFormat}
              value={this.state.selectFormat}
              input={<Input name="format" id="paper-size-native-helper" />}
            >
              {paperFormatOptions}
            </NativeSelect>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="orientation-native-helper">
              Orientering
            </InputLabel>
            <NativeSelect
              onChange={this.setOrientation}
              value={this.state.selectOrientation}
              input={
                <Input name="orientation" id="orientation-native-helper" />
              }
            >
              <option value="P">stående</option>
              <option value="L">liggande</option>
            </NativeSelect>
          </FormControl>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="scale-native-helper">Skala</InputLabel>
            <NativeSelect
              onChange={this.setScale}
              value={this.state.selectScale}
              input={<Input name="scale" id="scale-native-helper" />}
            >
              {scalesOptions}
              <option key={"other"} value={"other"}>
                Annan skala
              </option>
            </NativeSelect>
          </FormControl>
          {this.state.selectScale === "other" && (
            <FormControl>
              <Input
                type="text"
                onChange={this.setManualScale}
                value={this.state.manualScale}
              />
            </FormControl>
          )}
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="resolution-native-helper">
              Upplösning
            </InputLabel>
            <NativeSelect
              value={this.state.selectResolution}
              onChange={this.setResolution}
              input={<Input name="resolution" id="resolution-native-helper" />}
            >
              {resolutionOptions}
            </NativeSelect>
          </FormControl>
        </div>
        <FormControl className={classes.formControl}>
          <Button
            variant="contained"
            color="primary"
            fullWidth={true}
            onClick={this.exportPDF}
          >
            <PictureAsPdf className={classes.icon} /> Skapa PDF
          </Button>
        </FormControl>
        {this.state.url && (
          <FormControl className={classes.formControl}>
            <Button
              variant="contained"
              fullWidth={true}
              target="_blank"
              href={this.state.url}
            >
              <ArrowDownward className={classes.icon} /> Ladda ner
            </Button>
          </FormControl>
        )}
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(ExportPdfSettings));

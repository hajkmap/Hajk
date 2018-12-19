import { getCenter } from "ol/extent.js";
import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import NativeSelect from "@material-ui/core/NativeSelect";
import Input from "@material-ui/core/Input";
import Button from "@material-ui/core/Button";

const styles = theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 120
  },
  selectEmpty: {
    marginTop: theme.spacing.unit * 2
  },
  loader: {
    opacity: 1,
    transition: "opacity 2s ease-in"
  }
});

class ExportPdfSettings extends Component {
  constructor(props) {
    super(props);
    this.resolutions = [72, 96, 150, 200, 300];
    this.paperFormats = ["A2", "A3", "A4"];
    this.state = {
      selectFormat: "A4",
      selectOrientation: "S",
      selectScale: "500",
      manualScale: "2500",
      selectResolution: "72",
      center: props.model.getPreviewFeature()
        ? props.model.getPreviewCenter()
        : props.model.map.getView().getCenter(),
      loading: false
    };
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
      ? this.state.manualScale
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
    this.setState({
      manualScale: e.target.value.startsWith("1:")
        ? e.target.value.split(":")[1]
        : e.target.value
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
      this.setState({
        loading: false,
        url: pdfUrl
      });
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

    if (this.props.model.displayPreview) {
      this.addPreview(this.props.model.map);
    } else {
      this.removePreview();
    }

    return (
      <>
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
              <option value="other">Annan skala</option>
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
          <FormControl className={classes.formControl}>
            <Button variant="outlined" onClick={this.exportPDF}>
              Skapa PDF
            </Button>
          </FormControl>
        </div>
        <div>
          {this.state.loading ? (
            <div className={classes.loader}>Skapar karta...</div>
          ) : null}
          {this.state.url ? (
            <a target="_blank" rel="noopener noreferrer" href={this.state.url}>
              Ladda hem
            </a>
          ) : null}
        </div>
      </>
    );
  }
}

export default withStyles(styles)(ExportPdfSettings);

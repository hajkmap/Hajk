import React from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";

import { Slider, Button, Badge, Grid, Tooltip } from "@material-ui/core";
import { Vector as VectorLayer } from "ol/layer";

import TimeSliderSettings from "./components/TimeSliderSettings.js";
import Dialog from "../../components/Dialog/Dialog";

import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import RotateLeftOutlinedIcon from "@material-ui/icons/RotateLeftOutlined";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";

const styles = (theme) => ({
  gridContainer: {
    padding: theme.spacing(2),
  },
  yearSlider: {
    paddingRight: theme.spacing(2),
    paddingLeft: theme.spacing(2),
  },
  monthSlider: {
    paddingRight: theme.spacing(4),
    paddingLeft: theme.spacing(4),
  },
  daySlider: {
    paddingRight: theme.spacing(6),
    paddingLeft: theme.spacing(6),
  },
});

class TimeSliderView extends React.PureComponent {
  static propTypes = {
    map: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      playing: false,
      resolution: this.props.defaultResolution ?? "years",
      stepSize: this.getStepSize(this.props.defaultResolution ?? "years"),
      loadingError: true,
      layerStatus: this.validateLayers(),
      settingsDialog: false,
      sliderSpeed: 1000,
    };

    this.map = props.map;
    this.layers = props.layers;
    this.startTime = this.getTime("timeSliderStart");
    this.endTime = this.getTime("timeSliderEnd");
    this.marks = this.getMarks(5); //Prop is number of marks no the slider
    this.markResolution = "";
    this.localObserver = props.localObserver;
    this.bindSubscriptions();
  }

  bindSubscriptions = () => {
    this.localObserver.subscribe("initiateTimeSliderView", () => {
      this.initiateTimeSliderView();
    });

    this.localObserver.subscribe("resetTimeSliderView", () => {
      this.resetTimeSliderView();
    });

    this.localObserver.subscribe("resetTimeSlider", () => {
      this.resetTimeSlider();
    });

    this.localObserver.subscribe("toggleSlider", (enabled) => {
      this.toggleSlider(enabled);
    });
  };

  validateLayers = () => {
    const { layers } = this.props;
    const layerStatus = {
      error: false,
      errorType: "",
      faultyLayers: [],
    };

    if (layers.length === 0) {
      layerStatus.error = true;
      layerStatus.errorType = "layers_missing";
    }

    layers.forEach((layer) => {
      if (!layer.get("timeSliderStart") || !layer.get("timeSliderEnd")) {
        layerStatus.error = true;
        layerStatus.errorType = "layer_error";
        layerStatus.faultyLayers.push({
          layerId: layer.get("name"),
          layerError: "date_missing",
        });
      }
      if (layer.get("timeSliderStart") === layer.get("timeSliderEnd")) {
        layerStatus.error = true;
        layerStatus.errorType = "layer_error";
        layerStatus.faultyLayers.push({
          layerId: layer.get("name"),
          layerError: "date_start_equals_end",
        });
      }
    });

    return layerStatus;
  };

  initiateTimeSliderView = () => {
    this.setState(
      {
        currentUnixTime: this.startTime,
      },
      () => {
        this.initiateTimeLineLayers();
        this.refreshLayers();
      }
    );
  };

  resetTimeSliderView = () => {
    this.resetTimeSlider();
    this.resetTimeLineLayers();
  };

  resetTimeSlider = () => {
    this.toggleSlider(false);

    this.localObserver.publish("updateHeaderTitle", "");
    this.setState(
      {
        currentUnixTime: this.startTime,
      },
      () => {
        this.refreshLayers();
      }
    );
  };

  initiateTimeLineLayers = () => {
    this.layers.forEach((layer) => {
      const source = layer.getSource();
      if (layer instanceof VectorLayer) {
        source.originalStyleFunction = layer.getStyleFunction();
        source.on("addfeature", this.handleFeatureAdded);
        layer.setStyle(null);
      } else {
        source.updateParams({
          TIME: new Date(this.state.currentUnixTime).toISOString(),
        });
      }
      layer.setVisible(true);
    });
  };

  resetTimeLineLayers = () => {
    this.layers.forEach((layer) => {
      const source = layer.getSource();
      if (layer instanceof VectorLayer) {
        source.un("addfeature", this.handleFeatureAdded);
        layer.setStyle(source.originalStyleFunction);
        layer.setVisible(false);
      } else {
        source.updateParams({
          TIME: undefined,
        });
        layer.setVisible(false);
      }
    });
  };

  handleFeatureAdded = (event) => {
    const source = event.target;
    const feature = event.feature;
    this.getTimeSliderLayerStyle(feature, source.originalStyleFunction);
  };

  refreshLayers = () => {
    this.layers.forEach((layer) => {
      if (layer instanceof VectorLayer) {
        layer.getSource().refresh();
      } else {
        layer.getSource().updateParams({
          TIME: new Date(this.startTime).toISOString(),
        });
      }
    });
  };

  getUnixTimeFromString = (str) => {
    const y = str.substr(0, 4),
      m = str.substr(4, 2),
      d = str.substr(6, 2);

    return new Date(`${y}-${m}-${d}`).getTime();
  };

  getTime = (type) => {
    let time = undefined;
    this.layers.forEach((layer) => {
      const layerTime = layer.get(type);
      if (layerTime) {
        let layerUnixTime = this.getUnixTimeFromString(layerTime);
        if (!time) time = layerUnixTime;

        if (type === "timeSliderStart" && time > layerUnixTime) {
          time = layerUnixTime;
        } else if (type === "timeSliderEnd" && time < layerUnixTime) {
          time = layerUnixTime;
        }
      }
    });
    return time;
  };

  shouldFeatureShow = (feature) => {
    const { currentUnixTime } = this.state;
    const featureStart = feature.get("start");
    const featureEnd = feature.get("end");

    if (!featureStart || !featureEnd) {
      return false;
    }
    let startDate = new Date(featureStart);
    let endDate = new Date(featureEnd);
    if (!startDate.getTime() > 0 || !endDate.getTime() > 0) {
      startDate = this.getUnixTimeFromString(featureStart);
      endDate = this.getUnixTimeFromString(featureEnd);
    }
    if (startDate <= currentUnixTime && endDate >= currentUnixTime) {
      return true;
    }
    return false;
  };

  getTimeSliderLayerStyle(feature, originalStyleFunction) {
    if (this.shouldFeatureShow(feature)) {
      feature.setStyle(originalStyleFunction);
    } else {
      feature.setStyle(null);
    }
  }

  toggleSlider = (enabled) => {
    this.setState({ playing: enabled });
    this.localObserver.publish("toggleHeaderPlayButton", enabled);
    if (enabled) {
      clearInterval(this.sliderTimer);
      this.sliderTimer = null;
      this.sliderTimer = setInterval(() => {
        let nextUnixTime = this.state.currentUnixTime + this.state.stepSize;
        if (nextUnixTime >= this.endTime) {
          nextUnixTime = this.endTime;
          clearInterval(this.sliderTimer);
          this.localObserver.publish("toggleHeaderPlayButton", false);
          this.setState({ playing: false });
        }
        this.handleSliderChange(nextUnixTime);
      }, this.state.sliderSpeed);
    } else {
      clearInterval(this.sliderTimer);
    }
  };

  getStepSize = (resolution) => {
    const day = 1000 * 60 * 60 * 24;
    switch (resolution) {
      case "years":
        return day * 365;
      case "months":
        return day * 31;
      default:
        return day;
    }
  };

  setNextDate = (nextUnixTime) => {
    const { currentUnixTime, resolution } = this.state;

    const currentDate = new Date(currentUnixTime);
    let nextDate = new Date(nextUnixTime);

    if (resolution === "years") {
      if (currentDate.getFullYear() === nextDate.getFullYear()) {
        currentUnixTime <= nextUnixTime
          ? nextDate.setFullYear(currentDate.getFullYear() + 1)
          : nextDate.setFullYear(currentDate.getFullYear() - 1);
      }
    } else if (resolution === "months") {
      if (currentDate.getMonth() === nextDate.getMonth()) {
        currentUnixTime <= nextUnixTime
          ? nextDate.setMonth(currentDate.getMonth() + 1)
          : nextDate.setMonth(currentDate.getMonth() - 1);
      }
    } else {
      if (currentDate.getDay() === nextDate.getDay()) {
        currentUnixTime <= nextUnixTime
          ? nextDate.setDate(currentDate.getDate() + 1)
          : nextDate.setDate(currentDate.getDate() - 1);
      }
    }
    return nextDate;
  };

  handleSliderChange = (nextUnixTime) => {
    const nextDate = this.setNextDate(nextUnixTime);
    this.setState({ currentUnixTime: nextDate.getTime() }, () => {
      this.updateLayers();
      this.updateHeader();
    });
  };

  updateHeader = () => {
    const { currentUnixTime, resolution } = this.state;
    this.localObserver.publish(
      "updateHeaderTitle",
      this.getDateLabel(currentUnixTime, resolution)
    );
  };

  getDateLabel = (unixTime, resolution) => {
    let options = {};
    const date = new Date(unixTime);

    switch (resolution) {
      case "years":
        options = { year: "numeric" };
        break;
      case "months":
        options = { month: "long", year: "numeric" };
        break;
      default:
        options = { day: "numeric", month: "long", year: "numeric" };
        break;
    }

    return date.toLocaleString("default", options);
  };

  getShortDateLabel = (unixTime, resolution) => {
    let options = {};
    const date = new Date(unixTime);

    switch (resolution) {
      case "years":
        options = { year: "numeric" };
        break;
      case "months":
        options = { month: "short", year: "numeric" };
        break;
      default:
        options = { day: "numeric", month: "short" };
        break;
    }

    return date.toLocaleString("default", options);
  };

  updateLayers = () => {
    const extent = this.map.getView().calculateExtent();
    this.layers.map((layer) => {
      const source = layer.getSource();
      if (layer instanceof VectorLayer) {
        return source.forEachFeatureInExtent(extent, (feature) => {
          this.getTimeSliderLayerStyle(feature, source.originalStyleFunction);
        });
      } else {
        return source.updateParams({
          TIME: new Date(this.state.currentUnixTime).toISOString(),
        });
      }
    });
  };

  createMarks = (totalTime, markResolution, numMarks) => {
    let marks = [];
    const stepSize = Math.floor(totalTime / (numMarks - 1)); //-1 since we want to include endDate

    for (let i = 0; i < numMarks; i++) {
      const markTime = this.startTime + stepSize * i;
      marks.push({
        value: markTime,
        label: this.getShortDateLabel(markTime, markResolution),
      });
    }

    return marks;
  };

  getMarks = (numMarks) => {
    const totalTime = this.endTime - this.startTime;
    const unixMsPerMonth = 2592000000;
    const numMonths = Math.floor(totalTime / unixMsPerMonth);

    if (numMonths >= numMarks * 12) {
      this.markResolution = "years";
    } else if (numMonths >= numMarks) {
      this.markResolution = "months";
    } else {
      this.markResolution = "days";
    }

    return this.createMarks(totalTime, this.markResolution, numMarks);
  };

  handleResolutionChange = (value) => {
    this.setState({ resolution: value, stepSize: this.getStepSize(value) });
  };

  handleSliderSpeedChange = (value) => {
    this.setState({ sliderSpeed: value }, () => {
      this.toggleSlider(this.state.playing);
    });
  };

  renderSettingsDialog = () => {
    const { settingsDialog, resolution, sliderSpeed, layerStatus } = this.state;
    if (settingsDialog) {
      return createPortal(
        <Dialog
          options={{
            text: (
              <TimeSliderSettings
                layers={this.layers}
                layerStatus={layerStatus}
                resolution={resolution}
                sliderSpeed={sliderSpeed}
                handleResolutionChange={this.handleResolutionChange}
                handleSliderSpeedChange={this.handleSliderSpeedChange}
              />
            ),
            headerText: "Tidslinjeinställningar",
            buttonText: "OK",
            useLegacyNonMarkdownRenderer: true,
          }}
          open={settingsDialog}
          onClose={() => {
            this.setState({
              settingsDialog: false,
            });
          }}
        ></Dialog>,
        document.getElementById("windows-container")
      );
    } else {
      return null;
    }
  };

  renderSettingsButton = () => {
    const { layerStatus } = this.state;
    return (
      <Badge
        color="error"
        invisible={!layerStatus.error}
        badgeContent={`${
          layerStatus.faultyLayers.length > 0
            ? layerStatus.faultyLayers.length
            : 1
        }`}
      >
        <Button
          variant="outlined"
          onClick={() => {
            this.setState({ settingsDialog: !this.state.settingsDialog });
          }}
        >
          <SettingsOutlinedIcon />
        </Button>
      </Badge>
    );
  };

  render() {
    const { currentUnixTime, stepSize, playing } = this.state;
    const { classes } = this.props;

    if (currentUnixTime) {
      return (
        <Grid container className={classes.gridContainer}>
          <>{this.renderSettingsDialog()}</>
          <Grid
            item
            xs={12}
            className={
              this.markResolution === "years"
                ? classes.yearSlider
                : this.markResolution === "months"
                ? classes.monthSlider
                : classes.daySlider
            }
          >
            <Slider
              value={currentUnixTime}
              min={this.startTime}
              max={this.endTime}
              step={stepSize}
              marks={this.marks}
              onChange={(e, value) => {
                if (value !== currentUnixTime) {
                  this.handleSliderChange(value);
                }
              }}
            />
          </Grid>
          <Grid
            container
            direction="row"
            justify="center"
            alignItems="center"
            spacing={2}
          >
            <Grid item align="center" xs={4}>
              <Tooltip
                title={playing ? "Stoppa tidslinjen" : "Starta tidslinjen"}
              >
                <Button
                  variant="outlined"
                  onClick={() => {
                    this.toggleSlider(!playing);
                  }}
                >
                  {playing ? <PauseIcon /> : <PlayArrowIcon />}
                </Button>
              </Tooltip>
            </Grid>
            <Grid item align="center" xs={4}>
              <Tooltip title="Återställ tidslinjen">
                <Button variant="outlined" onClick={this.resetTimeSlider}>
                  <RotateLeftOutlinedIcon />
                </Button>
              </Tooltip>
            </Grid>
            <Grid item align="center" xs={4}>
              <Tooltip title="Inställningar">
                {this.renderSettingsButton()}
              </Tooltip>
            </Grid>
          </Grid>
        </Grid>
      );
    } else {
      return (
        <Grid
          container
          alignItems="center"
          justify="center"
          style={{ width: "100%", height: "100%" }}
        >
          <>{this.renderSettingsDialog()}</>
          <Grid item>{this.renderSettingsButton()}</Grid>
        </Grid>
      );
    }
  }
}

export default withStyles(styles)(TimeSliderView);

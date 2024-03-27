import React from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Vector as VectorLayer } from "ol/layer";

import Dialog from "../../components/Dialog/Dialog";

import TimeSliderSettings from "./components/TimeSliderSettings.js";
import PlayerView from "./PlayerView.js";
import PrintView from "./PrintView.js";

class TimeSliderView extends React.PureComponent {
  static propTypes = {
    map: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      playing: false,
      resolution: this.props.defaultResolution || "years",
      stepSize: this.getStepSize(this.props.defaultResolution || "years"),
      loadingError: true,
      layerStatus: this.validateLayers(),
      settingsDialog: false,
      sliderSpeed: 1000,
      unixTimeBeforePrint: null,
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

  componentDidMount() {
    if (this.props.visibleAtStart === true) {
      this.initiateTimeSliderView();
    }
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
      case "quarters":
        return day * 92; // Approx 92 days...
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
    } else if (resolution === "quarters") {
      // We always want the month to land on a "quarter month"...
      // (Jan, April, July, October)
      const quarterMonths = [0, 3, 6, 9];
      if (!quarterMonths.includes(nextDate.getMonth())) {
        const closestQuarterMonth = quarterMonths.reduce((prev, curr) =>
          Math.abs(curr - nextDate.getMonth()) <
          Math.abs(prev - nextDate.getMonth())
            ? curr
            : prev
        );
        nextDate.setMonth(closestQuarterMonth);
        // We also want to start on the first of the month each time...
        nextDate.setDate(1);
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
      case "quarters":
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

  setSettingsDialog = (sd) => {
    this.setState({ settingsDialog: sd });
  };

  setUnixTimeBeforePrint = (unixTime) => {
    this.setState({ unixTimeBeforePrint: unixTime });
  };

  // Updates the slider and renders the layers at the supplied time
  updateSliderAndRenderLayersAtTime = (unixTime) => {
    // We want to make sure not to resolve before the layers has rendered - otherwise we might
    // get strange side-effects if the caller thinks that the map is ready right away...
    return new Promise((resolve) => {
      // If the supplied time is already set, we can resolve right away...
      if (this.state.currentUnixTime === unixTime) {
        resolve();
      }
      // Let's bind a listener that fires when the rendering is completed...
      this.map.once("rendercomplete", () => {
        // ... and resolve when that happens.
        resolve();
      });
      // Update the slider time and refresh the layers
      this.setState({ currentUnixTime: unixTime }, () => {
        this.updateLayers();
      });
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

  render() {
    const {
      currentUnixTime,
      stepSize,
      playing,
      settingsDialog,
      layerStatus,
      resolution,
    } = this.state;
    const { printActive, printModel } = this.props;

    return printActive ? (
      <PrintView
        startTime={this.startTime}
        endTime={this.endTime}
        marks={this.marks}
        resolution={resolution}
        stepSize={stepSize}
        printModel={printModel}
        getStepSize={this.getStepSize}
        getDateLabel={this.getDateLabel}
        windowHidden={this.props.windowHidden}
        setUnixTimeBeforePrint={this.setUnixTimeBeforePrint}
        updateSliderAndRenderLayersAtTime={
          this.updateSliderAndRenderLayersAtTime
        }
      />
    ) : (
      <>
        <PlayerView
          currentUnixTime={currentUnixTime}
          layerStatus={layerStatus}
          stepSize={stepSize}
          playing={playing}
          marks={this.marks}
          startTime={this.startTime}
          endTime={this.endTime}
          settingsDialog={settingsDialog}
          setSettingsDialog={this.setSettingsDialog}
          markResolution={this.markResolution}
          handleSliderChange={this.handleSliderChange}
          resetTimeSlider={this.resetTimeSlider}
          toggleSlider={this.toggleSlider}
        />
        {this.renderSettingsDialog()}
      </>
    );
  }
}

export default TimeSliderView;

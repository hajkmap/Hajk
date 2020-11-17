import React from "react";
import PropTypes from "prop-types";
import Grid from "@material-ui/core/Grid";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Slider from "@material-ui/core/Slider";

const styles = (theme) => ({
  gridContainer: {
    padding: theme.spacing(2),
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
      resolution: this.props.resolution ?? "years",
      stepSize: this.getStepSize(this.props.resolution ?? "years"),
    };

    this.map = props.map;
    this.layers = props.layers;
    this.startTime = this.getTime("startDate");
    this.endTime = this.getTime("endDate");
    this.localObserver = props.localObserver;
    this.bindSubscriptions();
  }

  bindSubscriptions = () => {
    this.localObserver.subscribe("initiateTimeLine", () => {
      this.initiateTimeLine();
    });

    this.localObserver.subscribe("hideTimeLineLayers", (layers) => {
      this.toggleLayers(layers, false);
    });

    this.localObserver.subscribe("toggleTimeSlider", (enabled) => {
      this.toggleTimeSlider(enabled);
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
      let layerTime = this.getUnixTimeFromString(layer.get(type));
      if (!time) time = layerTime;

      if (type === "startDate" && time > layerTime) {
        time = layerTime;
      } else if (type === "endDate" && time < layerTime) {
        time = layerTime;
      }
    });
    return time;
  };

  handleFeatureAdded = (event) => {
    const source = event.target;
    const feature = event.feature;
    this.getTimeSliderLayerStyle(feature, source.originalStyleFunction);
  };

  getTimeSliderLayerStyle(feature, originalStyleFunction) {
    const { currentUnixTime } = this.state;
    if (
      this.getUnixTimeFromString(feature.get("start")) <= currentUnixTime &&
      this.getUnixTimeFromString(feature.get("end")) >= currentUnixTime
    ) {
      feature.setStyle(originalStyleFunction);
    } else {
      feature.setStyle(null);
    }
  }

  initiateTimeLine = () => {
    this.setState(
      {
        currentUnixTime: this.startTime,
      },
      () => {
        this.initiateTimeLineLayers();
      }
    );
  };

  initiateTimeLineLayers = () => {
    this.layers.forEach((layer) => {
      const source = layer.getSource();
      source.originalStyleFunction = layer.getStyleFunction();
      source.on("addfeature", this.handleFeatureAdded);
      layer.setStyle(null);
      layer.setVisible(true);
    });
  };

  toggleTimeSlider = (enabled) => {
    const { currentUnixTime, stepSize } = this.state;
    if (enabled) {
      this.sliderTimer = setInterval(() => {
        let nextUnixTime = currentUnixTime + stepSize;
        if (nextUnixTime >= this.endTime) {
          nextUnixTime = this.endTime;
          clearInterval(this.sliderTimer);
          this.props.updateCustomProp("playing", false);
        }
        this.handleSliderChange(nextUnixTime);
      }, 500);
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
    const currentDate = new Date(currentUnixTime);
    let options = {};

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
    this.props.updateCustomProp(
      "title",
      `Tidslinje - ${currentDate.toLocaleString("default", options)}`
    );
  };

  updateLayers = () => {
    const extent = this.map.getView().calculateExtent();
    this.layers.map((layer) => {
      const source = layer.getSource();
      return source.forEachFeatureInExtent(extent, (feature) => {
        this.getTimeSliderLayerStyle(feature, source.originalStyleFunction);
      });
    });
  };

  render() {
    const { currentUnixTime, stepSize } = this.state;
    const { classes } = this.props;
    if (currentUnixTime) {
      return (
        <Grid container className={classes.gridContainer}>
          <Grid item xs={12}>
            <Grid item xs={3}></Grid>
            <Grid item xs={3}></Grid>
            <Grid item xs={3}></Grid>
            <Grid item xs={3}></Grid>
          </Grid>
          <Grid item xs={12}>
            <Slider
              value={currentUnixTime}
              min={this.startTime}
              max={this.endTime}
              step={stepSize}
              onChange={(e, value) => {
                if (value !== currentUnixTime) {
                  this.handleSliderChange(value);
                }
              }}
            />
          </Grid>
        </Grid>
      );
    } else {
      return null;
    }
  }
}

export default withStyles(styles)(withSnackbar(TimeSliderView));

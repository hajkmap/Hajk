import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { Style, Stroke, Fill, Circle } from "ol/style";
import { withSnackbar } from "notistack";
import Slider from "@material-ui/core/Slider";

const styles = (theme) => ({});

class TimeSliderView extends React.PureComponent {
  state = {
    currentUnixTime: undefined,
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
    this.startDate = this.props.options.startDate
      ? this.getUnixTimeFromString(this.props.options.startDate)
      : this.getUnixTimeFromString("20200101");
    this.endDate = this.props.options.startDate
      ? this.getUnixTimeFromString(this.props.options.endDate)
      : this.getUnixTimeFromString("20450101");
    this.resolution = this.props.options.resolution ?? "years";
    this.stepSize = this.getStepSize();
    this.sliderTimer = null;
    this.layerInformation = [];

    this.localObserver.subscribe("showTimeLineLayers", (layers) => {
      this.toggleLayers(layers, true);
    });

    this.localObserver.subscribe("hideTimeLineLayers", (layers) => {
      this.toggleLayers(layers, false);
    });

    this.localObserver.subscribe("toggleTimeSlider", (enabled) => {
      this.toggleTimeSlider(enabled);
    });
  }

  toggleTimeSlider = (enabled) => {
    if (enabled) {
      this.sliderTimer = setInterval(() => {
        let nextDate = this.state.currentUnixTime
          ? this.state.currentUnixTime + this.stepSize
          : this.startDate + this.stepSize;
        if (nextDate > this.endDate) {
          nextDate = this.endDate;
          clearInterval(this.sliderTimer);
          this.props.updateCustomProp("playing", false);
        }
        this.handleSliderChange(nextDate);
      }, 1000);
    } else {
      clearInterval(this.sliderTimer);
    }
  };

  getStepSize = () => {
    switch (this.resolution) {
      case "years":
        return 1000 * 60 * 60 * 24 * 365;
      case "months":
        return 1000 * 60 * 60 * 24 * 30;
      default:
        return 1000 * 60 * 60 * 24;
    }
  };

  getHiddenStyle() {
    return [
      new Style({
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0)",
          width: 0,
        }),
        fill: new Fill({
          color: "rgba(1, 2, 3, 0)",
        }),
        image: new Circle({
          fill: new Fill({
            color: "rgba(0, 0, 0, 0)",
          }),
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0)",
            width: 0,
          }),
          radius: 0,
        }),
      }),
    ];
  }

  toggleLayers = (layers, visible) => {
    this.props.app.map
      .getLayers()
      .getArray()
      .filter((layer) => {
        return layers.indexOf(layer.values_.name) > -1;
      })
      .forEach((layer) => {
        this.layerInformation.push({
          id: layer.values_.name,
          layer: layer,
          styleFunction: layer.getStyleFunction(),
        });
        layer.setStyle(this.getHiddenStyle());
        this.globalObserver.publish(
          `layerswitcher.${visible ? "show" : "hide"}Layer`,
          layer
        );
        layer.setVisible(visible);
      });
  };

  getUnixTimeFromString = (str) => {
    const y = str.substr(0, 4),
      m = str.substr(4, 2),
      d = str.substr(6, 2);

    return new Date(`${y}-${m}-${d}`).getTime();
  };

  getStringFromUnixTime = (date) => {
    return new Date(date).toISOString().slice(0, 10).replace(/-/g, "");
  };

  setNextDate = (nextUnixTime) => {
    const { currentUnixTime } = this.state;

    const currentDate = new Date(currentUnixTime);
    let nextDate = new Date(nextUnixTime);

    if (this.resolution === "years") {
      if (currentDate.getFullYear() === nextDate.getFullYear()) {
        currentUnixTime < nextUnixTime
          ? nextDate.setFullYear(currentDate.getFullYear() + 1)
          : nextDate.setFullYear(currentDate.getFullYear() - 1);
      }
    } else if (this.resolution === "months") {
      if (currentDate.getMonth() === nextDate.getMonth()) {
        currentUnixTime < nextUnixTime
          ? nextDate.setMonth(currentDate.getMonth() + 1)
          : nextDate.setMonth(currentDate.getMonth() - 1);
      }
    } else {
      if (currentDate.getDay() === nextDate.getDay()) {
        currentUnixTime < nextUnixTime
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
    const currentDate = new Date(this.state.currentUnixTime);
    let options = {};

    switch (this.resolution) {
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
      `Timeslider - ${currentDate.toLocaleString("default", options)}`
    );
  };

  updateLayers = () => {
    const { currentUnixTime } = this.state;

    //This is not going to work. Need to check how many features in extent and warn the user if there are too many.
    this.layerInformation.map((layerInfo) => {
      return layerInfo.layer.getSource().forEachFeature((feature) => {
        if (
          this.getUnixTimeFromString(feature.getProperties().start) <=
            currentUnixTime &&
          this.getUnixTimeFromString(feature.getProperties().end) >=
            currentUnixTime
        ) {
          feature.setStyle(layerInfo.styleFunction);
        } else {
          feature.setStyle(this.getHiddenStyle());
        }
      });
    });
  };

  render() {
    const { currentUnixTime } = this.state;
    return (
      <>
        <Slider
          value={currentUnixTime ? currentUnixTime : this.startDate}
          min={this.startDate}
          step={this.stepSize}
          max={this.endDate}
          onChangeCommitted={(e, value) => {
            if (value !== currentUnixTime) {
              this.handleSliderChange(value);
            }
          }}
        />
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(TimeSliderView));

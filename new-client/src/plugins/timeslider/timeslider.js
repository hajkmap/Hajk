import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";

import TimeSliderModel from "./TimeSliderModel";
import TimeSliderView from "./TimeSliderView";
import Observer from "react-event-observer";

import UpdateIcon from "@material-ui/icons/Update";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";

class TimeSlider extends React.PureComponent {
  state = {
    title: "Tidslinje",
    color: null,
    playing: false,
  };

  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired,
  };

  static defaultProps = {
    options: {},
  };

  constructor(props) {
    super(props);

    this.localObserver = Observer();
    this.layers = this.getLayers(props.options.layers);

    this.TimeSliderModel = new TimeSliderModel({
      localObserver: this.localObserver,
      app: props.app,
      map: props.map,
    });
  }

  getLayers = (layerIds) => {
    return this.props.map
      .getLayers()
      .getArray()
      .filter((layer) => {
        return layerIds.indexOf(layer.values_.name) > -1;
      });
  };

  getStringFromUnixTime = (date) => {
    return new Date(date).toISOString().slice(0, 10).replace(/-/g, "");
  };

  onWindowShow = () => {
    this.localObserver.publish("initiateTimeSliderView");
  };

  onWindowHide = () => {
    this.setState({ playing: false, title: "Tidslinje" });
    this.localObserver.publish("resetTimeSliderView");
  };

  updateCustomProp = (prop, value) => {
    this.setState({ [prop]: value });
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props} // Pass on all props
        type="TimeSlider" // Unique name - each plugin needs one. Upper-case first letter, must be valid JS variable name
        custom={{
          icon: <UpdateIcon />, // Custom icon for this plugin
          title: this.state.title, // By keeping title and color in TimeSlider's state we can pass on
          color: this.state.color, // the changes to BaseWindowPlugin which will update internal state too.
          description: "En kort beskrivning som visas i widgeten", // Shown on Widget button
          customPanelHeaderButtons: [
            {
              //Add extra buttons to window-header with a specified onClickCallback
              icon: !this.state.playing ? <PlayArrowIcon /> : <PauseIcon />,
              onClickCallback: () => {
                this.setState(
                  {
                    playing: !this.state.playing,
                  },
                  () => {
                    this.localObserver.publish(
                      "toggleSlider",
                      this.state.playing
                    );
                  }
                );
              },
            },
          ],
          height: 100, // Custom height/width etc | Use "auto" for automatic or leave undefined
          width: 700,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide,
        }}
      >
        {/* This is the child object of BaseWindowPlugin. It will be displayed
            as content inside the plugin's window. */}
        <TimeSliderView
          map={this.props.map}
          localObserver={this.localObserver} // And also the Observer, so that those 2 can talk through it
          updateCustomProp={this.updateCustomProp}
          layers={this.layers}
          resolution={this.props.options.resolution}
          playing={this.state.playing}
        />
      </BaseWindowPlugin>
    );
  }
}

// Part of API. Make a HOC of our plugin.
export default TimeSlider;

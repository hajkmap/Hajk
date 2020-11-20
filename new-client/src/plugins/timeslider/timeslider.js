import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";

import TimeSliderView from "./TimeSliderView";
import Observer from "react-event-observer";

import UpdateIcon from "@material-ui/icons/Update";
import RotateLeftOutlinedIcon from "@material-ui/icons/RotateLeftOutlined";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";

class TimeSlider extends React.PureComponent {
  state = {
    title: this.props.options.title ?? "Tidslinje",
    color: null,
    playing: false,
  };

  static propTypes = {
    map: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.localObserver = Observer();
    this.layers = this.getLayers(props.options.layers);
    this.resolution = props.options.resolution ?? "years";
    this.originalTitle = this.props.options.title ?? "Tidslinje";
    this.bindSubscriptions();
  }

  bindSubscriptions = () => {
    this.localObserver.subscribe("toggleHeaderPlayButton", (playing) => {
      this.setState({ playing: playing });
    });

    this.localObserver.subscribe("updateHeaderTitle", (text) => {
      this.setState({ title: `${this.originalTitle} ${text}` });
    });
  };

  onWindowShow = () => {
    this.localObserver.publish("initiateTimeSliderView");
  };

  onWindowHide = () => {
    this.localObserver.publish("resetTimeSliderView");
  };

  getLayers = (layerIds) => {
    return this.props.map
      .getLayers()
      .getArray()
      .filter((layer) => {
        return layerIds?.indexOf(layer.values_.name) > -1;
      });
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
          description: "Visa information under olika tidsperioder", // Shown on Widget button
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
            {
              //Add extra buttons to window-header with a specified onClickCallback
              icon: <RotateLeftOutlinedIcon />,
              onClickCallback: () => {
                this.localObserver.publish("resetTimeSlider");
              },
            },
          ],
          height: 100, // Custom height/width etc | Use "auto" for automatic or leave undefined
          width: 600,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide,
        }}
      >
        <TimeSliderView
          map={this.props.map}
          localObserver={this.localObserver}
          layers={this.layers} //The layers to be used
          resolution={this.resolution} //"years", "months", or "days"
        />
      </BaseWindowPlugin>
    );
  }
}

export default TimeSlider;

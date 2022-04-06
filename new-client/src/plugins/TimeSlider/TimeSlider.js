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
    this.defaultResolution = props.options.defaultResolution ?? "years";
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
        {...this.props}
        type="TimeSlider"
        custom={{
          icon: <UpdateIcon />,
          title: this.state.title,
          color: this.state.color,
          description: "Visa information under olika tidsperioder", // Shown on Widget button
          customPanelHeaderButtons: [
            {
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
              icon: <RotateLeftOutlinedIcon />,
              onClickCallback: () => {
                this.localObserver.publish("resetTimeSlider");
              },
            },
          ],
          height: 200,
          width: 650,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide,
        }}
      >
        <TimeSliderView
          map={this.props.map}
          localObserver={this.localObserver}
          layers={this.layers} //The layers to be used
          defaultResolution={this.defaultResolution} //"years", "months", or "days"
        />
      </BaseWindowPlugin>
    );
  }
}

export default TimeSlider;

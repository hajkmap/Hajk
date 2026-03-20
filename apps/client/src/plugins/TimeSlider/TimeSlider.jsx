import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";

import TimeSliderView from "./TimeSliderView";
import Observer from "react-event-observer";

import UpdateIcon from "@mui/icons-material/Update";
import RotateLeftOutlinedIcon from "@mui/icons-material/RotateLeftOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import PrintIcon from "@mui/icons-material/Print";
import PrintModel from "plugins/Print/PrintModel";

import { DEFAULT_PRINT_OPTIONS } from "./constants";

class TimeSlider extends React.PureComponent {
  state = {
    title: this.props.options.title || "Tidslinje",
    windowHidden: false,
    color: null,
    playing: false,
    printActive: false,
  };

  static propTypes = {
    map: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.localObserver = Observer();
    this.layers = this.getLayers(props.options.layers);
    this.defaultResolution = props.options.defaultResolution || "years";
    this.originalTitle = this.props.options.title || "Tidslinje";
    this.bindSubscriptions();

    // Since we want to allow the user to print the time series, we need to initiate a print model!
    this.printModel = new PrintModel({
      localObserver: this.localObserver,
      map: props.map,
      options: DEFAULT_PRINT_OPTIONS,
      mapConfig: props.app.config.mapConfig.map,
    });
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
    this.setState({ windowHidden: false });
    this.localObserver.publish("initiateTimeSliderView");
  };

  onWindowHide = () => {
    this.setState({ windowHidden: true });
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
              icon: <PrintIcon />,
              onClickCallback: () => {
                this.setState({ printActive: !this.state.printActive });
              },
            },
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
          height: "dynamic",
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
          visibleAtStart={this.props.options.visibleAtStart}
          windowHidden={this.state.windowHidden}
          printActive={this.state.printActive}
          printModel={this.printModel}
        />
      </BaseWindowPlugin>
    );
  }
}

export default TimeSlider;

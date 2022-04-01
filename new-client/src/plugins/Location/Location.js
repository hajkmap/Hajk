import React from "react";
import { createPortal } from "react-dom";
import Observer from "react-event-observer";
import MyLocationIcon from "@mui/icons-material/MyLocation";

import BaseWindowPlugin from "../BaseWindowPlugin";
import LocationModel from "./LocationModel";
import LocationView from "./LocationView";
import CustomControlButtonView from "./CustomControlButtonView";

class Location extends React.PureComponent {
  constructor(props) {
    super(props);
    this.localObserver = Observer();
    this.model = new LocationModel({
      ...this.props,
      localObserver: this.localObserver,
    });
  }

  // This custom renderer (used for Control button) will bypass
  // the usual stuff that renders in BaseWindowPlugin, while still
  // being an instance of it.
  // The reason we do this is that none of the available rendering
  // modes from BaseWindowPlugin satisfy our needs. We don't want
  // a Drawer button, neither a Widget nor Control button. Instead
  // we need a special Toggle Button that can be either on or off,
  // and that will render next to the "normal" control buttons.
  renderControlButton() {
    return createPortal(
      <CustomControlButtonView
        title="Positionera"
        abstract="Visa min position i kartan"
        model={this.model}
      />,
      document.getElementById("plugin-control-buttons")
    );
  }

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="Location"
        custom={{
          icon: <MyLocationIcon />,
          title: "Positionera",
          description: "Visa min position i kartan",
          height: 450,
          width: 430,
          top: undefined,
          left: undefined,
          model: this.model,
          // Supply a custom renderer *if* admin wants to render this plugin
          // as a Control button
          render:
            this.props.options.target === "control"
              ? this.renderControlButton
              : null,
        }}
      >
        <LocationView map={this.props.map} model={this.model} />
      </BaseWindowPlugin>
    );
  }
}

export default Location;

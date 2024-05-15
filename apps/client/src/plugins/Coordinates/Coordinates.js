import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import ExploreIcon from "@mui/icons-material/Explore";

import CoordinatesView from "./CoordinatesView.js";
import CoordinatesModel from "./CoordinatesModel.js";
import Observer from "react-event-observer";

class Coordinates extends React.PureComponent {
  constructor(props) {
    super(props);

    this.localObserver = Observer();

    this.coordinatesModel = new CoordinatesModel({
      map: props.map,
      app: props.app,
      options: props.options,
      localObserver: this.localObserver,
    });
  }

  onWindowShow = () => {
    this.coordinatesModel.activate();
  };

  onWindowHide = () => {
    this.coordinatesModel.deactivate();
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="Coordinates"
        custom={{
          icon: <ExploreIcon />,
          title: "Visa koordinat",
          description: "Visa koordinater för given plats",
          height: "dynamic",
          width: 400,
          disablePadding: true,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide,
        }}
      >
        <CoordinatesView
          model={this.coordinatesModel}
          localObserver={this.localObserver}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Coordinates;

import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import ExploreIcon from "@material-ui/icons/Explore";

import CoordinatesView from "./CoordinatesView.js";
import CoordinatesModel from "./CoordinatesModel.js";
import Observer from "react-event-observer";

class Coordinates extends React.PureComponent {
  constructor(props) {
    super(props);

    this.localObserver = Observer();
    // this.localObserver.subscribe("layerAdded", layer => {});

    this.coordinatesModel = new CoordinatesModel({
      map: props.map,
      app: props.app,
      observer: this.localObserver
    });
  }

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        custom={{
          icon: <ExploreIcon />,
          title: "Visa koordinat",
          description: "Visa koordinater för given plats",
          height: 300,
          width: 400,
          top: undefined,
          left: undefined,
          onWindowShow: this.coordinatesModel.activate,
          onWindowHide: this.coordinatesModel.deactivate
        }}
      >
        <CoordinatesView
          app={this.props.app}
          map={this.props.map}
          model={this.coordinatesModel}
          observer={this.localObserver}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Coordinates;

import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import ExploreIcon from "@material-ui/icons/Explore";

import CoordinatesView from "./CoordinatesView.js";
import CoordinatesModel from "./CoordinatesModel.js";
import Observer from "react-event-observer";

class Coordinates extends React.PureComponent {
  state = {
    coordinate: ""
  };

  constructor(props) {
    super(props);

    this.localObserver = Observer();
    // this.localObserver.subscribe("layerAdded", layer => {});
    this.localObserver.subscribe("setCoordinates", coordinates => {
      this.setState({
        coordinates: coordinates
      });
    });

    this.coordinatesModel = new CoordinatesModel({
      map: props.map,
      app: props.app,
      options: props.options,
      localObserver: this.localObserver
    });
  }

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type={this.constructor.name}
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
          options={this.props.options}
          model={this.coordinatesModel}
          localObserver={this.localObserver}
          coordinates={this.state.coordinates}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Coordinates;

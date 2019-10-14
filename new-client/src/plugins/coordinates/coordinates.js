import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import ExploreIcon from "@material-ui/icons/Explore";

import CoordinatesView from "./CoordinatesView.js";
import CoordinatesModel from "./CoordinatesModel.js";
import Observer from "react-event-observer";

class Coordinates extends React.PureComponent {
  state = {
    coordinates: null,
    transformedCoordinates: {}
  };

  constructor(props) {
    super(props);

    this.localObserver = Observer();
    this.localObserver.subscribe("setCoordinates", coordinates => {
      this.setState({
        coordinates: coordinates
      });
    });

    this.localObserver.subscribe(
      "setTransformedCoordinates",
      transformedCoordinates => {
        this.setState({
          transformedCoordinates: transformedCoordinates
        });
      }
    );

    this.coordinatesModel = new CoordinatesModel({
      map: props.map,
      app: props.app,
      options: props.options,
      localObserver: this.localObserver
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
          height: 300,
          width: 400,
          top: undefined,
          left: undefined,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide
        }}
      >
        <CoordinatesView
          app={this.props.app}
          map={this.props.map}
          options={this.props.options}
          model={this.coordinatesModel}
          localObserver={this.localObserver}
          coordinates={this.state.coordinates}
          transformedCoordinates={this.state.transformedCoordinates}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Coordinates;

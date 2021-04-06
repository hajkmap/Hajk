import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import MyLocationIcon from "@material-ui/icons/MyLocation";

import LocationView from "./LocationView";

class Location extends React.PureComponent {
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
        }}
      >
        <LocationView map={this.props.map} />
      </BaseWindowPlugin>
    );
  }
}

export default Location;

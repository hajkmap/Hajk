import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import NavigationIcon from "@material-ui/icons/Navigation";

import LocationView from "./LocationView";

class Location extends React.PureComponent {
  constructor(props) {
    super(props);
    this.type = "location";
  }

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        custom={{
          icon: <NavigationIcon />,
          title: "Positionera",
          description: "Visa min position i kartan",
          height: "300px",
          width: "430px",
          top: undefined,
          left: undefined
        }}
      >
        <LocationView map={this.props.map} />
      </BaseWindowPlugin>
    );
  }
}

export default Location;

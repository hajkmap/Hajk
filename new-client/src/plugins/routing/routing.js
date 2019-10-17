import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";
import DirectionsIcon from "@material-ui/icons/Directions";
import RoutingModel from "./RoutingModel";
import RoutingView from "./RoutingView";
import Observer from "react-event-observer";

class Routing extends React.PureComponent {
  constructor(props) {
    super(props);

    this.localObserver = Observer();

    this.routingModel = new RoutingModel({
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
        type="Routing"
        custom={{
          icon: <DirectionsIcon />,
          title: "Navigation",
          description: "Hitta rätt väg till din destination",
          height: "auto",
          width: 400
        }}
      >
        <RoutingView
          model={this.routingModel}
          app={this.props.app}
          localObserver={this.localObserver}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Routing;

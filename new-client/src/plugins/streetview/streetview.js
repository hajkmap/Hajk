import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import StreetviewIcon from "@material-ui/icons/Streetview";

import StreetViewView from "./StreetViewView";
import StreetViewModel from "./StreetViewModel";
import Observer from "react-event-observer";

class StreetView extends React.PureComponent {
  state = {
    displayPanorama: false
  };

  constructor(props) {
    super(props);

    this.localObserver = Observer();
    this.localObserver.subscribe("locationChanged", () => {
      this.setState({
        displayPanorama: true
      });
    });

    this.streetViewModel = new StreetViewModel({
      map: props.map,
      app: props.app,
      localObserver: this.localObserver,
      apiKey: props.options.apiKey
    });
  }

  onWindowShow = () => {
    this.streetViewModel.activate();
  };

  onWindowHide = () => {
    this.streetViewModel.deactivate();
  };

  onResize = () => {
    this.streetViewModel.showLocation();
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="StreetView"
        custom={{
          icon: <StreetviewIcon />,
          title: "Gatuvy",
          description: "Titta hur området ser ut från gatan",
          height: 300,
          width: 400,
          top: undefined,
          left: undefined,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide,
          onResize: this.onResize
        }}
      >
        <StreetViewView
          localObserver={this.localObserver}
          model={this.streetViewModel}
          parent={this}
          displayPanorama={this.state.displayPanorama}
        />
      </BaseWindowPlugin>
    );
  }
}

export default StreetView;

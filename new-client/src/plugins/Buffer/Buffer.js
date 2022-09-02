import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";
import Observer from "react-event-observer";

import BufferIcon from "@mui/icons-material/Adjust";

import BufferView from "./BufferView.js";
import BufferModel from "./BufferModel.js";

class Buffer extends React.PureComponent {
  constructor(props) {
    super(props);
    this.localObserver = new Observer();

    this.BufferModel = new BufferModel({
      map: props.map,
      localObserver: this.localObserver,
    });
  }

  onWindowShow = () => {
    this.BufferModel.setActive(true);
  };

  onWindowHide = () => {
    this.BufferModel.setActive(false);

    // Ensure that state is reset in view
    this.localObserver.publish("resetView");
    // Ensure that no selected features are left when window
    // is hidden: we want to start over fresh next time!
    // Note: we don't clear the buffer source though as user
    // might want to close this window but keep the buffers visible.
    this.BufferModel.highlightSource.clear();
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="Buffer"
        custom={{
          icon: <BufferIcon />,
          title: "Buffra",
          description: "Skapa en buffer runt objekt utvalda objekt i kartan",
          height: 650,
          width: 400,
          top: undefined,
          left: undefined,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide,
        }}
      >
        <BufferView
          model={this.BufferModel}
          app={this.props.app}
          localObserver={this.localObserver}
        />
      </BaseWindowPlugin>
    );
  }
}
export default Buffer;

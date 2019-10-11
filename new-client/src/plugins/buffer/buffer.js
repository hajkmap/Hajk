import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import BufferIcon from "@material-ui/icons/Adjust";

import BufferView from "./BufferView.js";
import BufferModel from "./BufferModel.js";
import Observer from "react-event-observer";

class Buffer extends React.PureComponent {
  onWindowShow = () => {
    this.BufferModel.setActive(true);
  };

  onWindowHide = () => {
    this.BufferModel.setActive(false);
  };

  constructor(props) {
    super(props);

    this.localObserver = Observer();

    this.BufferModel = new BufferModel({
      map: props.map,
      app: props.app,
      localObserver: this.localObserver
    });
  }

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
          onWindowHide: this.onWindowHide
        }}
      >
        <BufferView
          localObserver={this.localObserver}
          model={this.BufferModel}
          app={this.props.app}
        />
      </BaseWindowPlugin>
    );
  }
}
export default Buffer;

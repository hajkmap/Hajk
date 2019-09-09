import React from "react";
import { withStyles } from "@material-ui/core/styles";
import BaseWindowPlugin from "../BaseWindowPlugin";

import BufferIcon from "@material-ui/icons/Adjust";

import BufferView from "./BufferView.js";
import BufferModel from "./BufferModel.js";
import Observer from "react-event-observer";

const styles = theme => {
  return {};
};

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
        custom={{
          icon: <BufferIcon />,
          title: "Buffra",
          description: "Skapa en buffer runt objekt utvalda objekt i kartan",
          height: "400px",
          width: "400px",
          top: undefined, // Will default to BaseWindowPlugin's top/left
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
export default withStyles(styles)(Buffer);

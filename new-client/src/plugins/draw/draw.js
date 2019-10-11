import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import DrawIcon from "@material-ui/icons/Edit";

import DrawView from "./DrawView";
import DrawModel from "./DrawModel";
import Observer from "react-event-observer";

// Special case as we need to re-style OpenLayers native classes – this is the only way
import "./draw.css";

class Draw extends React.PureComponent {
  constructor(props) {
    super(props);

    this.localObserver = Observer();
    this.drawModel = new DrawModel({
      map: props.map,
      app: props.app,
      options: props.options,
      localObserver: this.localObserver
    });
  }

  onWindowShow = () => {
    this.drawModel.setActive(true);
    this.drawModel.setDrawMethod();
  };

  onWindowHide = () => {
    this.drawModel.setActive(false);
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="Draw"
        custom={{
          icon: <DrawIcon />,
          title: "Rita",
          description: "Rita, mät, importera och exportera",
          height: 600,
          width: 285,
          top: undefined,
          left: undefined,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide
        }}
      >
        <DrawView localObserver={this.localObserver} model={this.drawModel} />
      </BaseWindowPlugin>
    );
  }
}

export default Draw;

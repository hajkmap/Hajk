import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import FormatShapesIcon from "@material-ui/icons/FormatShapes";

import EditView from "./EditView.js";
import EditModel from "./EditModel.js";
import Observer from "react-event-observer";

class Edit extends React.PureComponent {
  onWindowClose = () => {
    this.editModel.deactivate();
  };

  constructor(props) {
    super(props);
    this.localObserver = Observer();
    this.editModel = new EditModel({
      map: props.map,
      app: props.app,
      observer: this.localObserver,
      options: props.options
    });
  }

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        custom={{
          icon: <FormatShapesIcon />,
          title: "Redigera",
          description: "Redigera objekt i kartan (WFS)",
          height: "auto",
          width: "400px",
          top: undefined, // Will default to BaseWindowPlugin's top/left
          left: undefined
        }}
      >
        <EditView
          app={this.props.app}
          model={this.editModel}
          observer={this.localObserver}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Edit;

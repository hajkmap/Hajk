import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import FormatShapesIcon from "@mui/icons-material/FormatShapes";

import EditView from "./EditView.js";
import EditModel from "./EditModel.js";
import Observer from "react-event-observer";

class Edit extends React.PureComponent {
  onWindowHide = () => {
    this.localObserver.publish("resetView");
    this.editModel.reset();
  };

  constructor(props) {
    super(props);
    this.localObserver = Observer();
    this.editModel = new EditModel({
      map: props.map,
      app: props.app,
      observer: this.localObserver,
      options: props.options,
    });
  }

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="Edit"
        custom={{
          icon: <FormatShapesIcon />,
          title: "Redigera",
          description: "Redigera objekt i kartan (WFS)",
          height: 500,
          width: 500,
          top: undefined,
          left: undefined,
          onWindowHide: this.onWindowHide,
        }}
      >
        <EditView
          app={this.props.app}
          model={this.editModel}
          options={this.props.options}
          observer={this.localObserver}
          globalObserver={this.props.app.globalObserver}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Edit;

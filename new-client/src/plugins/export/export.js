import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import PrintIcon from "@material-ui/icons/Print";

import ExportView from "./ExportView";
import ExportModel from "./ExportModel";
import Observer from "react-event-observer";

class Export extends React.PureComponent {
  constructor(props) {
    super(props);

    this.localObserver = Observer();

    this.exportModel = new ExportModel({
      map: props.map,
      app: props.app,
      localObserver: this.localObserver,
      options: props.options
    });
  }

  onWindowShow = () => {
    this.exportModel.displayPreview = true;
  };

  onWindowHide = () => {
    this.exportModel.displayPreview = false;
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type={this.constructor.name}
        custom={{
          icon: <PrintIcon />,
          title: "Exportera",
          description: "Exportera kartan till andra format",
          height: 245,
          width: 315,
          top: undefined,
          left: undefined
        }}
      >
        <ExportView model={this.exportModel} />
      </BaseWindowPlugin>
    );
  }
}

export default Export;

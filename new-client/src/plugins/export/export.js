import React from "react";
import propTypes from "prop-types";

import BaseWindowPlugin from "../BaseWindowPlugin";

import PrintIcon from "@material-ui/icons/Print";

import ExportPdfSettings from "./components/ExportPdfSettings.js";
import ExportModel from "./ExportModel";
import Observer from "react-event-observer";

class Export extends React.PureComponent {
  static propTypes = {
    app: propTypes.object.isRequired,
    map: propTypes.object.isRequired,
    options: propTypes.object.isRequired
  };

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
    this.localObserver.publish("showPreviewLayer");
  };

  onWindowHide = () => {
    this.localObserver.publish("hidePreviewLayer");
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="Export"
        custom={{
          icon: <PrintIcon />,
          title: "Exportera",
          description: "Exportera kartan till andra format",
          height: 365,
          width: 315,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide
        }}
      >
        {/**
          * In the future, when we develop export for other formats,
          * such as TIFF, we can use ExportView here. ExportView 
          * will have tab buttons that will select between the different
          * export modes. But for now, we can as well just render the
          * PDF exporter here.
        
        <ExportView
          model={this.exportModel}
          localObserver={this.localObserver}
        /> */}
        <ExportPdfSettings
          model={this.exportModel}
          localObserver={this.localObserver}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Export;

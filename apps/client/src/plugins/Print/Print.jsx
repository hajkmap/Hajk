import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";
import PrintModel from "./PrintModel";
import PrintView from "./PrintView";
import Observer from "react-event-observer";
import PrintIcon from "@mui/icons-material/Print";

import { PAPER_DIMS_MM, normalizePrintOptions } from "./options/defaults";

class Print extends React.PureComponent {
  // Paper dimensions: Array[width, height]
  dims = PAPER_DIMS_MM;

  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    // Normalize admin-supplied options (scales, dpis, paper formats etc),
    // falling back to defaults where needed. Returns a new object.
    this.options = normalizePrintOptions(
      props.options,
      props.app.config.mapConfig.map
    );

    this.localObserver = Observer();

    this.printModel = new PrintModel({
      localObserver: this.localObserver,
      map: props.map,
      options: this.options,
      dims: this.dims,
      proxy: props.app.config.proxy,
      mapConfig: props.app.config.mapConfig.map,
    });
  }

  onWindowShow = () => {
    this.localObserver.publish("showPrintPreview");
  };

  onWindowHide = () => {
    this.localObserver.publish("hidePrintPreview");
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="Print"
        custom={{
          disablePadding: true,
          icon: <PrintIcon />,
          title: "Skriv ut",
          description: "Skapa en PDF av kartan",
          height: "dynamic",
          width: 350,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide,
        }}
      >
        <PrintView
          model={this.printModel}
          options={this.options}
          localObserver={this.localObserver}
          scales={this.options.scales}
          visibleAtStart={this.options.visibleAtStart}
          enableAppStateInHash={
            this.props.app.config.mapConfig.map.enableAppStateInHash
          }
        />
      </BaseWindowPlugin>
    );
  }
}

export default Print;

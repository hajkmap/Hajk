import React from "react";
import PropTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";
import PrintModel from "./PrintModel";
import PrintView from "./PrintView";
import Observer from "react-event-observer";
import PrintIcon from "@material-ui/icons/Print";

class Print extends React.PureComponent {
  // Paper dimensions: Array[width, height]
  dims = {
    a0: [1189, 841],
    a1: [841, 594],
    a2: [594, 420],
    a3: [420, 297],
    a4: [297, 210],
    a5: [210, 148],
  };

  // Default scales, used if none supplied in options
  scales = [
    100,
    250,
    500,
    1000,
    2500,
    5000,
    10000,
    25000,
    50000,
    100000,
    200000,
    500000,
  ];

  static propTypes = {
    app: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    // Prepare scales from admin options, fallback to default if needed
    if (typeof props?.options?.scales === "string") {
      props.options.scales = props.options.scales.replace(/\s/g, "").split(",");
    }

    // If no valid max logo width is supplied, use a hard-coded default
    props.options.logoMaxWidth =
      typeof props.options?.logoMaxWidth === "number"
        ? props.options.logoMaxWidth
        : 40;

    // Ensure we have a value for the crossOrigin parameter
    props.options.crossOrigin =
      props.app.config.mapConfig.map?.crossOrigin || "anonymous";

    this.localObserver = Observer();

    this.printModel = new PrintModel({
      localObserver: this.localObserver,
      app: props.app,
      map: props.map,
      scales: props.options.scales,
      dims: this.dims,
      logoUrl: props.options.logo,
      logoMaxWidth: props.options.logoMaxWidth,
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
          icon: <PrintIcon />,
          title: "Skriv ut",
          description: "Skapa en PDF av kartan",
          height: 600,
          width: 350,
          onWindowShow: this.onWindowShow,
          onWindowHide: this.onWindowHide,
        }}
      >
        <PrintView
          model={this.printModel}
          app={this.props.app}
          map={this.props.map}
          localObserver={this.localObserver}
          scales={this.props.options.scales}
          visibleAtStart={this.props.options.visibleAtStart}
          dims={this.dims}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Print;

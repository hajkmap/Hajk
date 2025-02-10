import React from "react";
import propTypes from "prop-types";
import BaseWindowPlugin from "../BaseWindowPlugin";

import LayersIcon from "@mui/icons-material/Layers";

import LayerSwitcherProvider from "./LayerSwitcherProvider.js";
import Observer from "react-event-observer";

export default class LayerSwitcher extends React.PureComponent {
  static propTypes = {
    app: propTypes.object.isRequired,
    map: propTypes.object.isRequired,
    options: propTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.localObserver = Observer();
  }

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="LayerSwitcher"
        custom={{
          icon: <LayersIcon />,
          title: "Visa",
          description: "Välj vad du vill se i kartan",
          height: "auto",
          width: 400,
          scrollable: false,
          disablePadding: true,
        }}
      >
        <LayerSwitcherProvider
          app={this.props.app}
          map={this.props.map}
          localObserver={this.localObserver}
          globalObserver={this.props.app.globalObserver}
          options={this.props.options}
        />
      </BaseWindowPlugin>
    );
  }
}

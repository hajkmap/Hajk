import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import SatelliteIcon from "@material-ui/icons/Satellite";

import InformativeView from "./InformativeView.js";
import InformativeModel from "./InformativeModel.js";
import Observer from "react-event-observer";

class Informative extends React.PureComponent {
  constructor(props) {
    super(props);
    this.type = "informative";
    this.options = props.options;
    this.caption = this.options.caption || "Titel";
    this.html = this.options.html || "<div>Html</div>";
    this.app = props.app;

    this.localObserver = Observer();
    this.informativeModel = new InformativeModel({
      map: props.map,
      app: props.app,
      url: props.options.serviceUrl + "/" + props.options.document,
      exportUrl: props.options.exportUrl
    });
  }

  open = chapter => {
    this.localObserver.publish("changeChapter", chapter);
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        custom={{
          icon: <SatelliteIcon />,
          title: "Översiktsplan",
          description: "Läs mer om vad som planeras i kommunen",
          height: "auto",
          width: "400px",
          top: undefined, // Will default to BaseWindowPlugin's top/left
          left: undefined
        }}
      >
        <InformativeView
          app={this.app}
          parent={this}
          observer={this.localObserver}
          caption={this.caption}
          abstract={this.html}
          options={this.options}
        />
      </BaseWindowPlugin>
    );
  }
}

export default Informative;

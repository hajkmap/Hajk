import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import SatelliteIcon from "@material-ui/icons/Satellite";

import InformativeView from "./InformativeView.js";
import InformativeModel from "./InformativeModel.js";
import Observer from "react-event-observer";

class Informative extends React.PureComponent {
  constructor(props) {
    super(props);

    this.options = props.options;
    this.caption = this.options.caption || "Titel";
    this.html = this.options.html || "<div>Html</div>";
    this.app = props.app;

    this.localObserver = Observer();
    this.informativeModel = new InformativeModel({
      app: props.app,
      exportUrl: props.options.exportUrl,
      localObserver: this.localObserver,
      map: props.map,
      url: props.options.serviceUrl + "/" + props.options.document
    });
  }

  /**
   * Shows the Informative Window and opens a specified chapter.
   *
   * Opening the Window is achieved using the globalObserver. Each
   * Plugin has a unique event (named as: "{pluginName}.showWindow"). See
   * BaseWindowPlugin for subscription.
   *
   * @memberof Informative
   */
  open = chapter => {
    this.localObserver.publish("changeChapter", chapter);
    this.app.globalObserver.publish("informative.showWindow", {
      hideOtherPlugins: false
    });
  };

  render() {
    return (
      <BaseWindowPlugin
        {...this.props}
        type="Informative"
        custom={{
          open: this.open, // Expose open() so it can be used from other plugins (LayerSwitcher/BreadCrumbs uses this)
          icon: <SatelliteIcon />,
          title: "Översiktsplan",
          description: "Läs mer om vad som planeras i kommunen",
          height: "auto",
          width: 640
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

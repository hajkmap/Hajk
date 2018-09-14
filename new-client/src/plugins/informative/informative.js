import Plugin from "../../models/Plugin.js";
import Panel from "../../components/Panel.js";
import React from "react";
import { createPortal } from "react-dom";
import SatelliteIcon from "@material-ui/icons/Satellite";
import InformativeView from "./view.js";
import InformativeModel from "./model.js";
import Observer from "react-event-observer";

class Informative extends Plugin {
  constructor(spec) {
    super(spec);
    this.text = "Översiktsplan";
    this.observer = Observer();
    this.observer.subscribe("myEvent", message => {
      console.log(message);
    });
    this.informativeModel = new InformativeModel({
      map: spec.map,
      app: spec.app,
      observer: this.observer
    });
  }

  getButton() {
    return <SatelliteIcon />;
  }

  closePanel = () => {
    if (this.appComponent) {
      this.appComponent.setState({
        secondActivePanel: undefined
      });
    }
  };

  openPanel = (callback) => {
    if (this.appComponent) {
      this.appComponent.setState({
        secondActivePanel: this.type
      }, () => {
        callback(this.observer);
      });
    }
  };

  onClick(e, appComponent) {
    var active = appComponent.state.activePanel === this.type;
    appComponent.setState({
      secondActivePanel: active
        ? ""
        : this.type
    });
  }

  getPanel(activePanel, secondActivePanel) {
    const active = activePanel === this.type || secondActivePanel === this.type;
    return createPortal(
      <Panel
        active={active}
        type={this.type}
        title={this.text}
        onClose={this.closePanel}
        position="right"
      >
        <InformativeView
          app={this.app}
          map={this.map}
          parent={this}
          observer={this.observer}
        />
      </Panel>,
      document.getElementById("map-overlay")
    );
  }
}

export default Informative;

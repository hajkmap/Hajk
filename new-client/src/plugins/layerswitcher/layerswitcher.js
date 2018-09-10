import Plugin from "../../models/Plugin.js";
import Panel from "../../components/Panel.js";
import React, { Component } from "react";
import { createPortal } from "react-dom";
import LayersIcon from "@material-ui/icons/Layers";

class LayerSwitcher extends Plugin {
  constructor(spec) {
    super(spec);
    this.text = "Lagerhanterare";
  }

  getButton() {
    return <LayersIcon />;
  }

  getPanel(activePanel) {
    const active = activePanel === this.type;
    return createPortal(
      <Panel
        active={active}
        type={this.type}
        title={this.text}
        onClose={this.closePanel}
      >
        Hello, World.
      </Panel>,
      document.getElementById("map-overlay")
    );
  }
}

export default LayerSwitcher;

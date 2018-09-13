import Plugin from "../../models/Plugin.js";
import Panel from "../../components/Panel.js";
import React from "react";
import { createPortal } from "react-dom";
import LayersIcon from "@material-ui/icons/Layers";
import LayersSwitcherComponent from "./view.js";

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
    console.log(`${this.type} is active? ${active}`);

    return createPortal(
      <Panel
        active={active}
        type={this.type}
        title={this.text}
        onClose={this.closePanel}
      >
        <LayersSwitcherComponent
          map={this.map}
          app={this.app}
          options={this.options}
        />
      </Panel>,
      document.getElementById("map-overlay")
    );
  }
}

export default LayerSwitcher;

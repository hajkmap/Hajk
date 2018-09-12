import Plugin from "../../models/Plugin.js";
import Panel from "../../components/Panel.js";
import React from "react";
import { createPortal } from "react-dom";
import LayersIcon from "@material-ui/icons/Layers";
import LayerSwitcher from "./view.js";

class Draw extends Plugin {
  constructor(spec) {
    super(spec);
    this.text = "Innehåll";
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
        <LayerSwitcher
          map={this.map}
          app={this.app}
          options={this.options}
        ></LayerSwitcher>
      </Panel>,
      document.getElementById("map-overlay")
    );
  }
}

export default Draw;

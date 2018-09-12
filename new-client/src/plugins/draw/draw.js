import Plugin from "../../models/Plugin.js";
import Panel from "../../components/Panel.js";
import React from "react";
import { createPortal } from "react-dom";
import BrushIcon from "@material-ui/icons/Brush";

class Draw extends Plugin {
  constructor(spec) {
    super(spec);
    this.text = "Rita";
  }

  getButton() {
    return <BrushIcon />;
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
        I can't draw, yet.
      </Panel>,
      document.getElementById("map-overlay")
    );
  }
}

export default Draw;

import Plugin from "../../models/Plugin.js";
import Panel from "../../components/Panel.js";
import React from "react";
import { createPortal } from "react-dom";
import RateReviewIcon from "@material-ui/icons/RateReview";

class Collector extends Plugin {
  constructor(spec) {
    super(spec);
    this.text = "Rita";
  }

  getButton() {
    return <RateReviewIcon />;
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
        Collector
      </Panel>,
      document.getElementById("map-overlay")
    );
  }
}

export default Collector;

import Plugin from "../../models/Plugin.js";
import Panel from "../../components/Panel.js";
import React from "react";
import { createPortal } from "react-dom";
import EditIcon from "@material-ui/icons/Edit";

class Edit extends Plugin {
  constructor(spec) {
    super(spec);
    this.text = "Mät";
  }

  // onClick(e, appComponent) {
  //   alert("Override default behaviour on click.");
  // }

  getButton() {
    return <EditIcon />;
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
        Sorry. Edit no-go for now.
      </Panel>,
      document.getElementById("map-overlay")
    );
  }
}

export default Edit;
